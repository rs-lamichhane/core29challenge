const API_BASE = '/api';

async function fetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  health: () => fetchJSON('/health'),

  // Auth
  register: (data: { email: string; password: string; name: string }) =>
    fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Users
  getOrCreateUser: (name: string) =>
    fetchJSON('/users', { method: 'POST', body: JSON.stringify({ name }) }),

  getUserSummary: (userId: number) =>
    fetchJSON(`/users/${userId}/summary`),

  // Journeys
  logJourney: (data: {
    user_id: number;
    distance_km: number;
    mode: string;
    date?: string;
    start_location_id?: number;
    end_location_id?: number;
  }) =>
    fetchJSON('/journeys', { method: 'POST', body: JSON.stringify(data) }),

  getJourneys: (userId: number) =>
    fetchJSON(`/journeys?user_id=${userId}`),

  // Locations
  getLocations: () =>
    fetchJSON('/locations'),

  getDistance: (fromId: number, toId: number) =>
    fetchJSON(`/locations/distance?from=${fromId}&to=${toId}`),

  // Leaderboards & Achievements
  getLeaderboards: () =>
    fetchJSON('/leaderboards'),

  getAchievements: (userId: number) =>
    fetchJSON(`/achievements?user_id=${userId}`),

  setWeeklyGoal: (userId: number, target: number) =>
    fetchJSON('/goals', { method: 'POST', body: JSON.stringify({ user_id: userId, target_co2_saved_g: target }) }),
};
