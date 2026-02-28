import { useState, useEffect, useCallback } from 'react';
import { api } from './utils/api';
import AuthPage from './components/AuthPage';
import Header from './components/Header';
import JourneyInput from './components/JourneyInput';
import ResultsComparison from './components/ResultsComparison';
import Dashboard from './components/Dashboard';
import AchievementToast from './components/AchievementToast';
import ChatBot from './components/ChatBot';

type View = 'input' | 'results' | 'dashboard';

interface AuthUser {
  id: number;
  name: string;
  email?: string;
}

export default function App() {
  const [view, setView] = useState<View>('input');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [toastAchievements, setToastAchievements] = useState<any[]>([]);

  // Check for saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem('greenroute_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setDemoMode(!parsed.email); // demo user has no email
      } catch {
        localStorage.removeItem('greenroute_user');
      }
    }
  }, []);

  const userId = user?.id || 1;

  const refreshSummary = useCallback(async () => {
    if (!user) return;
    try {
      const s = await api.getUserSummary(user.id);
      setSummary(s);
    } catch {
      // Silently fail - DB might not be ready
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshSummary();
  }, [user, refreshSummary]);

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    setDemoMode(false);
    localStorage.setItem('greenroute_user', JSON.stringify(authUser));
  };

  const handleDemoLogin = async () => {
    try {
      const u = await api.getOrCreateUser('You');
      const demoUser = { id: u.id, name: u.name };
      setUser(demoUser);
      setDemoMode(true);
      localStorage.setItem('greenroute_user', JSON.stringify(demoUser));
    } catch {
      // Fallback if DB isn't ready
      setUser({ id: 1, name: 'You' });
      setDemoMode(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSummary(null);
    setLastResult(null);
    setView('input');
    localStorage.removeItem('greenroute_user');
  };

  const handleJourneyLogged = async (result: any) => {
    setLastResult(result);
    setView('results');
    if (result.new_achievements?.length > 0) {
      setToastAchievements(result.new_achievements);
      setTimeout(() => setToastAchievements([]), 5000);
    }
    await refreshSummary();
  };

  const handleNavigate = (v: View) => {
    setView(v);
    if (v === 'dashboard') refreshSummary();
  };

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onLogin={handleLogin} onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className="min-h-screen">
      <Header
        view={view}
        onNavigate={handleNavigate}
        demoMode={demoMode}
        onToggleDemo={() => setDemoMode(!demoMode)}
        summary={summary}
        userName={user.name}
        onLogout={handleLogout}
      />

      <main className="max-w-4xl mx-auto px-4 pb-8">
        {view === 'input' && (
          <JourneyInput
            userId={userId}
            demoMode={demoMode}
            onJourneyLogged={handleJourneyLogged}
          />
        )}
        {view === 'results' && lastResult && (
          <ResultsComparison
            result={lastResult}
            onLogAnother={() => setView('input')}
            onViewDashboard={() => handleNavigate('dashboard')}
          />
        )}
        {view === 'dashboard' && (
          <Dashboard userId={userId} summary={summary} onRefresh={refreshSummary} />
        )}
      </main>

      {toastAchievements.length > 0 && (
        <AchievementToast
          achievements={toastAchievements}
          onDismiss={() => setToastAchievements([])}
        />
      )}

      {/* AI Chatbot - right side panel */}
      <ChatBot />
    </div>
  );
}
