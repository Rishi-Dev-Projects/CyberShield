'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { Shield, Eye, EyeOff, Bot, Lock, Mail, User, ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  const { register, error, clearError, isLoading } = useAuthStore();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Password complexity strength evaluation
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthText, setStrengthText] = useState('Too short');
  const [strengthColor, setStrengthColor] = useState('bg-slate-800');

  useEffect(() => {
    // Basic password complexity validation logic
    if (password.length === 0) {
      setStrengthScore(0);
      setStrengthText('No password');
      setStrengthColor('bg-slate-800');
      return;
    }
    
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^a-zA-Z0-9]/.test(password)) score += 25;

    setStrengthScore(score);

    if (password.length < 8) {
      setStrengthText('Weak (Min 8 chars)');
      setStrengthColor('bg-red-500');
    } else if (score < 50) {
      setStrengthText('Weak');
      setStrengthColor('bg-red-500');
    } else if (score < 75) {
      setStrengthText('Moderate');
      setStrengthColor('bg-amber-500');
    } else {
      setStrengthText('Strong');
      setStrengthColor('bg-accent');
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Validation
    if (!username || !email || !password) {
      setValidationError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    try {
      await register({ username, email, password, role });
      // Redirect to login upon successful registration
      router.push('/login?registered=true');
    } catch (err) {
      // handled by store
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col items-center justify-center p-6 grid-bg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800/60 shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Shield className="w-12 h-12 text-primary shadow-neon-cyan animate-pulse mb-3" />
          <h2 className="text-2xl font-black tracking-wider bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            CYBER<span className="text-white">SHIELD</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">
            Enroll security identity
          </p>
        </div>

        {/* Errors */}
        {(error || validationError) && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg mb-4 flex items-start gap-2 animate-shake">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Username Code
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="analyst_rishi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Secure Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="rishi@cybershield.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Assigned Clearance Role
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium appearance-none"
              >
                <option value="STUDENT">Student (predefined safe ranges)</option>
                <option value="SECURITY_ANALYST">Security Analyst (full toolkit)</option>
                <option value="ADMIN">Admin (system manager)</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Console Secret Key
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Complexity Indicator */}
            {password.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500 uppercase">Secret Strength:</span>
                  <span className={strengthScore >= 75 ? 'text-accent' : strengthScore >= 50 ? 'text-amber-400' : 'text-red-400'}>
                    {strengthText}
                  </span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strengthColor}`} 
                    style={{ width: `${strengthScore}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-1 text-[8px] text-slate-600 font-mono tracking-widest text-center uppercase">
                  <span className={password.length >= 8 ? 'text-accent' : ''}>len&gt;=8</span>
                  <span className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-accent' : ''}>Aa</span>
                  <span className={/[0-9]/.test(password) ? 'text-accent' : ''}>0-9</span>
                  <span className={/[^a-zA-Z0-9]/.test(password) ? 'text-accent' : ''}>@#$</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-cyan-500 text-slate-950 font-bold rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none mt-4 text-xs tracking-wider uppercase"
          >
            {isLoading ? 'Creating identity...' : 'Enroll identity'}
          </button>
        </form>

        {/* Signin redirect */}
        <div className="mt-6 text-center border-t border-slate-800/40 pt-4">
          <p className="text-xs text-slate-500">
            Already have an active identity?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-cyan-400 font-bold hover:underline transition-colors ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
