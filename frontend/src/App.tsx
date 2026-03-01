import { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api';
import { SettingsProvider, useSettings } from './utils/SettingsContext';
import { notifyAchievement, notifyStreak, notifyWeeklyGoal } from './utils/notifications';
import AuthPage from './components/AuthPage';
import Header from './components/Header';
import JourneyInput from './components/JourneyInput';
import ResultsComparison from './components/ResultsComparison';
import Dashboard from './components/Dashboard';
import AchievementToast from './components/AchievementToast';
import ChatBot from './components/ChatBot';
import SettingsPanel from './components/SettingsPanel';
import DynamicBackground from './components/DynamicBackground';
import LanguageBar from './components/LanguageBar';
import FriendBattle from './components/FriendBattle';

type View = 'input' | 'results' | 'dashboard';

interface AuthUser {
  id: number;
  name: string;
  email?: string;
}

function AppInner() {
  const { setTotalCo2Saved } = useSettings();
  const [view, setView] = useState<View>('input');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [toastAchievements, setToastAchievements] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('GreenApp_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setDemoMode(!parsed.email);
      } catch {
        localStorage.removeItem('GreenApp_user');
      }
    }
  }, []);

  const userId = user?.id || 1;

  const refreshSummary = useCallback(async () => {
    if (!user) return;
    try {
      const s = await api.getUserSummary(user.id);
      setSummary(s);
      setTotalCo2Saved(s.total_co2_saved_g || 0);
      // Notify on streak milestones
      const streak = s.streak?.current_streak || 0;
      if ([3, 7, 14, 30].includes(streak)) notifyStreak(streak);
      // Notify on weekly goal progress
      const wg = s.weekly_goal;
      if (wg) {
        const pct = (wg.progress_g / wg.target_g) * 100;
        if (pct >= 75) notifyWeeklyGoal(pct);
      }
    } catch { }
  }, [user, setTotalCo2Saved]);

  useEffect(() => {
    if (user) refreshSummary();
  }, [user, refreshSummary]);

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    setDemoMode(false);
    localStorage.setItem('GreenApp_user', JSON.stringify(authUser));
  };

  const handleDemoLogin = async () => {
    try {
      const u = await api.getOrCreateUser('You');
      const demoUser = { id: u.id, name: u.name };
      setUser(demoUser);
      setDemoMode(true);
      localStorage.setItem('GreenApp_user', JSON.stringify(demoUser));
    } catch {
      setUser({ id: 1, name: 'You' });
      setDemoMode(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSummary(null);
    setLastResult(null);
    setView('input');
    localStorage.removeItem('GreenApp_user');
  };

  const handleJourneyLogged = async (result: any) => {
    setLastResult(result);
    setView('results');
    if (result.new_achievements?.length > 0) {
      setToastAchievements(result.new_achievements);
      setTimeout(() => setToastAchievements([]), 5000);
      // Push notifications for achievements
      result.new_achievements.forEach((a: any) => {
        notifyAchievement(a.title, a.description);
      });
    }
    await refreshSummary();
    // Update battle scores after logging a journey
    try { await api.updateBattleScores(userId); } catch { }
  };

  const handleNavigate = (v: View) => {
    setView(v);
    if (v === 'dashboard') refreshSummary();
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <DynamicBackground />
      <LanguageBar />
      <Header
        view={view}
        onNavigate={handleNavigate}
        demoMode={demoMode}
        onToggleDemo={() => setDemoMode(!demoMode)}
        summary={summary}
        userName={user.name}
        onLogout={handleLogout}
      />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 pb-8 overflow-hidden">
        {/* Friend Battle button bar */}
        <div className="flex items-center justify-end gap-2 mt-3 mb-1">
          <FriendBattle userId={userId} userName={user.name} />
        </div>

        {view === 'input' && (
          <JourneyInput userId={userId} demoMode={demoMode} onJourneyLogged={handleJourneyLogged} />
        )}
        {view === 'results' && lastResult && (
          <ResultsComparison result={lastResult} onLogAnother={() => setView('input')} onViewDashboard={() => handleNavigate('dashboard')} />
        )}
        {view === 'dashboard' && (
          <Dashboard userId={userId} summary={summary} onRefresh={refreshSummary} />
        )}
      </main>

      {toastAchievements.length > 0 && (
        <AchievementToast achievements={toastAchievements} onDismiss={() => setToastAchievements([])} />
      )}

      <ChatBot />
      <SettingsPanel />

      {/* SVG filters for colour blind modes */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}
