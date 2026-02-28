import { useState, useEffect } from 'react';
import { Car, Fuel, Gauge, X, Check } from 'lucide-react';

export interface CarProfile {
    fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
    engineSize: 'small' | 'medium' | 'large';
    vehicleClass: 'hatchback' | 'sedan' | 'suv' | 'van';
}

// CO2 kg/km based on real-world averages for each combination
const EMISSION_RATES: Record<string, Record<string, Record<string, number>>> = {
    petrol: { small: { hatchback: 0.12, sedan: 0.14, suv: 0.18, van: 0.22 }, medium: { hatchback: 0.14, sedan: 0.17, suv: 0.22, van: 0.26 }, large: { hatchback: 0.17, sedan: 0.20, suv: 0.27, van: 0.32 } },
    diesel: { small: { hatchback: 0.10, sedan: 0.12, suv: 0.16, van: 0.19 }, medium: { hatchback: 0.12, sedan: 0.15, suv: 0.19, van: 0.23 }, large: { hatchback: 0.15, sedan: 0.18, suv: 0.24, van: 0.29 } },
    hybrid: { small: { hatchback: 0.06, sedan: 0.07, suv: 0.09, van: 0.11 }, medium: { hatchback: 0.07, sedan: 0.09, suv: 0.11, van: 0.14 }, large: { hatchback: 0.09, sedan: 0.11, suv: 0.14, van: 0.17 } },
    electric: { small: { hatchback: 0.0, sedan: 0.0, suv: 0.0, van: 0.0 }, medium: { hatchback: 0.0, sedan: 0.0, suv: 0.0, van: 0.0 }, large: { hatchback: 0.0, sedan: 0.0, suv: 0.0, van: 0.0 } },
};

export function getEmissionRate(profile: CarProfile): number {
    return EMISSION_RATES[profile.fuelType]?.[profile.engineSize]?.[profile.vehicleClass] ?? 0.17;
}

export function loadCarProfile(): CarProfile {
    try {
        const saved = localStorage.getItem('clearpath_car');
        if (saved) return JSON.parse(saved);
    } catch { }
    return { fuelType: 'petrol', engineSize: 'medium', vehicleClass: 'sedan' };
}

export function saveCarProfile(profile: CarProfile) {
    localStorage.setItem('clearpath_car', JSON.stringify(profile));
}

interface CarSettingsProps {
    onClose: () => void;
}

export default function CarSettings({ onClose }: CarSettingsProps) {
    const [profile, setProfile] = useState<CarProfile>(loadCarProfile);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        saveCarProfile(profile);
    }, [profile]);

    const co2Rate = getEmissionRate(profile);

    const fuelOptions: { key: CarProfile['fuelType']; label: string; emoji: string }[] = [
        { key: 'petrol', label: 'Petrol', emoji: '⛽' },
        { key: 'diesel', label: 'Diesel', emoji: '🛢️' },
        { key: 'hybrid', label: 'Hybrid', emoji: '🔋' },
        { key: 'electric', label: 'Electric', emoji: '⚡' },
    ];

    const sizeOptions: { key: CarProfile['engineSize']; label: string }[] = [
        { key: 'small', label: '< 1.4L' },
        { key: 'medium', label: '1.4 – 2.0L' },
        { key: 'large', label: '> 2.0L' },
    ];

    const classOptions: { key: CarProfile['vehicleClass']; label: string; emoji: string }[] = [
        { key: 'hatchback', label: 'Hatchback', emoji: '🚗' },
        { key: 'sedan', label: 'Sedan', emoji: '🏎️' },
        { key: 'suv', label: 'SUV', emoji: '🚙' },
        { key: 'van', label: 'Van/Pickup', emoji: '🚐' },
    ];

    return (
        <div className="fixed inset-0 z-[200] bg-deep-space/95 backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between px-6 pt-14 pb-4">
                <h2 className="text-lg font-black flex items-center gap-2">
                    <Car size={20} className="text-electric-cyan" /> My Vehicle
                </h2>
                <button onClick={() => { saveCarProfile(profile); setSaved(true); setTimeout(onClose, 300); }}
                    className="p-3 rounded-2xl bg-neon-mint/20 text-neon-mint">
                    {saved ? <Check size={20} /> : <X size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-6">

                {/* Fuel Type */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                        <Fuel size={14} /> Fuel Type
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {fuelOptions.map(f => (
                            <button key={f.key} onClick={() => setProfile(p => ({ ...p, fuelType: f.key }))}
                                className={`glass p-4 text-center transition-all ${profile.fuelType === f.key ? 'ring-2 ring-electric-cyan scale-105' : 'opacity-50'}`}>
                                <span className="text-2xl">{f.emoji}</span>
                                <p className="text-xs font-bold mt-1">{f.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Engine Size */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                        <Gauge size={14} /> Engine Size
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {sizeOptions.map(s => (
                            <button key={s.key} onClick={() => setProfile(p => ({ ...p, engineSize: s.key }))}
                                className={`glass p-4 text-center transition-all ${profile.engineSize === s.key ? 'ring-2 ring-electric-cyan scale-105' : 'opacity-50'}`}>
                                <p className="text-xs font-bold">{s.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vehicle Class */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                        <Car size={14} /> Vehicle Type
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {classOptions.map(c => (
                            <button key={c.key} onClick={() => setProfile(p => ({ ...p, vehicleClass: c.key }))}
                                className={`glass p-4 text-center transition-all ${profile.vehicleClass === c.key ? 'ring-2 ring-electric-cyan scale-105' : 'opacity-50'}`}>
                                <span className="text-2xl">{c.emoji}</span>
                                <p className="text-xs font-bold mt-1">{c.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Live Emission Preview */}
                <div className="glass p-5 text-center border border-white/10">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Your Car's Emission Rate</p>
                    <p className={`text-3xl font-black ${co2Rate === 0 ? 'text-neon-mint' : co2Rate < 0.12 ? 'text-electric-cyan' : co2Rate < 0.2 ? 'text-orange-400' : 'text-alert-crimson'}`}>
                        {co2Rate === 0 ? 'Zero' : co2Rate.toFixed(2)}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">{co2Rate === 0 ? 'No tailpipe emissions' : 'kg CO₂ per km'}</p>
                    {co2Rate > 0.2 && <p className="text-alert-crimson text-[10px] mt-2 font-bold">⚠️ High emission vehicle — smoke fills faster</p>}
                    {co2Rate === 0 && <p className="text-neon-mint text-[10px] mt-2 font-bold">✨ Drive Mode will show clear skies</p>}
                </div>
            </div>
        </div>
    );
}
