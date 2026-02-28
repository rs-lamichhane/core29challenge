import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Navigation } from 'lucide-react';

// Fix default marker icons in Leaflet + bundler
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  onConfirm: (start: LatLng, end: LatLng, distanceKm: number) => void;
  onClose: () => void;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.3; // 1.3x for approximate road distance
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (latlng: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({ onConfirm, onClose }: Props) {
  const [startPos, setStartPos] = useState<LatLng | null>(null);
  const [endPos, setEndPos] = useState<LatLng | null>(null);
  const [selectingWhat, setSelectingWhat] = useState<'start' | 'end'>('start');

  const distance =
    startPos && endPos
      ? Math.round(haversineKm(startPos.lat, startPos.lng, endPos.lat, endPos.lng) * 10) / 10
      : null;

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
    setSelectingWhat('start');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-gray-800">Select Route on Map</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 py-2 bg-brand-50 border-b border-brand-100">
          <p className="text-xs text-brand-700 font-medium">
            {selectingWhat === 'start' && !startPos && '🟢 Click the map to set your START location'}
            {selectingWhat === 'end' && !endPos && '🔴 Now click to set your END location'}
            {startPos && endPos && `✅ Route set — ${distance} km estimated distance`}
          </p>
        </div>

        {/* Map */}
        <div className="h-[400px] relative">
          <MapContainer
            center={[57.14, -2.11]} // Aberdeen center
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />

            {startPos && (
              <Marker position={[startPos.lat, startPos.lng]} icon={startIcon}>
                <Popup>Start point</Popup>
              </Marker>
            )}
            {endPos && (
              <Marker position={[endPos.lat, endPos.lng]} icon={endIcon}>
                <Popup>End point</Popup>
              </Marker>
            )}
            {startPos && endPos && (
              <Polyline
                positions={[
                  [startPos.lat, startPos.lng],
                  [endPos.lat, endPos.lng],
                ]}
                color="#10B981"
                weight={3}
                dashArray="8 4"
              />
            )}
          </MapContainer>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-500">Start{startPos ? ' ✓' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-500">End{endPos ? ' ✓' : ''}</span>
            </div>
            {distance !== null && (
              <span className="text-xs font-semibold text-brand-600 ml-2">
                <Navigation className="w-3 h-3 inline mr-0.5" />
                {distance} km
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleConfirm}
              disabled={!startPos || !endPos}
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
