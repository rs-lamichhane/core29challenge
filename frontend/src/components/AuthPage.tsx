import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api';

interface Props {
  onLogin: (user: { id: number; name: string; email: string }) => void;
  onDemoLogin: () => void;
}

export default function AuthPage({ onLogin, onDemoLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const result = await api.register({ email: email.trim(), password, name: name.trim() });
        onLogin(result.user);
      } else {
        const result = await api.login({ email: email.trim(), password });
        onLogin(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-green-50 to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">GreenApp</h1>
          <p className="text-gray-500 mt-1">Track your sustainable commute</p>
          <p className="text-xs text-brand-600 mt-0.5">Core29 Sustainability Challenge</p>
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-brand-100/30 border border-brand-100 overflow-hidden">
          {/* Tab toggle */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${!isRegister
                  ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50/50'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${isRegister
                  ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50/50'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isRegister ? 'At least 4 characters' : 'Your password'}
                  required
                  minLength={4}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-xl text-sm border border-transparent focus:border-brand-300 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="px-6 pb-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
          </div>

          {/* Demo mode */}
          <div className="px-6 pb-6 pt-3">
            <button
              onClick={onDemoLogin}
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              ✨ Continue as Demo User
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Built for the Core29 Challenge — making sustainability visible
        </p>
      </motion.div>
    </div>
  );
}
