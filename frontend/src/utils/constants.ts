export const TRANSPORT_MODES = [
  { key: 'walk', label: 'Walk', icon: '🚶', color: '#10B981' },
  { key: 'cycle', label: 'Cycle', icon: '🚴', color: '#3B82F6' },
  { key: 'e-scooter', label: 'E-Scooter', icon: '🛴', color: '#8B5CF6' },
  { key: 'bus', label: 'Bus', icon: '🚌', color: '#F59E0B' },
  { key: 'train', label: 'Train', icon: '🚆', color: '#06B6D4' },
  { key: 'drive', label: 'Drive', icon: '🚗', color: '#EF4444' },
] as const;

export const DEMO_QUICK_FILLS = [
  { label: '2km Cycle', distance: 2, mode: 'cycle' },
  { label: '5km Walk', distance: 5, mode: 'walk' },
  { label: '8km Bus', distance: 8, mode: 'bus' },
  { label: '12km Train', distance: 12, mode: 'train' },
  { label: '3km E-Scooter', distance: 3, mode: 'e-scooter' },
  { label: '15km Train', distance: 15, mode: 'train' },
];

export function getModeInfo(mode: string) {
  return TRANSPORT_MODES.find(m => m.key === mode) || TRANSPORT_MODES[0];
}
