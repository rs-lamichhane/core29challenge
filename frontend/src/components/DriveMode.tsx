import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { loadCarProfile, getEmissionRate } from './CarSettings';

interface DriveModeProps {
    onExit: () => void;
}

export default function DriveMode({ onExit }: DriveModeProps) {
    const [smokeLevel, setSmokeLevel] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const watchRef = useRef<number | null>(null);

    // Load car profile to determine smoke rate
    const carProfile = loadCarProfile();
    const emissionRate = getEmissionRate(carProfile);
    // Normalized: 0.17 kg/km is "standard". Higher = faster smoke, lower = slower, 0 = no smoke
    const smokeMultiplier = emissionRate / 0.17;

    const startSmoke = useCallback(() => {
        setIsActive(true);

        if ('geolocation' in navigator) {
            watchRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const speed = pos.coords.speed ? pos.coords.speed * 3.6 : 0;
                    if (speed > 10) {
                        setSmokeLevel(prev => Math.min(prev + 0.02 * smokeMultiplier, 1));
                    }
                },
                () => { startSimulation(); },
                { enableHighAccuracy: true, maximumAge: 2000 }
            );
        }
        startSimulation();
    }, [smokeMultiplier]);

    const startSimulation = () => {
        intervalRef.current = setInterval(() => {
            setSmokeLevel(prev => {
                if (prev >= 1) return 1;
                // Rate scales with car emission profile
                const baseRate = 0.008 + Math.random() * 0.006;
                return Math.min(prev + baseRate * smokeMultiplier, 1);
            });
        }, 500);
    };

    const cleanup = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };

    useEffect(() => { return cleanup; }, []);

    const particleCount = Math.floor(smokeLevel * 20);
    const isElectric = emissionRate === 0;

    return (
        <div className="fixed inset-0 z-[100] bg-deep-space overflow-hidden">
            <button onClick={() => { cleanup(); onExit(); }}
                className="absolute top-14 right-6 z-50 p-3 rounded-2xl bg-white/10 text-white/60">
                <X size={20} />
            </button>

            {/* Electric vehicle — clear skies */}
            {isElectric && isActive && (
                <>
                    <motion.div animate={{ opacity: 0.15 }} className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.1), transparent 60%)' }} />
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                            className="text-center px-8">
                            <p className="text-neon-mint/60 text-sm font-medium">Clear skies. Zero tailpipe emissions.</p>
                        </motion.div>
                    </div>
                </>
            )}

            {/* Smoke layers — only for combustion engines */}
            {!isElectric && Array.from({ length: Math.min(Math.floor(smokeLevel * 8), 8) }).map((_, i) => (
                <motion.div key={`layer-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.12 + i * 0.08 }}
                    transition={{ duration: 3, delay: i * 0.4 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at ${40 + i * 5}% ${100 - i * 10}%, rgba(120,120,120,${0.08 + i * 0.05}), transparent 60%)`,
                    }}
                />
            ))}

            {!isElectric && (
                <motion.div animate={{ opacity: smokeLevel * 0.7 }} transition={{ duration: 1 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(30,30,30,0.4), transparent)' }}
                />
            )}

            {/* Floating particles */}
            {!isElectric && isActive && Array.from({ length: particleCount }).map((_, i) => (
                <motion.div key={`p-${i}`}
                    initial={{ opacity: 0, y: 50, x: Math.random() * 100 + '%' }}
                    animate={{
                        opacity: [0, 0.2 + Math.random() * 0.15, 0],
                        y: [window.innerHeight * (0.5 + Math.random() * 0.5), -100],
                        x: `${Math.random() * 100}%`,
                        scale: [0.5, 1.5 + Math.random()],
                    }}
                    transition={{ duration: 6 + Math.random() * 6, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: 60 + Math.random() * 80, height: 60 + Math.random() * 80,
                        background: `radial-gradient(circle, rgba(${150 + Math.random() * 50},${130 + Math.random() * 40},${120 + Math.random() * 30},0.12), transparent 70%)`,
                        filter: 'blur(20px)',
                    }}
                />
            ))}

            {/* Center content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
                {!isActive ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                                className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-gray-600/30" />
                            </motion.div>
                        </div>
                        <div>
                            <p className="text-white/80 text-lg font-bold">See what driving really looks like</p>
                            <p className="text-gray-500 text-sm mt-2">Your screen fills with the CO₂ your car produces</p>
                            <p className="text-gray-600 text-xs mt-3">
                                {carProfile.fuelType === 'electric' ? '⚡ Electric vehicle — expect clear skies' :
                                    `${carProfile.fuelType.charAt(0).toUpperCase() + carProfile.fuelType.slice(1)} ${carProfile.vehicleClass} · ${emissionRate.toFixed(2)} kg/km`}
                            </p>
                        </div>
                        <button onClick={startSmoke}
                            className="w-full p-5 rounded-3xl bg-white/10 text-white font-black text-lg uppercase tracking-widest border border-white/10">
                            Start Driving
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 1 }} animate={{ opacity: Math.max(1 - smokeLevel * 1.5, 0) }}
                        className="text-center">
                        {smokeLevel < 0.3 && !isElectric && (
                            <p className="text-white/40 text-sm">The air around you is changing…</p>
                        )}
                    </motion.div>
                )}

                {!isElectric && smokeLevel > 0.6 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
                        className="absolute bottom-32 text-white/50 text-center text-sm px-8 font-medium">
                        This is the CO₂ from just one journey.
                    </motion.p>
                )}

                {((smokeLevel >= 0.95 && !isElectric) || (isElectric && isActive)) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-16 w-full px-8">
                        <button onClick={() => { cleanup(); onExit(); }}
                            className="w-full p-5 rounded-3xl bg-neon-mint/90 text-deep-space font-black text-base uppercase tracking-widest">
                            Choose a cleaner path
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
