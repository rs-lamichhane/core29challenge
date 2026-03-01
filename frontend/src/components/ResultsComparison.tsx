import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Leaf, Flame, Clock, TreePine, Smartphone, Lightbulb, ArrowLeft, Trophy } from 'lucide-react';
import { getModeInfo } from '../utils/constants';

interface Props {
  result: any;
  onLogAnother: () => void;
  onViewDashboard: () => void;
}

export default function ResultsComparison({ result, onLogAnother, onViewDashboard }: Props) {
  const { journey, results, impact_equivalents, calorie_equivalents, new_achievements } = result;
  const modeInfo = getModeInfo(journey.mode);
  const isDriving = journey.mode === 'drive';
  const isSustainable = results.vs_drive_co2_saved_g > 0;
  const isHighEmission = journey.mode === 'plane' || journey.mode === 'boat';

  // Hero message logic - fixed for plane/boat which can emit MORE than driving
  const getHeroMessage = () => {
    if (isDriving) return 'You drove — next time try a greener option!';
    if (isHighEmission && !isSustainable) {
      return `Your ${modeInfo.label.toLowerCase()} trip produced ${((results.co2_g - results.drive_co2_g) / 1000).toFixed(2)} kg more CO₂ than driving`;
    }
    if (isSustainable) return `You saved ${(results.vs_drive_co2_saved_g / 1000).toFixed(2)} kg CO₂!`;
    return 'Consider a greener option next time!';
  };

  const getHeroEmoji = () => {
    if (isDriving) return '🚗';
    if (isHighEmission && !isSustainable) return modeInfo.icon;
    if (isSustainable) return '🌍';
    return '🚗';
  };

  const getHeroStyle = () => {
    if (isDriving) return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white';
    if (isHighEmission && !isSustainable) return 'bg-gradient-to-br from-orange-500 to-amber-600 text-white';
    if (isSustainable) return 'bg-gradient-to-br from-brand-500 to-emerald-600 text-white';
    return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white';
  };

  const co2Data = [
    { name: `${modeInfo.icon} ${modeInfo.label}`, value: results.co2_g, fill: isSustainable ? '#10B981' : '#F59E0B' },
    { name: '🚗 Driving', value: results.drive_co2_g, fill: '#EF4444' },
  ];

  const calData = [
    { name: `${modeInfo.icon} ${modeInfo.label}`, value: results.calories_kcal, fill: '#F59E0B' },
    { name: '🚗 Driving', value: 0, fill: '#D1D5DB' },
  ];

  const timeDiff = results.vs_drive_time_delta_min;
  const timeLabel = timeDiff > 0 ? `${timeDiff.toFixed(0)} min slower` : timeDiff < 0 ? `${Math.abs(timeDiff).toFixed(0)} min faster` : 'Same time';

  return (
    <div className="mt-6 animate-fade-in-up space-y-4">
      {/* Hero banner */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-2xl p-4 sm:p-6 text-center ${getHeroStyle()}`}
      >
        <div className="text-3xl sm:text-4xl mb-2">{getHeroEmoji()}</div>
        <h2 className="text-xl sm:text-2xl font-bold leading-tight">{getHeroMessage()}</h2>
        <p className="text-white/80 text-sm mt-1">
          {journey.distance_km} km by {modeInfo.label.toLowerCase()}
        </p>
      </motion.div>

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ComparisonCard
          title={`Your choice: ${modeInfo.label}`}
          icon={modeInfo.icon}
          color="brand"
          stats={[
            { icon: <Clock className="w-3.5 h-3.5" />, label: 'Time', value: `${results.time_min.toFixed(0)} min` },
            { icon: <Leaf className="w-3.5 h-3.5" />, label: 'CO₂', value: `${results.co2_g.toFixed(0)}g` },
            { icon: <Flame className="w-3.5 h-3.5" />, label: 'Calories', value: `${results.calories_kcal.toFixed(0)} kcal` },
          ]}
        />
        <ComparisonCard
          title="If you drove"
          icon="🚗"
          color="red"
          stats={[
            { icon: <Clock className="w-3.5 h-3.5" />, label: 'Time', value: `${results.drive_time_min.toFixed(0)} min` },
            { icon: <Leaf className="w-3.5 h-3.5" />, label: 'CO₂', value: `${results.drive_co2_g.toFixed(0)}g` },
            { icon: <Flame className="w-3.5 h-3.5" />, label: 'Calories', value: '0 kcal' },
          ]}
        />
      </div>

      {/* Delta summary */}
      <div className="grid grid-cols-3 gap-2">
        <DeltaChip
          label="CO₂ Saved"
          value={`${results.vs_drive_co2_saved_g.toFixed(0)}g`}
          positive={results.vs_drive_co2_saved_g >= 0}
          icon={<Leaf className="w-3.5 h-3.5" />}
        />
        <DeltaChip
          label="Time"
          value={timeLabel}
          positive={timeDiff <= 0}
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <DeltaChip
          label="Extra Calories"
          value={`+${results.vs_drive_calories_delta_kcal.toFixed(0)} kcal`}
          positive={results.vs_drive_calories_delta_kcal > 0}
          icon={<Flame className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="CO₂ Emissions (g)" data={co2Data} />
        <ChartCard title="Calories Burned (kcal)" data={calData} />
      </div>

      {/* Impact Equivalents - Innovation Feature */}
      {isSustainable && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-brand-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span> Your Impact, Made Real
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <EquivalentCard
              icon={<Smartphone className="w-5 h-5 text-blue-500" />}
              value={impact_equivalents.phone_charges.toFixed(1)}
              label="phone charges saved"
            />
            <EquivalentCard
              icon={<TreePine className="w-5 h-5 text-green-600" />}
              value={(impact_equivalents.trees_year_fraction * 365).toFixed(1)}
              label="tree-days of work"
            />
            <EquivalentCard
              icon={<Lightbulb className="w-5 h-5 text-yellow-500" />}
              value={impact_equivalents.led_bulb_hours.toFixed(1)}
              label="LED bulb hours"
            />
            <EquivalentCard
              icon={<span className="text-xl">☕</span>}
              value={impact_equivalents.kettle_boils.toFixed(1)}
              label="kettle boils"
            />
          </div>
        </motion.div>
      )}

      {/* Calorie equivalents - Innovation Feature */}
      {results.calories_kcal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">🏃</span> Health Impact
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <EquivalentCard
              icon={<span className="text-xl">🏃</span>}
              value={calorie_equivalents.jogging_minutes.toFixed(0)}
              label="min of jogging"
            />
            <EquivalentCard
              icon={<span className="text-xl">🏊</span>}
              value={calorie_equivalents.swimming_minutes.toFixed(0)}
              label="min of swimming"
            />
            <EquivalentCard
              icon={<span className="text-xl">🧘</span>}
              value={calorie_equivalents.yoga_minutes.toFixed(0)}
              label="min of yoga"
            />
            <EquivalentCard
              icon={<span className="text-xl">🍫</span>}
              value={calorie_equivalents.chocolate_bars.toFixed(1)}
              label="chocolate bars"
            />
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onLogAnother}
          className="flex-1 py-3 bg-white border-2 border-brand-200 text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Log Another
        </button>
        <button
          onClick={onViewDashboard}
          className="flex-1 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
        >
          <Trophy className="w-4 h-4" />
          View Dashboard
        </button>
      </div>
    </div>
  );
}

function ComparisonCard({ title, icon, color, stats }: {
  title: string; icon: string; color: string;
  stats: { icon: React.ReactNode; label: string; value: string }[];
}) {
  const borderColor = color === 'brand' ? 'border-brand-200' : 'border-red-200';
  const bgColor = color === 'brand' ? 'bg-brand-50' : 'bg-red-50';
  const headerBg = color === 'brand' ? 'bg-brand-500' : 'bg-red-500';

  return (
    <div className={`bg-white rounded-xl border ${borderColor} overflow-hidden shadow-sm`}>
      <div className={`${headerBg} text-white px-3 py-2 text-xs font-semibold flex items-center gap-1.5`}>
        <span className="text-base">{icon}</span> {title}
      </div>
      <div className="p-3 space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              {s.icon} {s.label}
            </div>
            <span className="text-sm font-bold text-gray-800">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeltaChip({ label, value, positive, icon }: {
  label: string; value: string; positive: boolean; icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl p-3 text-center ${positive ? 'bg-brand-50 border border-brand-200' : 'bg-red-50 border border-red-200'
      }`}>
      <div className={`flex items-center justify-center gap-1 mb-1 ${positive ? 'text-brand-600' : 'text-red-500'}`}>
        {icon}
      </div>
      <div className={`text-sm font-bold ${positive ? 'text-brand-700' : 'text-red-600'}`}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h4 className="text-xs font-semibold text-gray-600 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barSize={36}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EquivalentCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-gray-50 rounded-xl p-3 text-center"
    >
      <div className="mb-1">{icon}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </motion.div>
  );
}
