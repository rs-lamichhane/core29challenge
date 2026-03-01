import { Leaf, BarChart3, PlusCircle, Flame, Zap, LogOut } from 'lucide-react';

interface HeaderProps {
  view: string;
  onNavigate: (v: any) => void;
  demoMode: boolean;
  onToggleDemo: () => void;
  summary: any;
  userName?: string;
  onLogout?: () => void;
}

export default function Header({ view, onNavigate, demoMode, onToggleDemo, summary, userName, onLogout }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-brand-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('input')}>
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-brand-800 leading-tight">GreenApp</h1>
              <p className="text-[10px] text-brand-600 -mt-0.5">Core29 Sustainability</p>
            </div>
          </div>

          {summary && (
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-brand-600">
                <Leaf className="w-3.5 h-3.5" />
                <span className="font-semibold">{(summary.total_co2_saved_g / 1000).toFixed(1)}kg</span>
                <span className="text-gray-400">saved</span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-semibold">{Math.round(summary.total_calories_kcal)}</span>
                <span className="text-gray-400">kcal</span>
              </div>
              {summary.streak?.current_streak > 0 && (
                <div className="flex items-center gap-1 text-purple-500">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-semibold">{summary.streak.current_streak}d</span>
                  <span className="text-gray-400">streak</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {userName && (
              <span className="hidden sm:block text-xs text-gray-500">
                Hi, <span className="font-medium text-gray-700">{userName}</span>
              </span>
            )}

            <button
              onClick={onToggleDemo}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${demoMode
                  ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-gray-100 text-gray-500'
                }`}
            >
              {demoMode ? '✨ Demo' : 'Demo'}
            </button>

            <nav className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <NavBtn
                active={view === 'input'}
                onClick={() => onNavigate('input')}
                icon={<PlusCircle className="w-4 h-4" />}
                label="Log"
              />
              <NavBtn
                active={view === 'dashboard'}
                onClick={() => onNavigate('dashboard')}
                icon={<BarChart3 className="w-4 h-4" />}
                label="Stats"
              />
            </nav>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active
          ? 'bg-white text-brand-700 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
