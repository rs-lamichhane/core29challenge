import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { Zap, Leaf, Flame, Trophy, Target, TrendingUp } from 'lucide-react';
import { getModeInfo } from '../utils/constants';

interface Props {
  userId: number;
  summary: any;
  onRefresh: () => void;
}

export default function Dashboard({ userId, summary, onRefresh }: Props) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [leaderboards, setLeaderboards] = useState<any>(null);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'co2' | 'calories' | 'streaks'>('co2');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [ach, lb, jn] = await Promise.all([
        api.getAchievements(userId),
        api.getLeaderboards(),
        api.getJourneys(userId),
      ]);
      setAchievements(ach);
      setLeaderboards(lb);
      setJourneys(jn);
    } catch {
      // DB might not be ready
    }
  };

  if (!summary) return <div className="mt-8 text-center text-gray-400">Loading...</div>;

  const weeklyGoal = summary.weekly_goal;
  const goalProgress = weeklyGoal ? Math.min((weeklyGoal.progress_g / weeklyGoal.target_g) * 100, 100) : 0;

  return (
    <div className="mt-6 space-y-4 animate-fade-in-up">
      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Leaf className="w-5 h-5 text-brand-500" />} value={`${(summary.total_co2_saved_g / 1000).toFixed(1)}kg`} label="CO₂ Saved" color="brand" />
        <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} value={`${Math.round(summary.total_calories_kcal)}`} label="Calories Burned" color="orange" />
        <StatCard icon={<Zap className="w-5 h-5 text-purple-500" />} value={`${summary.streak?.current_streak || 0}d`} label="Current Streak" color="purple" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-500" />} value={`${summary.journey_count}`} label="Total Journeys" color="blue" />
      </div>

      {/* Weekly Goal - Innovation Feature */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl border border-brand-100 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-500" />
            Weekly CO₂ Goal
          </h3>
          <span className="text-xs text-gray-500">{goalProgress.toFixed(0)}% complete</span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${goalProgress >= 100
                ? 'bg-gradient-to-r from-brand-400 to-emerald-400'
                : 'bg-gradient-to-r from-brand-400 to-brand-500'
              }`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{(weeklyGoal.progress_g / 1000).toFixed(1)} kg saved</span>
          <span>Goal: {(weeklyGoal.target_g / 1000).toFixed(1)} kg</span>
        </div>
        {goalProgress >= 100 && (
          <div className="mt-2 text-center text-sm font-semibold text-brand-600">
            🎉 Weekly goal achieved!
          </div>
        )}
      </motion.div>

      {/* Streak widget */}
      <StreakWidget streak={summary.streak} />

      {/* Achievements */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {achievements.map(a => (
            <motion.div
              key={a.id}
              whileHover={{ scale: 1.05 }}
              className={`rounded-xl p-3 text-center border transition-all ${a.earned
                  ? 'bg-yellow-50 border-yellow-200 shadow-sm'
                  : 'bg-gray-50 border-gray-100 opacity-50'
                }`}
            >
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-[10px] font-semibold text-gray-700 leading-tight">{a.title}</div>
              {a.earned && (
                <div className="text-[9px] text-brand-500 mt-0.5">Earned!</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboards */}
      {leaderboards && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3">🏆 Leaderboards</h3>
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-0.5">
            {(['co2', 'calories', 'streaks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500'
                  }`}
              >
                {tab === 'co2' ? '🌱 CO₂ Saved' : tab === 'calories' ? '🔥 Calories' : '⚡ Streaks'}
              </button>
            ))}
          </div>
          <LeaderboardList
            data={
              activeTab === 'co2' ? leaderboards.co2 :
                activeTab === 'calories' ? leaderboards.calories :
                  leaderboards.streaks
            }
            type={activeTab}
            currentUserId={userId}
          />
        </div>
      )}

      {/* Recent journeys */}
      {journeys.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📋 Recent Journeys</h3>
          <div className="space-y-2">
            {journeys.slice(0, 5).map((j: any) => {
              const mi = getModeInfo(j.mode);
              return (
                <div key={j.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mi.icon}</span>
                    <div>
                      <span className="text-xs font-medium text-gray-700">{j.distance_km} km {mi.label}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{j.date}</span>
                    </div>
                  </div>
                  <div className="text-xs text-brand-600 font-semibold">
                    -{parseFloat(j.vs_drive_co2_saved_g).toFixed(0)}g CO₂
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 border-brand-100',
    orange: 'bg-orange-50 border-orange-100',
    purple: 'bg-purple-50 border-purple-100',
    blue: 'bg-blue-50 border-blue-100',
  };
  return (
    <div className={`rounded-xl p-3 border ${colors[color] || colors.brand}`}>
      <div className="mb-1">{icon}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function StreakWidget({ streak }: { streak: any }) {
  const current = streak?.current_streak || 0;
  const best = streak?.best_streak || 0;
  const milestones = [3, 7, 30];

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-purple-500" />
        Sustainable Streak
      </h3>
      <div className="flex items-center gap-4 sm:gap-6 mb-4">
        <div className="text-center">
          <div className="text-3xl font-extrabold text-purple-600">{current}</div>
          <div className="text-[10px] text-gray-500">Current days</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-400">{best}</div>
          <div className="text-[10px] text-gray-500">Best streak</div>
        </div>
      </div>
      <div className="flex gap-2">
        {milestones.map(m => (
          <div
            key={m}
            className={`flex-1 py-2 rounded-lg text-center text-xs font-medium border ${current >= m
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
          >
            {current >= m ? '✅' : '🔒'} {m}-day
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardList({ data, type, currentUserId }: { data: any[]; type: string; currentUserId: number }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No data yet. Start logging journeys!</p>;
  }

  return (
    <div className="space-y-1.5">
      {data.map((entry: any, i: number) => {
        const isYou = entry.id === currentUserId;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        const value = type === 'co2'
          ? `${(entry.total_co2_saved_g / 1000).toFixed(1)} kg`
          : type === 'calories'
            ? `${Math.round(entry.total_calories)} kcal`
            : `${entry.best_streak}d best`;

        return (
          <div
            key={entry.id}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${isYou ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm w-6 text-center">{medal}</span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: entry.avatar_color || '#10B981' }}
              >
                {entry.name[0]}
              </div>
              <span className={`text-sm font-medium ${isYou ? 'text-brand-700' : 'text-gray-700'}`}>
                {entry.name} {isYou && '(You)'}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-800">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
