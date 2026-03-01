import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, X, Search, Trophy, Clock, Users, Plus, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface Props {
  userId: number;
  userName: string;
}

interface Battle {
  id: number;
  challenger_id: number;
  opponent_id: number;
  challenger_name: string;
  opponent_name: string;
  challenger_color: string;
  opponent_color: string;
  status: string;
  start_date: string;
  end_date: string;
  challenger_co2_saved: number;
  opponent_co2_saved: number;
  winner_id: number | null;
  winner_name: string | null;
}

interface SearchUser {
  id: number;
  name: string;
  avatar_color: string;
}

export default function FriendBattle({ userId, userName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [tab, setTab] = useState<'active' | 'create' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) loadBattles();
  }, [isOpen]);

  const loadBattles = async () => {
    try {
      await api.updateBattleScores(userId);
      const data = await api.getBattles(userId);
      setBattles(data);
    } catch {
      // DB might not be ready
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await api.searchUsers(q, userId);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleChallenge = async (opponentName: string) => {
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await api.createBattle(userId, opponentName, 7);
      setSuccess(`Battle challenge sent to ${opponentName}!`);
      setSearchQuery('');
      setSearchResults([]);
      loadBattles();
      setTimeout(() => { setSuccess(''); setTab('active'); }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const activeBattles = battles.filter(b => b.status === 'active');
  const pendingBattles = battles.filter(b => b.status === 'pending');
  const completedBattles = battles.filter(b => b.status === 'completed');

  return (
    <>
      {/* Battle button in header area — rendered where parent places it */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-semibold text-orange-700 transition-all"
      >
        <Swords className="w-4 h-4" />
        Friend Battles
        {activeBattles.length > 0 && (
          <span className="w-5 h-5 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
            {activeBattles.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                <h3 className="font-bold flex items-center gap-2">
                  <Swords className="w-5 h-5" /> Friend Battles
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 pt-3 bg-gray-50 dark:bg-gray-800">
                {([
                  { key: 'active', label: 'Active', icon: <Swords className="w-3.5 h-3.5" />, count: activeBattles.length + pendingBattles.length },
                  { key: 'create', label: 'Challenge', icon: <Plus className="w-3.5 h-3.5" /> },
                  { key: 'history', label: 'History', icon: <Trophy className="w-3.5 h-3.5" />, count: completedBattles.length },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-t-lg transition-all ${
                      tab === t.key
                        ? 'bg-white dark:bg-gray-900 text-orange-600 border-b-2 border-orange-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.icon} {t.label}
                    {'count' in t && t.count! > 0 && (
                      <span className="w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] flex items-center justify-center">
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {tab === 'active' && (
                  <>
                    {activeBattles.length === 0 && pendingBattles.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Swords className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No active battles</p>
                        <p className="text-xs mt-1">Challenge a friend to start!</p>
                      </div>
                    ) : (
                      <>
                        {pendingBattles.filter(b => b.opponent_id === userId).map(battle => (
                          <PendingBattleCard key={battle.id} battle={battle} userId={userId} onRespond={loadBattles} />
                        ))}
                        {activeBattles.map(battle => (
                          <ActiveBattleCard key={battle.id} battle={battle} userId={userId} />
                        ))}
                      </>
                    )}
                  </>
                )}

                {tab === 'create' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Search for a registered user to challenge them to a 7-day CO₂ saving battle!</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border border-transparent focus:border-orange-300 outline-none"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      )}
                    </div>

                    {error && <div className="px-3 py-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}
                    {success && <div className="px-3 py-2 bg-green-50 text-green-600 text-xs rounded-lg">{success}</div>}

                    {searchResults.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        {searchResults.map(user => (
                          <div key={user.id} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: user.avatar_color || '#10B981' }}
                              >
                                {user.name[0]}
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
                            </div>
                            <button
                              onClick={() => handleChallenge(user.name)}
                              disabled={creating}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              {creating ? '...' : 'Challenge!'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                      <p className="text-center text-xs text-gray-400 py-4">No users found matching "{searchQuery}"</p>
                    )}
                  </div>
                )}

                {tab === 'history' && (
                  <>
                    {completedBattles.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No completed battles yet</p>
                      </div>
                    ) : (
                      completedBattles.map(battle => (
                        <CompletedBattleCard key={battle.id} battle={battle} userId={userId} />
                      ))
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ActiveBattleCard({ battle, userId }: { battle: Battle; userId: number }) {
  const isChallenger = battle.challenger_id === userId;
  const myScore = isChallenger ? parseFloat(String(battle.challenger_co2_saved)) : parseFloat(String(battle.opponent_co2_saved));
  const theirScore = isChallenger ? parseFloat(String(battle.opponent_co2_saved)) : parseFloat(String(battle.challenger_co2_saved));
  const opponentName = isChallenger ? battle.opponent_name : battle.challenger_name;
  const opponentColor = isChallenger ? battle.opponent_color : battle.challenger_color;

  const endDate = new Date(battle.end_date);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const totalMax = Math.max(myScore, theirScore, 1);
  const myPct = (myScore / totalMax) * 100;
  const theirPct = (theirScore / totalMax) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <Swords className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <span className="text-xs font-semibold text-orange-600">ACTIVE BATTLE</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock className="w-3 h-3" />
          {daysLeft}d left
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-brand-600">You</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{(myScore / 1000).toFixed(1)} kg</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${myPct}%` }}
              className="h-full bg-gradient-to-r from-brand-400 to-emerald-400 rounded-full"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                style={{ backgroundColor: opponentColor || '#EF4444' }}
              >
                {opponentName?.[0]}
              </div>
              <span className="font-medium text-red-500">{opponentName}</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-200">{(theirScore / 1000).toFixed(1)} kg</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${theirPct}%` }}
              className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        {myScore > theirScore ? (
          <span className="text-xs font-semibold text-brand-600">You're winning! Keep it up!</span>
        ) : myScore < theirScore ? (
          <span className="text-xs font-semibold text-red-500">You're behind — log more green journeys!</span>
        ) : (
          <span className="text-xs font-semibold text-gray-500">It's a tie — break ahead!</span>
        )}
      </div>
    </div>
  );
}

function PendingBattleCard({ battle, userId, onRespond }: { battle: Battle; userId: number; onRespond: () => void }) {
  const [responding, setResponding] = useState(false);

  const handleRespond = async (accept: boolean) => {
    setResponding(true);
    try {
      if (accept) {
        await api.acceptBattle(battle.id, userId);
      } else {
        await api.declineBattle(battle.id, userId);
      }
      onRespond();
    } catch {
      // ignore
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-yellow-600" />
        <span className="text-xs font-semibold text-yellow-700">CHALLENGE RECEIVED</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
        <span className="font-bold">{battle.challenger_name}</span> has challenged you to a 7-day CO₂ saving battle!
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleRespond(true)}
          disabled={responding}
          className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => handleRespond(false)}
          disabled={responding}
          className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function CompletedBattleCard({ battle, userId }: { battle: Battle; userId: number }) {
  const isChallenger = battle.challenger_id === userId;
  const myScore = isChallenger ? parseFloat(String(battle.challenger_co2_saved)) : parseFloat(String(battle.opponent_co2_saved));
  const theirScore = isChallenger ? parseFloat(String(battle.opponent_co2_saved)) : parseFloat(String(battle.challenger_co2_saved));
  const opponentName = isChallenger ? battle.opponent_name : battle.challenger_name;
  const didWin = battle.winner_id === userId;
  const isDraw = battle.winner_id === null;

  return (
    <div className={`rounded-xl border p-4 ${
      didWin ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800' :
      isDraw ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' :
      'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold">
          {didWin ? '🏆 YOU WON!' : isDraw ? '🤝 DRAW' : '😢 YOU LOST'}
        </span>
        <span className="text-[10px] text-gray-400">vs {opponentName}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-300">
          You: <span className="font-bold">{(myScore / 1000).toFixed(1)} kg</span>
        </span>
        <span className="text-gray-600 dark:text-gray-300">
          {opponentName}: <span className="font-bold">{(theirScore / 1000).toFixed(1)} kg</span>
        </span>
      </div>
    </div>
  );
}
