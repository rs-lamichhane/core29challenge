// Push Notification utilities using the browser Notification API
// (No service worker needed for basic browser notifications)

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function getNotificationPermission(): string {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      icon: '/leaf-icon.png',
      badge: '/leaf-icon.png',
      ...options,
    });
  } catch {
    // Notification failed silently
  }
}

// Pre-built notification types
export function notifyAchievement(title: string, description: string) {
  showNotification(`🏆 Achievement Unlocked: ${title}`, {
    body: description,
    tag: `achievement-${title}`,
  });
}

export function notifyStreak(days: number) {
  showNotification(`⚡ ${days}-Day Streak!`, {
    body: `You've commuted sustainably for ${days} days in a row! Keep going!`,
    tag: 'streak',
  });
}

export function notifyBattleUpdate(opponentName: string, isWinning: boolean) {
  showNotification(
    isWinning ? `💪 You're ahead in your battle!` : `⚔️ ${opponentName} is catching up!`,
    {
      body: isWinning
        ? `Keep logging green journeys to stay ahead of ${opponentName}!`
        : `Log more sustainable journeys to overtake ${opponentName}!`,
      tag: 'battle',
    }
  );
}

export function notifyWeeklyGoal(progress: number) {
  if (progress >= 100) {
    showNotification('🎉 Weekly Goal Achieved!', {
      body: "Congratulations! You've reached your weekly CO₂ saving goal!",
      tag: 'weekly-goal',
    });
  } else if (progress >= 75) {
    showNotification('📈 Almost There!', {
      body: `You're ${progress.toFixed(0)}% of the way to your weekly CO₂ goal!`,
      tag: 'weekly-goal',
    });
  }
}

export function notifyReminder() {
  showNotification('🌱 Log Your Commute', {
    body: "Don't forget to log today's journey and track your CO₂ savings!",
    tag: 'reminder',
  });
}
