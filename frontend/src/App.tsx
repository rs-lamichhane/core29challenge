import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// ── Leaflet global (loaded from CDN) ──
declare const L: any

// ── Types ──
interface Alternative {
  mode: string; label: string; emoji: string
  co2Kg: number; timeMin: number; calories: number
  enjoyment: number; tooSlow: boolean
}
interface POI {
  type: string; emoji: string; name: string
  distanceKm: number; lat?: number; lng?: number; nextDeparture?: string
}
interface GreenSuggestion {
  currentMode: string; suggestedMode: string
  suggestedEmoji: string; co2SavedKg: number
}
interface PlanResult {
  origin: string; destination: string; distanceKm: number
  alternatives: Alternative[]; greenSuggestion: GreenSuggestion | null; pois: POI[]
}

const MODES = [
  { value: 'walking', label: '🚶  Walking' },
  { value: 'running', label: '🏃  Running' },
  { value: 'cycling', label: '🚲  Cycling' },
  { value: 'bus', label: '🚌  Bus' },
  { value: 'train', label: '🚆  Train' },
  { value: 'car', label: '🚗  Car' },
  { value: 'plane', label: '✈️  Plane' },
]

type Tab = 'plan' | 'nearby'

// ── Helpers ──
const FALLBACK_MODES_DATA = [
  { mode: 'walking', label: 'Walking', emoji: '🚶', co2PerKm: 0, speedKmh: 5, calPerKm: 50, enjoyment: 4 },
  { mode: 'running', label: 'Running', emoji: '🏃', co2PerKm: 0, speedKmh: 10, calPerKm: 70, enjoyment: 5 },
  { mode: 'cycling', label: 'Cycling', emoji: '🚲', co2PerKm: 0, speedKmh: 15, calPerKm: 30, enjoyment: 5 },
  { mode: 'bus', label: 'Bus', emoji: '🚌', co2PerKm: 0.04, speedKmh: 25, calPerKm: 0, enjoyment: 3 },
  { mode: 'train', label: 'Train', emoji: '🚆', co2PerKm: 0.03, speedKmh: 60, calPerKm: 0, enjoyment: 4 },
  { mode: 'car', label: 'Car', emoji: '🚗', co2PerKm: 0.17, speedKmh: 40, calPerKm: 0, enjoyment: 2 },
  { mode: 'plane', label: 'Plane', emoji: '✈️', co2PerKm: 0.255, speedKmh: 800, calPerKm: 0, enjoyment: 3 },
]

function buildFallback(origin: string, dest: string, preferredMode: string, timeAvail: number | null): PlanResult {
  const dist = 12 + origin.length + dest.length
  const alts: Alternative[] = FALLBACK_MODES_DATA.map(m => {
    const co2Kg = Math.round(m.co2PerKm * dist * 1000) / 1000
    const timeMin = Math.round((dist / m.speedKmh) * 60)
    const calories = Math.round(m.calPerKm * dist)
    return { mode: m.mode, label: m.label, emoji: m.emoji, co2Kg, timeMin, calories, enjoyment: m.enjoyment, tooSlow: timeAvail ? timeMin > timeAvail : false }
  }).sort((a, b) => a.co2Kg - b.co2Kg)

  const pref = alts.find(a => a.mode === preferredMode)
  const green = alts.filter(a => !a.tooSlow)[0] || alts[0]
  const greenSuggestion = pref && pref.co2Kg > green.co2Kg
    ? { currentMode: pref.label, suggestedMode: green.label, suggestedEmoji: green.emoji, co2SavedKg: Math.round((pref.co2Kg - green.co2Kg) * 100) / 100 }
    : null

  return {
    origin, destination: dest, distanceKm: dist, alternatives: alts, greenSuggestion,
    pois: [
      { type: 'bus_stop', emoji: '🚌', name: `Bus stop — ${origin} High St`, distanceKm: 0.08, lat: 57.151, lng: -2.108, nextDeparture: '3 min' },
      { type: 'bike_share', emoji: '🚲', name: `Bike share — ${origin} Centre`, distanceKm: 0.21, lat: 57.152, lng: -2.111, nextDeparture: 'Available now' },
      { type: 'train_station', emoji: '🚆', name: `Train station — ${origin}`, distanceKm: 0.38, lat: 57.147, lng: -2.106, nextDeparture: '15 min' },
    ],
  }
}

