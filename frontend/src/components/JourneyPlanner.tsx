import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Car, Bus, Footprints, Bike, Loader2, Clock, Leaf, Heart, ChevronDown } from 'lucide-react';

const MODES = [
    { key: 'CAR', label: 'Car', icon: Car, co2PerKm: 0.17, calPerKm: 0, speedKmh: 35, color: 'text-alert-crimson', bg: 'bg-alert-crimson/10', ring: 'ring-alert-crimson' },
    { key: 'BUS', label: 'Bus', icon: Bus, co2PerKm: 0.04, calPerKm: 5, speedKmh: 20, color: 'text-electric-cyan', bg: 'bg-electric-cyan/10', ring: 'ring-electric-cyan' },
    { key: 'CYCLE', label: 'Cycle', icon: Bike, co2PerKm: 0, calPerKm: 30, speedKmh: 15, color: 'text-neon-mint', bg: 'bg-neon-mint/10', ring: 'ring-neon-mint' },
    { key: 'WALK', label: 'Walk', icon: Footprints, co2PerKm: 0, calPerKm: 50, speedKmh: 5, color: 'text-neon-mint', bg: 'bg-neon-mint/10', ring: 'ring-neon-mint' },
];

export default function JourneyPlanner() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [distance, setDistance] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [results, setResults] = useState<typeof computed | null>(null);

    type ComputedMode = {
        key: string; label: string; co2: number; cal: number; time: number;
        co2Saved: number; icon: typeof Car; color: string; bg: string;
    };
    const computed: ComputedMode[] = [];

    const handleCompare = () => {
        if (!distance) return;
        setSyncing(true);
        setResults(null);

        setTimeout(() => {
            const km = parseFloat(distance);
            const carCo2 = 0.17 * km;

            const r = MODES.map(m => ({
                key: m.key,
                label: m.label,
                co2: +(m.co2PerKm * km).toFixed(2),
                cal: Math.round(m.calPerKm * km),
                time: Math.round((km / m.speedKmh) * 60),
                co2Saved: +((carCo2 - m.co2PerKm * km)).toFixed(2),
                icon: m.icon,
                color: m.color,
                bg: m.bg,
            }));

            setSyncing(false);
            setResults(r);
        }, 1500);
    };

    const km = parseFloat(distance) || 0;
    const carCo2 = (0.17 * km).toFixed(2);

    return (
        <div className="space-y-4">
            {/* Journey Input Card */}
            <div className="glass p-5 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <MapPin size={16} className="text-neon-mint" /> Plan Your Journey
                </h2>
                <input value={from} onChange={e => setFrom(e.target.value)}
                    placeholder="From (e.g. Home)"
                    className="bg-white/5 w-full p-4 rounded-2xl text-white placeholder-gray-500 outline-none border border-white/10 focus:border-neon-mint transition-colors text-sm" />
                <input value={to} onChange={e => setTo(e.target.value)}
                    placeholder="To (e.g. RGU Campus)"
                    className="bg-white/5 w-full p-4 rounded-2xl text-white placeholder-gray-500 outline-none border border-white/10 focus:border-neon-mint transition-colors text-sm" />
                <input type="number" value={distance} onChange={e => setDistance(e.target.value)}
                    placeholder="Distance in km"
                    className="bg-white/5 w-full p-4 rounded-2xl text-white placeholder-gray-500 outline-none border border-white/10 focus:border-neon-mint transition-colors text-sm" />

                <button onClick={handleCompare} disabled={!distance || syncing}
                    className="w-full p-5 rounded-3xl bg-neon-mint/80 hover:bg-neon-mint text-deep-space font-black text-base uppercase tracking-widest transition-all disabled:opacity-30">
                    {syncing ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 size={20} className="animate-spin" /> Syncing with Scottish National Grid…
                        </span>
                    ) : 'Compare Modes'}
                </button>
            </div>

            {/* Results */}
            <AnimatePresence>
                {results && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                        {/* Driving Baseline */}
                        <div className="glass p-4 border border-alert-crimson/20">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Driving Baseline</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Car size={20} className="text-alert-crimson" />
                                    <span className="font-bold text-alert-crimson">{carCo2} kg CO₂</span>
                                </div>
                                <span className="text-xs text-gray-500">{results[0].time} min</span>
                            </div>
                        </div>

                        {/* Comparison Cards */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <ChevronDown size={14} className="text-neon-mint" />
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Compare vs Driving</p>
                            </div>

                            {results.filter(r => r.key !== 'CAR').map((r, i) => (
                                <motion.div key={r.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.15 }}
                                    className="glass p-5 space-y-3">

                                    {/* Mode Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${r.bg}`}>
                                                <r.icon size={22} className={r.color} />
                                            </div>
                                            <span className="font-black text-lg">{r.label}</span>
                                        </div>
                                        <span className="text-neon-mint font-black text-sm bg-neon-mint/10 px-3 py-1 rounded-full">
                                            -{r.co2Saved} kg
                                        </span>
                                    </div>

                                    {/* Metrics Row */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <Clock size={14} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-lg font-black">{r.time}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">min</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <Leaf size={14} className="mx-auto text-neon-mint mb-1" />
                                            <p className="text-lg font-black">{r.co2}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">kg CO₂</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <Heart size={14} className="mx-auto text-alert-crimson mb-1" />
                                            <p className="text-lg font-black">{r.cal}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">kcal</p>
                                        </div>
                                    </div>

                                    {/* CO2 Savings Bar */}
                                    <div>
                                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                            <span>CO₂ vs Car</span>
                                            <span className="text-neon-mint font-bold">{Math.round((r.co2Saved / parseFloat(carCo2)) * 100)}% less</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((r.co2Saved / parseFloat(carCo2)) * 100)}%` }}
                                                transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                                                className="h-full bg-gradient-to-r from-neon-mint to-electric-cyan rounded-full" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
