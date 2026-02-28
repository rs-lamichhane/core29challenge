import { Flame, Trophy, Medal, Star, Bus, Footprints, Car, Bike, TrendingUp, Crown } from 'lucide-react';

const leaderboard = [
    { rank: 1, name: 'You', co2: '42.5 kg', cals: '3,200 kcal', highlight: true },
    { rank: 2, name: 'Alex M.', co2: '38.1 kg', cals: '2,800 kcal', highlight: false },
    { rank: 3, name: 'Sarah K.', co2: '35.7 kg', cals: '2,400 kcal', highlight: false },
    { rank: 4, name: 'Jamie R.', co2: '29.2 kg', cals: '1,900 kcal', highlight: false },
    { rank: 5, name: 'Priya D.', co2: '24.0 kg', cals: '1,600 kcal', highlight: false },
];

const badges = [
    { name: '1,000 Calories', earned: true, icon: Flame, color: 'text-orange-400' },
    { name: '5 Journeys Logged', earned: true, icon: Star, color: 'text-yellow-400' },
    { name: '20kg CO₂ Saved', earned: true, icon: Trophy, color: 'text-neon-mint' },
    { name: '30-Day Green Habit', earned: false, icon: Crown, color: 'text-gray-600' },
];

const streaks = [
    { label: '3-Day Sustainable', done: true },
    { label: '7-Day Low-Carbon', done: true },
    { label: '30-Day Green Habit', done: false },
];

const recentJourneys = [
    { route: 'Bus to RGU Campus', co2: '0 kg', cal: '25 kcal', positive: true, icon: Bus },
    { route: 'Cycled to Dyce', co2: '0 kg', cal: '180 kcal', positive: true, icon: Bike },
    { route: 'Walk to Union St', co2: '0 kg', cal: '120 kcal', positive: true, icon: Footprints },
    { route: 'Drove to Westhill', co2: '1.7 kg', cal: '0 kcal', positive: false, icon: Car },
];

export default function ImpactBoard() {
    return (
        <div className="space-y-5">

            {/* Streak */}
            <div className="glass p-6 text-center">
                <div className="flex items-center justify-center gap-2">
                    <Flame size={32} className="text-orange-400" />
                    <span className="text-5xl font-black">12</span>
                </div>
                <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">Day Green Streak</p>
                <div className="flex justify-center gap-4 mt-4">
                    {streaks.map(s => (
                        <div key={s.label} className={`text-center ${s.done ? '' : 'opacity-30'}`}>
                            <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${s.done ? 'bg-neon-mint/20 text-neon-mint' : 'bg-white/5 text-gray-600'}`}>
                                {s.done ? '✓' : '○'}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 max-w-[60px]">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Leaderboard */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1 mb-3 flex items-center gap-2">
                    <TrendingUp size={14} /> Top CO₂ Savers This Week
                </h3>
                <div className="glass p-3 space-y-2">
                    {leaderboard.map(l => (
                        <div key={l.rank} className={`flex items-center gap-3 p-3 rounded-2xl ${l.highlight ? 'bg-neon-mint/10 ring-1 ring-neon-mint/30' : ''}`}>
                            <span className={`text-base font-black w-7 text-center ${l.rank === 1 ? 'text-yellow-400' : l.rank === 2 ? 'text-gray-300' : l.rank === 3 ? 'text-orange-400' : 'text-gray-600'}`}>
                                {l.rank}
                            </span>
                            <span className="flex-1 font-bold text-sm">{l.name}</span>
                            <div className="text-right">
                                <p className="text-neon-mint font-bold text-xs">{l.co2}</p>
                                <p className="text-gray-500 text-[10px]">{l.cals}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Achievements */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1 mb-3 flex items-center gap-2">
                    <Medal size={14} /> Achievements
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {badges.map(b => (
                        <div key={b.name} className={`glass p-4 flex flex-col items-center gap-2 ${b.earned ? '' : 'opacity-25'}`}>
                            <b.icon size={26} className={b.color} />
                            <span className="text-xs font-bold text-center">{b.name}</span>
                            {b.earned && <span className="text-[9px] text-neon-mint font-bold">EARNED ✓</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Journeys */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1 mb-3">Recent Journeys</h3>
                <div className="space-y-2">
                    {recentJourneys.map((j, i) => (
                        <div key={i} className="glass p-4 flex items-center gap-3">
                            <j.icon size={18} className={j.positive ? 'text-neon-mint' : 'text-alert-crimson'} />
                            <div className="flex-1">
                                <p className="text-sm font-bold">{j.route}</p>
                                <p className="text-[10px] text-gray-500">{j.cal}</p>
                            </div>
                            <span className={`font-bold text-xs ${j.positive ? 'text-neon-mint' : 'text-alert-crimson'}`}>{j.co2}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
