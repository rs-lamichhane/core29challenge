export type TransportMode = 'walk' | 'cycle' | 'e-scooter' | 'bus' | 'train' | 'drive' | 'boat' | 'plane';

interface ModeConfig {
  speed_kmh: number;
  overhead_min: number;
  co2_g_per_km: number;
  calories_per_km: number;
}

const MODE_CONFIG: Record<TransportMode, ModeConfig> = {
  walk:       { speed_kmh: 5,  overhead_min: 0, co2_g_per_km: 0,   calories_per_km: 50 },
  cycle:      { speed_kmh: 15, overhead_min: 0, co2_g_per_km: 0,   calories_per_km: 30 },
  'e-scooter':{ speed_kmh: 18, overhead_min: 0, co2_g_per_km: 20,  calories_per_km: 10 },
  bus:        { speed_kmh: 20, overhead_min: 5, co2_g_per_km: 80,  calories_per_km: 0  },
  train:      { speed_kmh: 35, overhead_min: 8, co2_g_per_km: 40,  calories_per_km: 0  },
  drive:      { speed_kmh: 30, overhead_min: 3, co2_g_per_km: 170, calories_per_km: 0  },
  boat:       { speed_kmh: 25, overhead_min: 15, co2_g_per_km: 120, calories_per_km: 0 },
  plane:      { speed_kmh: 800, overhead_min: 90, co2_g_per_km: 255, calories_per_km: 0 },
};

export interface JourneyCalculation {
  time_min: number;
  co2_g: number;
  calories_kcal: number;
  drive_time_min: number;
  drive_co2_g: number;
  vs_drive_co2_saved_g: number;
  vs_drive_time_delta_min: number;
  vs_drive_calories_delta_kcal: number;
}

export function calculateJourney(distance_km: number, mode: TransportMode): JourneyCalculation {
  const chosen = MODE_CONFIG[mode];
  const driving = MODE_CONFIG.drive;

  const time_min = round2((distance_km / chosen.speed_kmh) * 60 + chosen.overhead_min);
  const co2_g = round2(distance_km * chosen.co2_g_per_km);
  const calories_kcal = round2(distance_km * chosen.calories_per_km);

  const drive_time_min = round2((distance_km / driving.speed_kmh) * 60 + driving.overhead_min);
  const drive_co2_g = round2(distance_km * driving.co2_g_per_km);

  return {
    time_min,
    co2_g,
    calories_kcal,
    drive_time_min,
    drive_co2_g,
    vs_drive_co2_saved_g: round2(drive_co2_g - co2_g),
    vs_drive_time_delta_min: round2(time_min - drive_time_min),
    vs_drive_calories_delta_kcal: round2(calories_kcal - 0),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Impact equivalents for innovation feature
export function getImpactEquivalents(co2_saved_g: number) {
  return {
    phone_charges: round2(co2_saved_g / 8.22),        // ~8.22g CO2 per phone charge
    kettle_boils: round2(co2_saved_g / 70),            // ~70g CO2 per kettle boil
    km_driving_avoided: round2(co2_saved_g / 170),     // our drive factor
    trees_year_fraction: round2(co2_saved_g / 22000),  // tree absorbs ~22kg/year
    led_bulb_hours: round2(co2_saved_g / 4.1),         // ~4.1g CO2 per hour of LED
  };
}

export function getCalorieEquivalents(calories: number) {
  return {
    jogging_minutes: round2(calories / 10),   // ~10 kcal/min jogging
    swimming_minutes: round2(calories / 8),   // ~8 kcal/min swimming
    yoga_minutes: round2(calories / 4),       // ~4 kcal/min yoga
    chocolate_bars: round2(calories / 230),   // ~230 kcal per bar
  };
}
