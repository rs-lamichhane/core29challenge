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

  // Friend Battles
  getBattles: (userId: number) =>
    fetchJSON(`/battles?user_id=${userId}`),

  createBattle: (challengerId: number, opponentName: string, durationDays?: number) =>
    fetchJSON('/battles', { method: 'POST', body: JSON.stringify({ challenger_id: challengerId, opponent_name: opponentName, duration_days: durationDays }) }),

  acceptBattle: (battleId: number, userId: number) =>
    fetchJSON(`/battles/${battleId}/accept`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

  declineBattle: (battleId: number, userId: number) =>
    fetchJSON(`/battles/${battleId}/decline`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

  updateBattleScores: (userId: number) =>
    fetchJSON('/battles/update-scores', { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

  searchUsers: (query: string, currentUserId: number) =>
    fetchJSON(`/battles/search-users?q=${encodeURIComponent(query)}&user_id=${currentUserId}`),

  // Push Notifications
  subscribeNotifications: (userId: number, subscription: any) =>
    fetchJSON('/notifications/subscribe', { method: 'POST', body: JSON.stringify({ user_id: userId, subscription }) }),

  unsubscribeNotifications: (userId: number) =>
    fetchJSON('/notifications/unsubscribe', { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

  getNotificationStatus: (userId: number) =>
    fetchJSON(`/notifications/status?user_id=${userId}`),
};
