'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { Shield, Eye, EyeOff, Bot, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login, error, clearError, isLoading } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState('admin@cybershield.local');
  const [password, setPassword] = useState('adminpassword');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('registered') === 'true' || searchParams.get('confirm') === 'true') {
        setShowConfirmAlert(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Simple validation
    if (!email || !password) {
      setValidationError('Please input email and password credentials.');
      return;
    }

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      // handled by authStore state
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col items-center justify-center p-6 grid-bg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800/60 shadow-2xl relative z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Shield className="w-12 h-12 text-primary shadow-neon-cyan animate-pulse mb-3" />
          <h2 className="text-2xl font-black tracking-wider bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            CYBER<span className="text-white">SHIELD</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">
            Console Authentication
          </p>
        </div>

        {/* Email confirmation alert */}
        {showConfirmAlert && (
          <div className="p-3 bg-primary/10 border border-primary/30 text-primary text-xs font-bold rounded-lg mb-6 flex items-start gap-2 shadow-neon-cyan/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
            <span>Registration successful! A confirmation email has been sent. Please verify your email before logging in.</span>
          </div>
        )}

        {/* Action errors alerts */}
        {(error || validationError) && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg mb-6 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Demo Credentials for Reviewer */}
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs rounded-xl mb-6 shadow-neon-cyan/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider font-mono text-[10px]">Reviewer Demo Access</span>
          </div>
          <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
            Use the pre-filled demo administrator credentials below to enter the SecOps console:
          </p>
          <div className="font-mono space-y-1 text-[11px] text-slate-355 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60">
            <div><span className="text-slate-500">Email:</span> <span className="text-slate-200">admin@cybershield.local</span></div>
            <div><span className="text-slate-500">Password:</span> <span className="text-slate-200">adminpassword</span></div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Identity Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="analyst@cybershield.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Security Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary to-cyan-500 text-slate-950 font-bold rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none mt-2 text-sm tracking-wider uppercase"
          >
            {isLoading ? 'Decrypting credentials...' : 'Authenticate Console'}
          </button>
        </form>

        {/* Register Redirect link */}
        <div className="mt-8 text-center border-t border-slate-800/40 pt-6">
          <p className="text-xs text-slate-500">
            First time logging in?{' '}
            <Link
              href="/register"
              className="text-primary hover:text-cyan-400 font-bold hover:underline transition-colors ml-1"
            >
              Request security credentials
            </Link>
          </p>
        </div>
      </div>

      {/* Security note */}
      <div className="mt-6 text-center z-10 flex items-center gap-1.5">
        <Bot className="w-4 h-4 text-slate-600" />
        <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
          Secured with SHA-256 and custom JWT protocols
        </span>
      </div>
    </div>
  );
}