function stars(n: number) {
  return '⭐'.repeat(n) + '☆'.repeat(5 - n)
}

// ── App ──
function App() {
  // Form state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [preferredMode, setPreferredMode] = useState('car')
  const [timeAvailable, setTimeAvailable] = useState<number | null>(null)
  const [postcode, setPostcode] = useState('')

  // Location state
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [gpsStatus, setGpsStatus] = useState<string>('')

  // Result state
  const [result, setResult] = useState<PlanResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('plan')

  // Map state
  const [showRouteMap, setShowRouteMap] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Alternative | null>(null)
  const routeMapRef = useRef<HTMLDivElement>(null)
  const routeMapInstance = useRef<any>(null)

  // Nearby state
  const [nearbyPois, setNearbyPois] = useState<POI[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const nearbyMapRef = useRef<HTMLDivElement>(null)
  const nearbyMapInstance = useRef<any>(null)

  // ── GPS ──
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported')
      return
    }
    setGpsStatus('Locating…')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserLat(lat)
        setUserLng(lng)
        // Reverse geocode via Nominatim (free)
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await r.json()
          const name = data.address?.city || data.address?.town || data.address?.village || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setOrigin(name)
          setGpsStatus(`📍 ${name}`)
        } catch {
          setOrigin(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          setGpsStatus(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
      },
      () => setGpsStatus('Location denied — try postcode instead'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Postcode lookup ──
  const handlePostcodeLookup = async () => {
    if (!postcode.trim()) return
    setGpsStatus('Looking up postcode…')
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`)
      const data = await r.json()
      if (data.status === 200 && data.result) {
        const { latitude, longitude, admin_district } = data.result
        setUserLat(latitude)
        setUserLng(longitude)
        const name = admin_district || postcode.trim().toUpperCase()
        setOrigin(name)
        setGpsStatus(`📍 ${name}`)
      } else {
        setGpsStatus('Invalid postcode — try again')
      }
    } catch {
      setGpsStatus('Postcode lookup failed')
    }
  }

  // ── Plan journey ──
  const handlePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination) return
    setLoading(true)
    setShowRouteMap(false)
    setSelectedRoute(null)
    try {
      const res = await fetch('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, preferredMode, timeAvailableMin: timeAvailable, originLat: userLat, originLng: userLng }),
      })
      const data: PlanResult = await res.json()
      setResult(data)
    } catch {
      setResult(buildFallback(origin, destination, preferredMode, timeAvailable))
    } finally {
      setLoading(false)
    }
  }

  // ── Route map ──
  const showRoute = useCallback((alt: Alternative) => {
    setSelectedRoute(alt)
    setShowRouteMap(true)
  }, [])

  useEffect(() => {
    if (!showRouteMap || !routeMapRef.current || !result) return
    // Clean up old map
    if (routeMapInstance.current) {
      routeMapInstance.current.remove()
      routeMapInstance.current = null
    }
    const oLat = userLat || 57.15
    const oLng = userLng || -2.11
    const dLat = oLat + (result.distanceKm / 111) * 0.7
    const dLng = oLng + (result.distanceKm / 85) * 0.7

    const map = L.map(routeMapRef.current).fitBounds([[oLat, oLng], [dLat, dLng]], { padding: [40, 40] })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    L.marker([oLat, oLng]).addTo(map).bindPopup(`<b>Start:</b> ${result.origin}`).openPopup()
    L.marker([dLat, dLng]).addTo(map).bindPopup(`<b>End:</b> ${result.destination}`)

    // Route line
    const midLat = (oLat + dLat) / 2 + (Math.random() - 0.5) * 0.02
    const midLng = (oLng + dLng) / 2 + (Math.random() - 0.5) * 0.02
    L.polyline([[oLat, oLng], [midLat, midLng], [dLat, dLng]], { color: '#00ff88', weight: 4, opacity: 0.8 }).addTo(map)

    // POI markers
    result.pois.forEach(poi => {
      if (poi.lat && poi.lng) {
        L.circleMarker([poi.lat, poi.lng], { radius: 6, color: '#00d4ff', fillColor: '#00d4ff', fillOpacity: 0.7 })
          .addTo(map).bindPopup(`${poi.emoji} ${poi.name}<br>${poi.distanceKm} km`)
      }
    })

    routeMapInstance.current = map
    setTimeout(() => map.invalidateSize(), 100)
  }, [showRouteMap, result, userLat, userLng])

  // ── Nearby discovery ──
  const loadNearby = useCallback(async () => {
    setNearbyLoading(true)
    const lat = userLat || 57.15
    const lng = userLng || -2.11
    try {
      const r = await fetch(`http://localhost:3000/api/nearby?lat=${lat}&lng=${lng}&name=${encodeURIComponent(origin || 'Your location')}`)
      const data = await r.json()
      setNearbyPois(data.pois)
    } catch {
      // Fallback
      setNearbyPois([
        { type: 'bus_stop', emoji: '🚌', name: 'Bus stop — High Street', distanceKm: 0.08, lat: lat + 0.001, lng: lng + 0.002, nextDeparture: '3 min' },
        { type: 'bus_stop', emoji: '🚌', name: 'Bus stop — Station Road', distanceKm: 0.15, lat: lat - 0.0015, lng: lng + 0.001, nextDeparture: '7 min' },
        { type: 'bike_share', emoji: '🚲', name: 'Bike share — City Centre', distanceKm: 0.21, lat: lat + 0.002, lng: lng - 0.001, nextDeparture: 'Available now' },
        { type: 'train_station', emoji: '🚆', name: 'Train station', distanceKm: 0.38, lat: lat - 0.003, lng: lng + 0.004, nextDeparture: '15 min' },
        { type: 'taxi_rank', emoji: '🚕', name: 'Taxi rank — Main Square', distanceKm: 0.12, lat: lat + 0.0005, lng: lng - 0.003, nextDeparture: 'Available now' },
        { type: 'scooter', emoji: '🛴', name: 'E-scooter — Dock A', distanceKm: 0.18, lat: lat + 0.0018, lng: lng + 0.0025, nextDeparture: '3 available' },
      ])
    } finally {
      setNearbyLoading(false)
    }
  }, [userLat, userLng, origin])

  useEffect(() => {
    if (activeTab !== 'nearby' || nearbyPois.length === 0) return
    if (!nearbyMapRef.current) return

    if (nearbyMapInstance.current) {
      nearbyMapInstance.current.remove()
      nearbyMapInstance.current = null
    }

    const lat = userLat || 57.15
    const lng = userLng || -2.11
    const map = L.map(nearbyMapRef.current).setView([lat, lng], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)

    // User marker
    L.circleMarker([lat, lng], { radius: 10, color: '#00ff88', fillColor: '#00ff88', fillOpacity: 0.9 })
      .addTo(map).bindPopup('<b>📍 You are here</b>').openPopup()

    // POI markers
    nearbyPois.forEach(poi => {
      if (poi.lat && poi.lng) {
        const colors: Record<string, string> = {
          bus_stop: '#f59e0b', bike_share: '#10b981', train_station: '#6366f1',
          taxi_rank: '#ec4899', car_park: '#8b5cf6', scooter: '#06b6d4',
        }
        L.circleMarker([poi.lat, poi.lng], { radius: 7, color: colors[poi.type] || '#00d4ff', fillColor: colors[poi.type] || '#00d4ff', fillOpacity: 0.8 })
          .addTo(map).bindPopup(`${poi.emoji} <b>${poi.name}</b><br>${poi.distanceKm} km • ${poi.nextDeparture}`)
      }
    })

    nearbyMapInstance.current = map
    setTimeout(() => map.invalidateSize(), 100)
  }, [activeTab, nearbyPois, userLat, userLng])

  useEffect(() => {
    if (activeTab === 'nearby' && nearbyPois.length === 0) {
      loadNearby()
    }
  }, [activeTab, nearbyPois.length, loadNearby])

  const maxCo2 = result ? Math.max(...result.alternatives.map(a => a.co2Kg), 0.001) : 1

  return (
    <div className="app-container">
      {/* ── Hero ── */}
      <header className="hero">
        <h1 className="hero-text">EcoJourney</h1>
        <p className="hero-sub">Plan smarter. Travel greener. Every kilometre counts.</p>
      </header>

      {/* ── Tab Nav ── */}
      <nav className="tab-nav">
        <button className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>
          🗺️ Plan Journey
        </button>
        <button className={`tab-btn ${activeTab === 'nearby' ? 'active' : ''}`} onClick={() => setActiveTab('nearby')}>
          📍 Transport Near Me
        </button>
      </nav>

      {/* ══════════════════ PLAN TAB ══════════════════ */}
      {activeTab === 'plan' && (
        <>
          <form className="glass journey-form" onSubmit={handlePlan} id="journey-form">
            <h2>🗺️ Plan Your Journey</h2>

            {/* Location bar */}
            <div className="location-bar">
              <button type="button" className="btn btn-outline btn-sm" onClick={handleUseMyLocation} id="gps-button">
                📍 Use My Location
              </button>
              <span className="location-or">or</span>
              <div className="postcode-group">
                <input
                  type="text"
                  placeholder="Enter postcode (e.g. AB10 1FR)"
                  value={postcode}
                  onChange={e => setPostcode(e.target.value)}
                  className="postcode-input"
                  id="postcode-input"
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={handlePostcodeLookup}>
                  🔍 Lookup
                </button>
              </div>
              {gpsStatus && <span className="gps-status">{gpsStatus}</span>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="origin">Origin</label>
                <input id="origin" type="text" placeholder="e.g. Aberdeen" value={origin} onChange={e => setOrigin(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="destination">Destination</label>
                <input id="destination" type="text" placeholder="e.g. Edinburgh" value={destination} onChange={e => setDestination(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="preferred-mode">How do you plan to travel?</label>
                <select id="preferred-mode" value={preferredMode} onChange={e => setPreferredMode(e.target.value)}>
                  {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="time-available">Time available (minutes)</label>
                <input id="time-available" type="number" placeholder="e.g. 60 (optional)" min={1} value={timeAvailable ?? ''} onChange={e => setTimeAvailable(e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" id="plan-button" disabled={loading}>
              {loading ? 'Planning…' : '🌿 Plan My Journey'}
            </button>
          </form>

          {/* ── Results ── */}
          {result && (
            <div className="results-section fade-in">
              {/* Green Suggestion */}
              {result.greenSuggestion && (
                <div className="green-banner glass" id="green-suggestion">
                  <span className="green-banner-emoji">{result.greenSuggestion.suggestedEmoji}</span>
                  <div>
                    <strong>Switch to {result.greenSuggestion.suggestedMode}</strong> and save{' '}
                    <span className="highlight">{result.greenSuggestion.co2SavedKg} kg CO₂</span> compared to {result.greenSuggestion.currentMode}!
                  </div>
                </div>
              )}

              <div className="results-grid">
                {/* Alternatives */}
                <section className="glass" id="alternatives-panel">
                  <h2>🌍 Route Comparison — {result.distanceKm} km</h2>
                  <p className="subtitle">{result.origin} → {result.destination}</p>
                  <div className="alternatives-list">
                    {result.alternatives.map((alt, i) => {
                      const barWidth = maxCo2 > 0 ? (alt.co2Kg / maxCo2) * 100 : 0
                      const isGreenest = i === 0
                      const isPreferred = alt.mode === preferredMode
                      return (
                        <div key={alt.mode} className={`alt-card ${isGreenest ? 'greenest' : ''} ${isPreferred ? 'preferred' : ''} ${alt.tooSlow ? 'too-slow' : ''}`}>
                          <div className="alt-header">
                            <span className="alt-emoji">{alt.emoji}</span>
                            <span className="alt-label">{alt.label}</span>
                            {isGreenest && <span className="badge badge-green">🌱 Greenest</span>}
                            {isPreferred && <span className="badge badge-you">Your pick</span>}
                            {alt.tooSlow && <span className="badge badge-slow">⏰ Too slow</span>}
                          </div>
                          <div className="alt-stats">
                            <div className="stat"><span className="stat-value">{alt.co2Kg}</span><span className="stat-label">kg CO₂</span></div>
                            <div className="stat"><span className="stat-value">{alt.timeMin}</span><span className="stat-label">min</span></div>
                            <div className="stat"><span className="stat-value">{alt.calories || '—'}</span><span className="stat-label">cal</span></div>
                            <div className="stat"><span className="stat-value enjoyment-stars">{stars(alt.enjoyment)}</span><span className="stat-label">enjoyment</span></div>
                          </div>
                          <div className="co2-bar-bg"><div className="co2-bar" style={{ width: `${barWidth}%` }} /></div>
                          <button type="button" className="btn btn-take-route" onClick={() => showRoute(alt)}>
                            🗺️ Take this route
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <button type="button" className="btn btn-outline btn-own-route" onClick={() => { setSelectedRoute(null); setShowRouteMap(true) }}>
                    🛤️ I'll plan my own route
                  </button>
                </section>

                {/* POI sidebar */}
                <section className="glass" id="poi-panel">
                  <h2>📍 Nearby Transit</h2>
                  <p className="subtitle">Points of interest near {result.origin}</p>
                  <div className="poi-list">
                    {result.pois.map((poi, i) => (
                      <div className="poi-card" key={i}>
                        <span className="poi-emoji">{poi.emoji}</span>
                        <div className="poi-info">
                          <span className="poi-name">{poi.name}</span>
                          <span className="poi-dist">{poi.distanceKm} km away{poi.nextDeparture ? ` • ${poi.nextDeparture}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Route Map */}
              {showRouteMap && (
                <div className="glass route-map-section fade-in">
                  <h2>🗺️ {selectedRoute ? `${selectedRoute.emoji} ${selectedRoute.label} Route` : 'Plan Your Route'}</h2>
                  {selectedRoute && (
                    <p className="subtitle">
                      {selectedRoute.co2Kg} kg CO₂ • {selectedRoute.timeMin} min • {selectedRoute.calories || 0} cal
                    </p>
                  )}
                  <div ref={routeMapRef} className="map-container" id="route-map" />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════ NEARBY TAB ══════════════════ */}
      {activeTab === 'nearby' && (
        <div className="nearby-section fade-in">
          <div className="glass">
            <h2>📍 Transport Near Me</h2>
            <p className="subtitle">Discover what's available around you</p>

            {!userLat && (
              <div className="nearby-prompt">
                <p>Share your location to see transport options nearby</p>
                <button type="button" className="btn btn-primary" onClick={handleUseMyLocation}>
                  📍 Use My Location
                </button>
                <div className="postcode-group" style={{ marginTop: '1rem' }}>
                  <input type="text" placeholder="Or enter postcode" value={postcode} onChange={e => setPostcode(e.target.value)} className="postcode-input" />
                  <button type="button" className="btn btn-outline btn-sm" onClick={async () => { await handlePostcodeLookup(); loadNearby() }}>
                    🔍 Search
                  </button>
                </div>
                {gpsStatus && <span className="gps-status">{gpsStatus}</span>}
              </div>
            )}

            <div className="nearby-grid">
              <div ref={nearbyMapRef} className="map-container" id="nearby-map" />
              <div className="nearby-list">
                {nearbyLoading && <p className="loading-text">Finding transport near you…</p>}
                {nearbyPois.map((poi, i) => (
                  <div className="poi-card" key={i}>
                    <span className="poi-emoji">{poi.emoji}</span>
                    <div className="poi-info">
                      <span className="poi-name">{poi.name}</span>
                      <span className="poi-dist">{poi.distanceKm} km away</span>
                      {poi.nextDeparture && <span className="poi-departure">🕐 {poi.nextDeparture}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
