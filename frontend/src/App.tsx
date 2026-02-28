import { useState } from 'react'
import './App.css'

function App() {
  const [dist, setDist] = useState(0)
  const [impact, setImpact] = useState<any>(null)

  const calc = async (mode: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/journeys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceKm: dist, mode })
    })
    const data = await res.json()
    setImpact(data)
  }

  return (
    <div style={{ padding: '4rem 10%' }}>
      <header style={{ textAlign: 'center' }}>
        <h1 className="hero-text">EcoJourney</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Every km matters. Choose green.</p>
      </header>

      <div className="grid">
        <section className="glass">
          <h2>Log a Journey</h2>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="number"
              placeholder="Distance (km)"
              style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              onChange={(e) => setDist(Number(e.target.value))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button className="btn" onClick={() => calc('WALKING')}>Walk</button>
              <button className="btn" onClick={() => calc('CYCLING')}>Cycle</button>
              <button className="btn" onClick={() => calc('PUBLIC')}>Bus/Train</button>
              <button className="btn" style={{ opacity: 0.6 }} onClick={() => calc('DRIVING')}>Drive</button>
            </div>
          </div>
        </section>

        {impact && (
          <section className="glass" style={{ border: '2px solid var(--primary)' }}>
            <h2>Impact</h2>
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '2.5rem' }}>{impact.co2_saved_kg.toFixed(2)} kg</h3>
              <p style={{ color: 'var(--primary)' }}>CO2 Saved vs Driving</p>
              <h3 style={{ fontSize: '2.5rem', marginTop: '1rem' }}>{impact.calories_burned}</h3>
              <p style={{ color: 'var(--secondary)' }}>Calories Burned</p>
            </div>
          </section>
        )}
      </div>

      <div className="grid">
        <div className="glass" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--text-dim)' }}>Global Leaderboard</span>
          <div style={{ marginTop: '1rem' }}>Coming Soon...</div>
        </div>
      </div>
    </div>
  )
}

export default App
