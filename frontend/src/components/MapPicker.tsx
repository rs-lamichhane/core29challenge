import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Navigation, Route } from 'lucide-react';

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface LatLng { lat: number; lng: number; }

interface Props {
  onConfirm: (start: LatLng, end: LatLng, distanceKm: number) => void;
  onClose: () => void;
}

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({ click(e) { onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

// Use OSRM (free, public) for road-based routing
async function getOSRMRoute(start: LatLng, end: LatLng): Promise<{ distance_km: number; route_coords: [number, number][] } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes.length > 0) {
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
      return {
        distance_km: Math.round((route.distance / 1000) * 10) / 10,
        route_coords: coords,
      };
    }
  } catch {
    // Fallback to haversine
  }
  return null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
}

export default function MapPicker({ onConfirm, onClose }: Props) {
  const [startPos, setStartPos] = useState<LatLng | null>(null);
  const [endPos, setEndPos] = useState<LatLng | null>(null);
  const [selectingWhat, setSelectingWhat] = useState<'start' | 'end'>('start');
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeMethod, setRouteMethod] = useState<'osrm' | 'haversine'>('osrm');

  // Fetch road route when both points are set
  useEffect(() => {
    if (!startPos || !endPos) {
      setRouteCoords([]);
      setDistance(null);
      return;
    }

    setLoadingRoute(true);
    getOSRMRoute(startPos, endPos).then(result => {
      if (result) {
        setRouteCoords(result.route_coords);
        setDistance(result.distance_km);
        setRouteMethod('osrm');
      } else {
        // Fallback to straight line
        setRouteCoords([[startPos.lat, startPos.lng], [endPos.lat, endPos.lng]]);
        setDistance(Math.round(haversineKm(startPos.lat, startPos.lng, endPos.lat, endPos.lng) * 10) / 10);
        setRouteMethod('haversine');
      }
      setLoadingRoute(false);
    });
  }, [startPos, endPos]);

  const handleMapClick = (latlng: LatLng) => {
    if (selectingWhat === 'start') {
      setStartPos(latlng);
      setSelectingWhat('end');
    } else {
      setEndPos(latlng);
    }
  };

  const handleConfirm = () => {
    if (startPos && endPos && distance) {
      onConfirm(startPos, endPos, distance);
    }
  };

  const handleReset = () => {
    setStartPos(null);
    setEndPos(null);
    setRouteCoords([]);
    setDistance(null);
    setSelectingWhat('start');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-gray-800 dark:text-white">Select Route on Map</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-2 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-100 dark:border-brand-800">
          <p className="text-xs text-brand-700 dark:text-brand-400 font-medium">
            {loadingRoute && '⏳ Calculating road route...'}
            {!loadingRoute && selectingWhat === 'start' && !startPos && '🟢 Click the map to set your START location'}
            {!loadingRoute && selectingWhat === 'end' && !endPos && '🔴 Now click to set your END location'}
            {!loadingRoute && startPos && endPos && distance && (
              <>✅ Route set — {distance} km via {routeMethod === 'osrm' ? 'road' : 'estimate'}</>
            )}
          </p>
        </div>

        <div className="h-[400px] relative">
          <MapContainer center={[57.14, -2.11]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {startPos && <Marker position={[startPos.lat, startPos.lng]} icon={startIcon}><Popup>Start</Popup></Marker>}
            {endPos && <Marker position={[endPos.lat, endPos.lng]} icon={endIcon}><Popup>End</Popup></Marker>}
            {routeCoords.length > 0 && (
              <Polyline
                positions={routeCoords}
                color={routeMethod === 'osrm' ? '#10B981' : '#F59E0B'}
                weight={routeMethod === 'osrm' ? 4 : 3}
                dashArray={routeMethod === 'osrm' ? undefined : '8 4'}
              />
            )}
          </MapContainer>

          {/* Route method badge */}
          {distance && (
            <div className="absolute top-3 right-3 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {distance} km
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                routeMethod === 'osrm' ? 'bg-brand-100 text-brand-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {routeMethod === 'osrm' ? 'Road' : 'Est.'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-500">Start{startPos ? ' ✓' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-500">End{endPos ? ' ✓' : ''}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Reset
            </button>
            <button
              onClick={handleConfirm}
              disabled={!startPos || !endPos || loadingRoute}
              className="px-4 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:bg-gray-300 transition-colors"
            >
              Confirm Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
