import { useState } from 'react';
import { Route, CloudOff, Trophy, Settings } from 'lucide-react';
import JourneyPlanner from './components/JourneyPlanner';
import DriveMode from './components/DriveMode';
import ImpactBoard from './components/ImpactBoard';
import CarSettings from './components/CarSettings';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'journey' | 'drive' | 'impact'>('journey');
  const [showSettings, setShowSettings] = useState(false);

  if (activeTab === 'drive') {
    return <DriveMode onExit={() => setActiveTab('journey')} />;
  }

  return (
    <div className="min-h-screen bg-deep-space flex flex-col">
      <header className="pt-12 pb-2 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            <span className="hero-gradient">Clear</span>
            <span className="text-white">Path</span>
          </h1>
          <p className="text-gray-500 text-xs tracking-widest uppercase">Make sustainable decisions visible</p>
        </div>
        <button onClick={() => setShowSettings(true)}
          className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 px-4 max-w-lg mx-auto w-full">
        {activeTab === 'journey' && <JourneyPlanner />}
        {activeTab === 'impact' && <ImpactBoard />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 h-22 bg-black/50 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-around px-6 pb-6 pt-2">
        <button onClick={() => setActiveTab('journey')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'journey' ? 'text-neon-mint scale-110' : 'text-gray-500'}`}>
          <Route size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Journey</span>
        </button>

        <button onClick={() => setActiveTab('drive')}
          className="flex flex-col items-center gap-1 text-alert-crimson">
          <div className="p-4 -mt-10 rounded-full bg-alert-crimson/20 ring-2 ring-alert-crimson/40 animate-pulse">
            <CloudOff size={26} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Drive</span>
        </button>

        <button onClick={() => setActiveTab('impact')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'impact' ? 'text-neon-mint scale-110' : 'text-gray-500'}`}>
          <Trophy size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Impact</span>
        </button>
      </nav>

      {/* Settings Overlay */}
      {showSettings && <CarSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
