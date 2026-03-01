import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Square, Play, Clock, Route, Gauge } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LatLng { lat: number; lng: number; }

interface Props {
    userId: number;
    demoMode: boolean;
    onJourneyComplete: (data: {
        distance_km: number;
        mode: string;
        start_name: string;
        end_name: string;
    }) => void;
    onCancel: () => void;
}

const TRANSPORT_MODES = [
    { key: 'walk', label: 'Walk', icon: '🚶', speed: 5 },
    { key: 'cycle', label: 'Cycle', icon: '🚴', speed: 15 },
    { key: 'e-scooter', label: 'E-Scooter', icon: '🛴', speed: 18 },
    { key: 'bus', label: 'Bus', icon: '🚌', speed: 20 },
    { key: 'train', label: 'Train', icon: '🚆', speed: 35 },
    { key: 'drive', label: 'Drive', icon: '🚗', speed: 30 },
];

// CO2 per km in grams
const CO2_PER_KM: Record<string, number> = {
    walk: 0, cycle: 0, 'e-scooter': 20, bus: 80, train: 40, drive: 170,
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`);
        const data = await res.json();
        return data.display_name?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Sub-component to auto-pan map to current position
function MapFollower({ position }: { position: LatLng | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
        }
    }, [position, map]);
    return null;
}

export default function LiveTracker({ userId, demoMode, onJourneyComplete, onCancel }: Props) {
    const [mode, setMode] = useState<string | null>(null);
    const [tracking, setTracking] = useState(false);
    const [position, setPosition] = useState<LatLng | null>(null);
    const [trail, setTrail] = useState<LatLng[]>([]);
    const [distance, setDistance] = useState(0);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [error, setError] = useState('');
    const [stopping, setStopping] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const lastPosRef = useRef<LatLng | null>(null);

    // Get initial position on mount - properly handle permissions
    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setError('Geolocation not supported by this browser.');
            return;
        }

        const requestLocation = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setError('');
                },
                (err) => {
                    if (err.code === 1) {
                        setError('📍 Location permission denied. Please allow location access in your browser settings and reload the page.');
                    } else if (err.code === 2) {
                        setError('📍 Location unavailable. Make sure GPS/Location is turned on in your device settings.');
                    } else {
                        setError('📍 Location request timed out. Please check your GPS signal and try again.');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        // Check permission state first (if supported)
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then(result => {
                if (result.state === 'denied') {
                    setError('📍 Location access is blocked. To enable, go to your browser settings → Site Settings → Location, and allow access for this site.');
                } else {
                    // 'prompt' or 'granted' — call getCurrentPosition which will trigger the prompt if needed
                    requestLocation();
                }
                // Watch for future changes
                result.onchange = () => {
                    if (result.state === 'granted') {
                        setError('');
                        requestLocation();
                    }
                };
            }).catch(() => {
                // permissions API not available, just try directly
                requestLocation();
            });
        } else {
            requestLocation();
        }

        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startTracking = useCallback(() => {
        if (!mode) return;
        setTracking(true);
        setTrail(position ? [position] : []);
        setDistance(0);
        setElapsedSec(0);
        startTimeRef.current = Date.now();
        lastPosRef.current = position;

        // Start elapsed timer
        timerRef.current = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        // Start GPS watching
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);

                // Only add to trail if moved > 5 meters (noise filter)
                if (lastPosRef.current) {
                    const segmentDist = haversineKm(lastPosRef.current.lat, lastPosRef.current.lng, newPos.lat, newPos.lng);
                    if (segmentDist > 0.005) { // 5 meters
                        setTrail(prev => [...prev, newPos]);
                        setDistance(prev => prev + segmentDist);
                        lastPosRef.current = newPos;
                    }
                } else {
                    lastPosRef.current = newPos;
                    setTrail(prev => [...prev, newPos]);
                }
            },
            (err) => setError(`GPS Error: ${err.message}`),
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );
    }, [mode, position]);

    const stopTracking = useCallback(async () => {
        setStopping(true);

        // Stop GPS and timer
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Reverse geocode start and end
        let startName = 'Start';
        let endName = 'End';
        if (trail.length > 0) {
            startName = await reverseGeocode(trail[0].lat, trail[0].lng);
            const last = trail[trail.length - 1];
            endName = await reverseGeocode(last.lat, last.lng);
        }

        onJourneyComplete({
            distance_km: Math.round(distance * 100) / 100,
            mode: mode!,
            start_name: startName,
            end_name: endName,
        });
    }, [trail, distance, mode, onJourneyComplete]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const co2Estimate = distance * (CO2_PER_KM[mode || 'drive'] || 170);
    const co2Saved = distance * 170 - co2Estimate;

    // Phase 1: Select transport mode
    if (!tracking && !mode) {
        return (
            <div className="animate-fade-in-up">
                <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Navigation className="w-7 h-7 text-brand-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Live GPS Tracking</h2>
                    <p className="text-sm text-gray-500 mt-1">Select your transport mode to start recording</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-brand-100 p-5">
                    <label className="text-xs font-medium text-gray-500 mb-3 block">How are you travelling?</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                        {TRANSPORT_MODES.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setMode(m.key)}
                                className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-gray-100 hover:border-brand-300 bg-gray-50 hover:bg-brand-50 transition-all"
                            >
                                <span className="text-2xl">{m.icon}</span>
                                <span className="text-[11px] font-medium text-gray-600">{m.label}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Back to Manual Log
                    </button>
                </div>

                {error && (
                    <div className="mt-3 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>
                )}
            </div>
        );
    }

    // Phase 2: Mode selected, ready to start
    if (!tracking && mode) {
        const modeInfo = TRANSPORT_MODES.find(m => m.key === mode)!;
        return (
            <div className="animate-fade-in-up">
                <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{modeInfo.icon}</div>
                    <h2 className="text-xl font-bold text-gray-800">Ready to Track</h2>
                    <p className="text-sm text-gray-500 mt-1">Tap Start when you begin your {modeInfo.label.toLowerCase()} journey</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-brand-100 overflow-hidden">
                    {/* Map preview */}
                    {position && (
                        <div className="h-48 relative">
                            <MapContainer
                                center={[position.lat, position.lng]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                                attributionControl={false}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <CircleMarker
                                    center={[position.lat, position.lng]}
                                    radius={8}
                                    pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8, weight: 3 }}
                                />
                            </MapContainer>
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] text-gray-500 z-[500]">
                                📍 Your location
                            </div>
                        </div>
                    )}

                    <div className="p-5 space-y-3">
                        <button
                            onClick={startTracking}
                            disabled={!position}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-200"
                        >
                            <Play className="w-5 h-5" fill="white" />
                            Start Tracking
                        </button>
                        <button
                            onClick={() => setMode(null)}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← Change transport mode
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>
                )}
            </div>
        );
    }

    // Phase 3: Actively tracking
    const modeInfo = TRANSPORT_MODES.find(m => m.key === mode)!;
    return (
        <div className="animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-lg border border-brand-100 overflow-hidden">
                {/* Live map */}
                <div className="h-64 sm:h-80 relative">
                    {position && (
                        <MapContainer
                            center={[position.lat, position.lng]}
                            zoom={16}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            attributionControl={false}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapFollower position={position} />

                            {/* Trail polyline */}
                            {trail.length > 1 && (
                                <Polyline
                                    positions={trail.map(p => [p.lat, p.lng])}
                                    pathOptions={{ color: '#10B981', weight: 4, opacity: 0.8 }}
                                />
                            )}

                            {/* Current position - pulsing dot */}
                            <CircleMarker
                                center={[position.lat, position.lng]}
                                radius={10}
                                pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.9, weight: 3 }}
                            />
                            <CircleMarker
                                center={[position.lat, position.lng]}
                                radius={20}
                                pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.15, weight: 1 }}
                            />
                        </MapContainer>
                    )}

                    {/* Tracking badge */}
                    <div className="absolute top-3 left-3 z-[500]">
                        <motion.div
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
                        >
                            <div className="w-2 h-2 bg-white rounded-full" />
                            TRACKING LIVE
                        </motion.div>
                    </div>

                    {/* Mode badge */}
                    <div className="absolute top-3 right-3 z-[500] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm">
                        {modeInfo.icon} {modeInfo.label}
                    </div>
                </div>

                {/* Live stats */}
                <div className="grid grid-cols-3 gap-0 border-t border-gray-100">
                    <div className="p-3 text-center border-r border-gray-100">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                            <Route className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-medium">Distance</span>
                        </div>
                        <div className="text-lg font-bold text-gray-800">{distance.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400">km</div>
                    </div>
                    <div className="p-3 text-center border-r border-gray-100">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-medium">Time</span>
                        </div>
                        <div className="text-lg font-bold text-gray-800">{formatTime(elapsedSec)}</div>
                        <div className="text-[10px] text-gray-400">elapsed</div>
                    </div>
                    <div className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                            <Gauge className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-medium">CO₂ Saved</span>
                        </div>
                        <div className={`text-lg font-bold ${co2Saved > 0 ? 'text-brand-600' : 'text-gray-800'}`}>
                            {co2Saved > 0 ? `+${(co2Saved / 1000).toFixed(1)}` : '0.0'}
                        </div>
                        <div className="text-[10px] text-gray-400">kg vs driving</div>
                    </div>
                </div>

                {/* Stop button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={stopTracking}
                        disabled={stopping || distance < 0.01}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-200"
                    >
                        <Square className="w-5 h-5" fill="white" />
                        {stopping ? 'Saving Journey...' : 'Stop & Save Journey'}
                    </button>
                    {distance < 0.01 && (
                        <p className="text-center text-[10px] text-gray-400 mt-2">Start moving to enable saving</p>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-3 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>
            )}
        </div>
    );
}
