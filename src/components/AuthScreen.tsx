import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Lock, User as UserIcon, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthScreenProps {
  onSuccess: (user: User, token: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const result = await api.login(username, password);
        onSuccess(result.user, result.token);
      } else {
        const result = await api.register(username, password, displayName);
        onSuccess(result.user, result.token);
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUsername: string, demoName: string) => {
    setError(null);
    setLoading(true);
    try {
      // Try login first, if fails then register
      try {
        const res = await api.login(demoUsername, 'demo1234');
        onSuccess(res.user, res.token);
      } catch {
        const res = await api.register(demoUsername, 'demo1234', demoName);
        onSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Sinov profiliga kirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25 mb-4">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Jonli Suhbat Tizimi
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Mustahkam backend va xavfsiz avtorizatsiyaga ega real-vaqt chat dasturi
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Tab Switcher */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-700/50">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kirish
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ismingiz yoki Taxallusingiz
                </label>
                <div className="relative">
                  <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-displayname"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Masalan: Sardor Aliyev"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Foydalanuvchi nomi (Username)
              </label>
              <div className="relative">
                <span className="text-slate-500 font-bold absolute left-4 top-1/2 -translate-y-1/2 select-none">
                  @
                </span>
                <input
                  id="input-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="masalan: sardor_99"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Lotin harflari va raqamlar (kamida 3 ta belgi)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {tab === 'register' && (
                <p className="text-xs text-slate-400 mt-1">Kamida 4 ta belgi (xavfsiz hashlanadi)</p>
              )}
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === 'login' ? 'Tizimga kirish' : 'Ro‘yxatdan o‘tish'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tezkor sinov profillari (1-klikda kiring):</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-demo-ali"
                type="button"
                onClick={() => handleQuickDemo('ali_coder', 'Ali Valiyev')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-xs text-slate-200 transition-colors text-center truncate cursor-pointer"
              >
                Ali
              </button>
              <button
                id="btn-demo-madina"
                type="button"
                onClick={() => handleQuickDemo('madina_pro', 'Madina Karimova')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-xs text-slate-200 transition-colors text-center truncate cursor-pointer"
              >
                Madina
              </button>
              <button
                id="btn-demo-jasur"
                type="button"
                onClick={() => handleQuickDemo('jasur_dev', 'Jasur Rustamov')}
                disabled={loading}
                className="py-2 px-2.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-xs text-slate-200 transition-colors text-center truncate cursor-pointer"
              >
                Jasur
              </button>
            </div>
          </div>

          {/* Backend reassurance */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Mustahkam PBKDF2 va WebSockets arxitekturasi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
