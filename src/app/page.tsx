'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Terminal, Activity, FileText, Bot } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between grid-bg relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 -translate-x-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      {/* Navbar */}
      <header className="h-20 flex items-center justify-between px-8 md:px-16 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary shadow-neon-cyan animate-pulse" />
          <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            CYBER<span className="text-white">SHIELD</span>
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 text-sm font-semibold bg-primary text-slate-950 rounded-full shadow-neon-cyan hover:bg-cyan-400 transition-all duration-300"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-16 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-6 animate-pulse">
          <Bot className="w-3.5 h-3.5" /> Rule-Based SecOps Co-Pilot Enabled
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Comprehensive Cybersecurity <br />
          <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            Testing & Analysis Platform
          </span>
        </h2>

        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Evaluate targets, check password vulnerability thresholds, verify file integrity signatures, and query host exposures with our containerized suite.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3.5 text-sm font-bold bg-gradient-to-r from-primary to-cyan-400 text-slate-950 rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Initialize Terminal Console
          </Link>
          <Link
            href="/register"
            className="px-8 py-3.5 text-sm font-bold border border-slate-800 bg-slate-900/40 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all duration-300"
          >
            Register Student Account
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-xl hover:border-slate-800 transition-colors">
            <Terminal className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nmap Port Scanning</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Launch async network port sweeps using TCP, SYN, UDP, and comprehensive configurations.
            </p>
          </div>

          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-xl hover:border-slate-800 transition-colors">
            <Lock className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vulnerability Auditing</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Query host structures against real CVE databases with clear remediation details.
            </p>
          </div>

          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-xl hover:border-slate-800 transition-colors">
            <Activity className="w-8 h-8 text-destructive mb-4" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">SecOps Monitoring</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Track session logs dynamically, apply active rate limits, and audit actions with immutable logs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-slate-900 bg-slate-950/30 flex items-center justify-center text-xs text-slate-600 font-mono tracking-widest uppercase">
        © 2026 CyberShield Security Platform. All Rights Reserved.
      </footer>
    </div>
  );
}
