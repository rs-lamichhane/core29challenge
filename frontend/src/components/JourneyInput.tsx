import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Sparkles, Navigation, Map, Zap, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';
import { TRANSPORT_MODES, DEMO_QUICK_FILLS, SMART_ROUTES, t } from '../utils/constants';
import { useSettings } from '../utils/SettingsContext';

const MapPicker = lazy(() => import('./MapPicker'));

interface Props {
  userId: number;
  demoMode: boolean;
  onJourneyLogged: (result: any) => void;
}

interface Location {
  id: number;
  name: string;
  category: string;
  lat: number | null;
  lng: number | null;
}

export default function JourneyInput({ userId, demoMode, onJourneyLogged }: Props) {
  const { language, speak } = useSettings();
  const [distance, setDistance] = useState<string>('');
  const [mode, setMode] = useState<string>('cycle');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [mapRoute, setMapRoute] = useState<string | null>(null);
  const [showSmartRoutes, setShowSmartRoutes] = useState(false);

  // Locations
  const [locations, setLocations] = useState<Location[]>([]);
  const [startLocationId, setStartLocationId] = useState<string>('');
  const [endLocationId, setEndLocationId] = useState<string>('');
  const [distanceAuto, setDistanceAuto] = useState(false);
  const [loadingDistance, setLoadingDistance] = useState(false);

  useEffect(() => {
    api.getLocations().then(setLocations).catch(() => {});
  }, []);

  // Auto-calculate distance when both locations selected
  useEffect(() => {
    if (!startLocationId || !endLocationId) {
      setDistanceAuto(false);
      return;
    }
    if (startLocationId === endLocationId) {
      setError('Start and end locations must be different');
      return;
    }

    setLoadingDistance(true);
    setError('');
    api.getDistance(parseInt(startLocationId), parseInt(endLocationId))
      .then(result => {
        if (result.distance_km !== null) {
          setDistance(result.distance_km.toString());
          setDistanceAuto(true);
        } else {
          setDistanceAuto(false);
          // Don't clear manual distance
        }
      })
      .catch(() => setDistanceAuto(false))
      .finally(() => setLoadingDistance(false));
  }, [startLocationId, endLocationId]);

  const handleSubmit = async () => {
    const d = parseFloat(distance);
    if (isNaN(d) || d <= 0) {
      setError('Please enter a valid distance');
      return;
    }
    if (d > 500) {
      setError('Distance must be under 500 km');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await api.logJourney({
        user_id: userId,
        distance_km: d,
        mode,
        date,
        start_location_id: startLocationId ? parseInt(startLocationId) : undefined,
        end_location_id: endLocationId ? parseInt(endLocationId) : undefined,
      });
      onJourneyLogged(result);
    } catch (err: any) {
      setError(err.message || 'Failed to log journey');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (qf: { distance: number; mode: string }) => {
    setDistance(qf.distance.toString());
    setMode(qf.mode);
    setDistanceAuto(false);
    setMapRoute(null);
  };

  const handleMapConfirm = (start: { lat: number; lng: number }, end: { lat: number; lng: number }, distanceKm: number) => {
    setDistance(distanceKm.toString());
    setDistanceAuto(true);
    setMapRoute(`Map route (${distanceKm} km)`);
    setStartLocationId('');
    setEndLocationId('');
    setShowMap(false);
    speak(`Route selected, ${distanceKm} kilometres`);
  };

  const handleSmartRoute = (route: typeof SMART_ROUTES[0]) => {
    setDistance(route.distance.toString());
    setMode(route.mode);
    setDistanceAuto(true);
    setMapRoute(`${route.from} → ${route.to}`);
    setStartLocationId('');
    setEndLocationId('');
    setShowSmartRoutes(false);
    speak(`Smart route selected: ${route.label}, ${route.distance} kilometres`);
  };

  // Group locations by category
  const aberdeenLocations = locations.filter(l => l.category === 'aberdeen');
  const genericLocations = locations.filter(l => l.category === 'generic');

  return (
    <div className="mt-6 animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
          How did you <span className="text-brand-500">commute</span> today?
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Log your journey and see the impact vs. driving
        </p>
      </div>

      {/* Quick fills in demo mode */}
      {demoMode && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-xs font-medium text-brand-600">Quick demo fills</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEMO_QUICK_FILLS.map(qf => (
              <button
                key={qf.label}
                onClick={() => handleQuickFill(qf)}
                className="px-3 py-1.5 bg-white border border-brand-200 rounded-full text-xs font-medium text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-all shadow-sm"
              >
                {qf.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg shadow-brand-100/50 border border-brand-100 overflow-hidden"
      >
        {/* Route section with location dropdowns */}
        <div className="p-5 border-b border-gray-100">
          {/* Map + Smart Routes buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setShowMap(true); speak('Opening map picker'); }}
              className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Map className="w-4 h-4" />
              {t('btn.map', language)}
            </button>
            <div className="relative flex-1">
              <button
                onClick={() => setShowSmartRoutes(!showSmartRoutes)}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-sm font-medium text-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {t('btn.smartRoutes', language)}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSmartRoutes ? 'rotate-180' : ''}`} />
              </button>
              {showSmartRoutes && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                  {SMART_ROUTES.map((route, i) => {
                    const modeInfo = TRANSPORT_MODES.find(m => m.key === route.mode);
                    return (
                      <button
                        key={i}
                        onClick={() => handleSmartRoute(route)}
                        className="w-full px-3 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{route.label}</div>
                          <div className="text-[10px] text-gray-400">{route.from} → {route.to}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{modeInfo?.icon}</span>
                          <span className="text-[10px] font-semibold text-purple-600">{route.distance}km</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {mapRoute && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg mb-3 text-xs text-blue-700">
              <Map className="w-3.5 h-3.5" />
              {mapRoute} — selected via map
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-brand-400 ring-2 ring-brand-100"></div>
              <div className="w-0.5 h-8 bg-gray-200"></div>
              <div className="w-3 h-3 rounded-full bg-red-400 ring-2 ring-red-100"></div>
            </div>
            <div className="flex-1 space-y-2">
              <LocationSelect
                value={startLocationId}
                onChange={setStartLocationId}
                placeholder="Select start location"
                aberdeenLocations={aberdeenLocations}
                genericLocations={genericLocations}
              />
              <LocationSelect
                value={endLocationId}
                onChange={setEndLocationId}
                placeholder="Select destination"
                aberdeenLocations={aberdeenLocations}
                genericLocations={genericLocations}
              />
            </div>
          </div>

          {/* Distance auto-calculated banner */}
          {distanceAuto && (
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 rounded-lg mb-3 text-xs text-brand-700">
              <Navigation className="w-3.5 h-3.5" />
              Distance auto-calculated from selected locations ({distance} km)
            </div>
          )}

          {loadingDistance && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg mb-3 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              Calculating distance...
            </div>
          )}

          {/* Distance + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Distance (km) {distanceAuto && <span className="text-brand-500">• auto</span>}
              </label>
              <input
                type="number"
                min="0.1"
                max="500"
                step="0.1"
                value={distance}
                onChange={e => { setDistance(e.target.value); setDistanceAuto(false); }}
                placeholder="e.g., 5"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm font-medium border border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Transport mode selector */}
        <div className="p-5 border-b border-gray-100">
          <label className="text-xs font-medium text-gray-500 mb-3 block">Transport Mode</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {TRANSPORT_MODES.map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  mode === m.key
                    ? 'border-brand-400 bg-brand-50 shadow-md shadow-brand-100'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl">{m.icon}</span>
                <span className={`text-[11px] font-medium ${mode === m.key ? 'text-brand-700' : 'text-gray-600'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="p-5">
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg">
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !distance}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Compare & Log Journey
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Map picker modal */}
      {showMap && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>}>
          <MapPicker onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />
        </Suspense>
      )}
    </div>
  );
}

function LocationSelect({ value, onChange, placeholder, aberdeenLocations, genericLocations }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  aberdeenLocations: Location[];
  genericLocations: Location[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all appearance-none cursor-pointer ${
        !value ? 'text-gray-400' : 'text-gray-700 font-medium'
      }`}
    >
      <option value="">{placeholder}</option>
      {aberdeenLocations.length > 0 && (
        <optgroup label="📍 Aberdeen">
          {aberdeenLocations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </optgroup>
      )}
      {genericLocations.length > 0 && (
        <optgroup label="🏠 General">
          {genericLocations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
