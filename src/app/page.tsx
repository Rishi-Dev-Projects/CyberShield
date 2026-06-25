'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/auth';
import { 
  Shield, 
  Lock, 
  Terminal, 
  Activity, 
  FileText, 
  Bot, 
  User, 
  Cpu, 
  Mail, 
  Phone, 
  Globe, 
  Instagram,
  Check,
  Copy,
  Database,
  Network,
  ChevronRight,
  Play,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Server
} from 'lucide-react';

type TerminalTab = 'scanner' | 'cve' | 'password';

export default function LandingPage() {
  const router = useRouter();
  const { initialize } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMsg, setRedirectMsg] = useState('');
  
  // Terminal simulator states
  const [activeTab, setActiveTab] = useState<TerminalTab>('scanner');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '[sys@cybershield]$ nmap -sS -T4 -p 22,80,443,3000 router.local'
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      
      const hasAccessToken = hash.includes('access_token=');
      const hasCode = search.includes('code=');
      const hasError = search.includes('error=') || hash.includes('error=');
      
      if (hasAccessToken || hasCode) {
        setRedirecting(true);
        setRedirectMsg('Email verified successfully. Synchronizing security credentials...');
        
        const timeout = setTimeout(async () => {
          try {
            await initialize();
            router.push('/dashboard');
          } catch (e) {
            setRedirectMsg('Authentication established. Redirecting to your dashboard...');
            router.push('/dashboard');
          }
        }, 2500);
        
        return () => clearTimeout(timeout);
      } else if (hasError) {
        setRedirecting(true);
        const params = new URLSearchParams(search || hash.replace('#', '?'));
        const errorDesc = params.get('error_description') || 'Email confirmation link invalid or expired.';
        setRedirectMsg(`Verification Error: ${errorDesc}`);
      }
    }
  }, [router, initialize]);

  // Autoscroll simulator console terminal
  useEffect(() => {
    if (isScanning) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [terminalOutput, isScanning]);

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Terminal simulator scan scripts
  const runScannerProbe = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTerminalOutput(['[sys@cybershield]$ nmap -sS -T4 -p 22,80,443,3000 router.local']);
    
    const lines = [
      'Starting CyberShield Nmap Engine v3.2 at 2026-06-25 21:40',
      'Initiating SYN Stealth Scan against router.local (192.168.1.1)',
      'Scanning 4 default administration ports...',
      '>> Connection established to 192.168.1.1:22',
      '>> Connection established to 192.168.1.1:80',
      '>> Connection established to 192.168.1.1:443',
      '>> Connection established to 192.168.1.1:3000',
      'Scanning completed in 1.18 seconds.',
      '--------------------------------------------------',
      'PORT     STATE    SERVICE       REASON',
      '22/tcp   open     ssh           syn-ack',
      '80/tcp   open     http          syn-ack',
      '443/tcp  open     https         syn-ack',
      '3000/tcp open     node-app      syn-ack',
      '--------------------------------------------------',
      'Nmap scan report for router.local (192.168.1.1)',
      'STATUS: SECURE_PORT_CHECK_COMPLETE',
      'Recommendation: Close port 22/tcp unless required for SSH.'
    ];

    lines.forEach((line, index) => {
      setTimeout(() => {
        setTerminalOutput(prev => [...prev, line]);
        if (index === lines.length - 1) {
          setIsScanning(false);
        }
      }, (index + 1) * 200);
    });
  };

  const runCVEAudit = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTerminalOutput(['[sys@cybershield]$ cybershield audit --cve-check target-node.local']);

    const lines = [
      'Initializing Vulnerability Auditor client v1.4...',
      'Retrieving threat signatures from database indices...',
      'Auditing target-node.local (10.0.0.45)...',
      'Checking OS: Ubuntu Core Linux (Kernel v5.15)...',
      'Cross-referencing services with CVE listings...',
      '--------------------------------------------------',
      'FOUND 2 SIGNIFICANT SECURITY EXPOSURES:',
      '  [HIGH] CVE-2021-44228 (Log4j2 JNDI Injection)',
      '    Severity: 9.8 (CRITICAL) | Threat status: Active',
      '    Mitigation: Patch Log4j2 component to v2.17.1',
      '',
      '  [MEDIUM] CVE-2023-38646 (Metabase Driver Payload)',
      '    Severity: 8.0 (HIGH) | Threat status: Patched',
      '    Mitigation: Configuration checked and isolated.',
      '--------------------------------------------------',
      'Audit finished. Threat Exposure Index: 7.2/10 (VULNERABLE)',
      'Recommendation: Isolate Log4j libraries in public network nodes.'
    ];

    lines.forEach((line, index) => {
      setTimeout(() => {
        setTerminalOutput(prev => [...prev, line]);
        if (index === lines.length - 1) {
          setIsScanning(false);
        }
      }, (index + 1) * 200);
    });
  };

  const runPasswordCalculator = (pass: string) => {
    if (isScanning) return;
    setIsScanning(true);
    setTerminalOutput([`[sys@cybershield]$ cybershield check-entropy "${pass}"`]);

    const len = pass.length;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    
    let score = 0;
    if (len >= 8) score += 2;
    if (len >= 12) score += 2;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasDigit) score += 1;
    if (hasSpecial) score += 1.5;

    let rating = 'CRITICAL WEAKNESS';
    if (score >= 7.5) {
      rating = 'SECURE (MILITARY-GRADE)';
    } else if (score >= 4.5) {
      rating = 'MODERATE';
    }

    const lines = [
      `Running entropy mathematical evaluations...`,
      `Passcode Length: ${len} characters`,
      `Complexity Matrix: Upper: ${hasUpper}, Lower: ${hasLower}, Digit: ${hasDigit}, Symbol: ${hasSpecial}`,
      `Calculated Shannon Entropy: ${(score * 12.2).toFixed(1)} bits`,
      `--------------------------------------------------`,
      `RATING: ${rating}`,
      `Remediation notes:`,
      score < 4.5
        ? '  - Password contains low character randomness. Vulnerable to dictionary brute-force.'
        : score < 7.5
        ? '  - Decent protection. Enhance character variation to block hybrid word attacks.'
        : '  - High bits strength. Mathematically highly resistant to local decryption.'
    ];

    lines.forEach((line, index) => {
      setTimeout(() => {
        setTerminalOutput(prev => [...prev, line]);
        if (index === lines.length - 1) {
          setIsScanning(false);
        }
      }, (index + 1) * 200);
    });
  };

  const resetTerminal = (tab: TerminalTab) => {
    setActiveTab(tab);
    if (tab === 'scanner') {
      setTerminalOutput(['[sys@cybershield]$ nmap -sS -T4 -p 22,80,443,3000 router.local']);
    } else if (tab === 'cve') {
      setTerminalOutput(['[sys@cybershield]$ cybershield audit --cve-check target-node.local']);
    } else {
      setTerminalOutput(['[sys@cybershield]$ cybershield check-entropy "P@ssw0rd123"']);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col items-center justify-center p-6 grid-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800/60 shadow-2xl text-center relative z-10 space-y-6">
          <Shield className="w-16 h-16 text-primary shadow-neon-cyan animate-spin mx-auto mb-3" />
          <h2 className="text-xl font-black tracking-wider bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent uppercase">
            Console Sync
          </h2>
          <p className="text-sm font-mono text-cyan-400 bg-slate-950/50 p-4 border border-slate-800 rounded-lg break-all leading-normal">
            {redirectMsg}
          </p>
          <div className="text-[10px] text-slate-650 font-mono tracking-widest uppercase">
            Securing access keys via TLS
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between grid-bg relative overflow-x-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-1/10 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky Header Navbar */}
      <header className="h-20 flex items-center justify-between px-6 md:px-16 border-b border-slate-900/60 bg-slate-950/75 backdrop-blur-lg z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary shadow-neon-cyan animate-pulse" />
          <span className="font-black text-xl tracking-wider bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent uppercase">
            CYBER<span className="text-white">SHIELD</span>
          </span>
        </div>
        
        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest text-slate-400 uppercase">
          <a href="#suite" className="hover:text-primary transition-colors">Suite</a>
          <a href="#architecture" className="hover:text-primary transition-colors">Architecture</a>
          <a href="#developer" className="hover:text-primary transition-colors">Developer</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-glow-green" />
            SYS STATUS: OPERATIONAL
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-2 text-xs font-bold bg-primary text-slate-950 rounded-full shadow-neon-cyan hover:bg-cyan-400 hover:shadow-cyan-500/40 transition-all duration-300 uppercase tracking-wider"
          >
            Enter Console
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center justify-center max-w-6xl mx-auto px-4 md:px-8 py-12 z-10 w-full">
        
        {/* HERO SECTION */}
        <section className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold tracking-widest uppercase mb-8 animate-pulse shadow-neon-cyan/5">
            <Bot className="w-3.5 h-3.5" /> Rule-Based SecOps Co-Pilot Active
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight uppercase">
            Comprehensive Cybersecurity <br />
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              Testing & Analysis Platform
            </span>
          </h1>

          <p className="mt-6 text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Evaluate host configurations, check password vulnerability thresholds, verify file integrity signatures, and audit target exposures with our containerized suite.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 text-xs font-bold bg-gradient-to-r from-primary to-cyan-400 text-slate-950 rounded-lg shadow-neon-cyan hover:shadow-cyan-500/40 transition-all duration-300 transform hover:-translate-y-0.5 uppercase tracking-wider"
            >
              Initialize Terminal Console
            </Link>
          </div>
        </section>

        {/* INTERACTIVE TERMINAL SIMULATOR */}
        <section className="w-full max-w-4xl mx-auto mb-28">
          <div className="glass-panel-accent rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col h-[400px]">
            {/* Terminal Window Header Bar */}
            <div className="bg-slate-950/80 border-b border-slate-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/85" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/85" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/85" />
                <span className="text-slate-500 text-xs font-mono ml-2">Console-Viewer - Simulator</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-primary/80 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                SIM_ACTIVE
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-900 bg-slate-950/40">
              <button 
                onClick={() => resetTerminal('scanner')}
                className={`px-5 py-2.5 text-xs font-mono border-r border-slate-900 transition-colors cursor-pointer uppercase ${activeTab === 'scanner' ? 'bg-[#050811] text-primary border-t-2 border-t-primary' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/10'}`}
              >
                1. Port Scanner
              </button>
              <button 
                onClick={() => resetTerminal('cve')}
                className={`px-5 py-2.5 text-xs font-mono border-r border-slate-900 transition-colors cursor-pointer uppercase ${activeTab === 'cve' ? 'bg-[#050811] text-primary border-t-2 border-t-primary' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/10'}`}
              >
                2. CVE Auditor
              </button>
              <button 
                onClick={() => resetTerminal('password')}
                className={`px-5 py-2.5 text-xs font-mono border-r border-slate-900 transition-colors cursor-pointer uppercase ${activeTab === 'password' ? 'bg-[#050811] text-primary border-t-2 border-t-primary' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/10'}`}
              >
                3. Password Strength
              </button>
            </div>

            {/* Terminal Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 flex-grow overflow-hidden">
              {/* Controls Column */}
              <div className="border-r border-slate-900 p-5 bg-slate-950/20 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Diagnostic Controls</h4>
                  
                  {activeTab === 'scanner' && (
                    <div className="space-y-3 text-left">
                      <p className="text-[11px] text-slate-400">Sweeps targeted hosts to audit operational network ports.</p>
                      <button 
                        disabled={isScanning}
                        onClick={runScannerProbe}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary text-slate-950 font-mono font-bold text-xs rounded hover:bg-cyan-400 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        RUN PROBE
                      </button>
                    </div>
                  )}

                  {activeTab === 'cve' && (
                    <div className="space-y-3 text-left">
                      <p className="text-[11px] text-slate-400">Matches configurations against vulnerabilities index databases.</p>
                      <button 
                        disabled={isScanning}
                        onClick={runCVEAudit}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-accent text-slate-950 font-mono font-bold text-xs rounded hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        RUN CVE AUDIT
                      </button>
                    </div>
                  )}

                  {activeTab === 'password' && (
                    <div className="space-y-2 text-left">
                      <p className="text-[11px] text-slate-400">Evaluate passcode entropy and complexity.</p>
                      <div className="space-y-1.5 pt-1">
                        <button 
                          disabled={isScanning}
                          onClick={() => runPasswordCalculator('P@ssw0rd123')}
                          className="w-full text-left py-1.5 px-2 border border-slate-800 text-[10px] font-mono text-slate-350 bg-slate-900/40 rounded hover:border-slate-600 transition-colors block cursor-pointer"
                        >
                          {"→ \"P@ssw0rd123\""}
                        </button>
                        <button 
                          disabled={isScanning}
                          onClick={() => runPasswordCalculator('CyberShield#2026!')}
                          className="w-full text-left py-1.5 px-2 border border-slate-800 text-[10px] font-mono text-slate-350 bg-slate-900/40 rounded hover:border-slate-600 transition-colors block cursor-pointer"
                        >
                          {"→ \"CyberShield#2026!\""}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[9px] font-mono text-slate-600 text-left">
                  SecOps Sandbox Terminal v3.2.0
                </div>
              </div>

              {/* Outputs Column */}
              <div className="col-span-3 p-5 overflow-y-auto bg-slate-950/60 font-mono text-xs text-slate-305 space-y-1 text-left">
                {terminalOutput.map((line, idx) => (
                  <div 
                    key={idx} 
                    className={`leading-relaxed whitespace-pre-wrap ${
                      line.startsWith('[sys') ? 'text-primary' : 
                      line.startsWith('>>') ? 'text-cyan-400' :
                      line.includes('[HIGH]') || line.includes('CRITICAL WEAKNESS') ? 'text-red-400' : 
                      line.includes('RATING: SECURE') || line.includes('SYS STATUS:') ? 'text-emerald-400' :
                      'text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                ))}
                {isScanning && (
                  <div className="flex items-center gap-1.5 text-primary text-xs py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    <span>Processing scan nodes...</span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY SUITE MODULES GRID */}
        <section id="suite" className="mt-12 w-full space-y-12 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Toolkit Capabilities</h3>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Security Testing Suite</h2>
            <p className="text-xs md:text-sm text-slate-400">
              CyberShield features a fully functional sandbox interface with professional diagnostics, compliance checkups, and offline modes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Port Scanner */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/80 hover:border-primary/40 transition-all duration-500 flex flex-col justify-between group animate-sweep">
              <div className="text-left">
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4 text-[10px] font-mono text-slate-500">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                  </div>
                  <span>MODULE // PORT_SCAN</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Terminal className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Nmap Port Scanner</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Sweep network targets for open ports using TCP Connect, SYN Stealth, or UDP strategies. Features simulated output feeds for serverless sandbox testing.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold border-t border-slate-900/50 pt-4">
                <span className="text-primary">TCP/SYN SWEEPS</span>
                <span className="text-slate-650">01 / ACTIVE</span>
              </div>
            </div>

            {/* Vulnerability Auditor */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/80 hover:border-accent/40 transition-all duration-500 flex flex-col justify-between group animate-sweep">
              <div className="text-left">
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4 text-[10px] font-mono text-slate-500">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                  </div>
                  <span>MODULE // VULN_AUDIT</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Vulnerability Auditor</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Query target parameters against real CVE listings. Formulates threat indicators and compiles detailed remediation protocols.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold border-t border-slate-900/50 pt-4">
                <span className="text-accent">CVE LOOKUP</span>
                <span className="text-slate-650">02 / ACTIVE</span>
              </div>
            </div>

            {/* SecOps Logs */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/80 hover:border-destructive/40 transition-all duration-500 flex flex-col justify-between group animate-sweep">
              <div className="text-left">
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4 text-[10px] font-mono text-slate-500">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                  </div>
                  <span>MODULE // SECOPS_MON</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">SecOps Monitoring</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Track user session activity logs, apply dynamic tool rate limiting window sizes, and write audit trails directly to PostgreSQL or JSON fallbacks.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold border-t border-slate-900/50 pt-4">
                <span className="text-destructive">LOG INTELLIGENCE</span>
                <span className="text-slate-650">03 / ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* File Integrity */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/80 hover:border-primary/40 transition-all duration-500 flex flex-col justify-between group animate-sweep">
              <div className="text-left">
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4 text-[10px] font-mono text-slate-500">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                  </div>
                  <span>MODULE // FILE_INTEG</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">File Integrity Monitor</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Enroll file signatures using SHA-256 and run integrity checks to ensure files have not been modified or tampered with.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold border-t border-slate-900/50 pt-4">
                <span className="text-primary">SHA-256 SIGNING</span>
                <span className="text-slate-650">04 / ACTIVE</span>
              </div>
            </div>

            {/* URL Reputation */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/80 hover:border-accent/40 transition-all duration-500 flex flex-col justify-between group animate-sweep">
              <div className="text-left">
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4 text-[10px] font-mono text-slate-500">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                  </div>
                  <span>MODULE // URL_REP</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">URL Reputation Analyst</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Evaluate web URLs, compile safety scores, identify phishing traits, and query cached reputation databases.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold border-t border-slate-900/50 pt-4">
                <span className="text-accent">PHISHING DETECTOR</span>
                <span className="text-slate-650">05 / ACTIVE</span>
              </div>
            </div>

            {/* Password Strength */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/80 hover:border-destructive/40 transition-all duration-500 flex flex-col justify-between group animate-sweep">
              <div className="text-left">
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3 mb-4 text-[10px] font-mono text-slate-500">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/50 transition-colors" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                  </div>
                  <span>MODULE // PASS_CALC</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Password Analyzer</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Calculate password entropy and verify compliance with length and character requirements. Includes a high-strength password generator.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold border-t border-slate-900/50 pt-4">
                <span className="text-destructive">ENTROPY MATH</span>
                <span className="text-slate-650">06 / ACTIVE</span>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="mt-28 w-full bg-slate-950/30 border border-slate-900/80 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Modules</span>
              <h4 className="text-2xl md:text-3xl font-black text-white">6+ Tools</h4>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clearance Roles</span>
              <h4 className="text-2xl md:text-3xl font-black text-primary">3 Tiers</h4>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Offline Fallback</span>
              <h4 className="text-2xl md:text-3xl font-black text-accent">100% Sandbox</h4>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compliance Rules</span>
              <h4 className="text-2xl md:text-3xl font-black text-destructive">NIST & OWASP</h4>
            </div>
          </div>
        </section>

        {/* TECHNICAL ARCHITECTURE */}
        <section id="architecture" className="mt-28 w-full text-left border-t border-slate-900/60 pt-20 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
              <Cpu className="w-3.5 h-3.5" /> Technical Overview
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">System Architecture</h2>
            <p className="text-xs md:text-sm text-slate-400">
              Constructed with a decoupled frontend layer and an abstraction database router to toggle smoothly between cloud storage and offline sandboxing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual Node Flowchart */}
            <div className="space-y-8 relative">
              <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-accent to-slate-900 hidden sm:block" />
              
              {/* Node 1 */}
              <div className="flex items-start gap-4 relative text-left">
                <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 z-10">
                  <Globe className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide">Client Interface Layer</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Built on React 19 and Next.js 15, storing operational states via Zustand. Includes mobile drawer responsive grids and real-time SSE listener triggers.
                  </p>
                </div>
              </div>

              {/* Node 2 */}
              <div className="flex items-start gap-4 relative text-left">
                <div className="w-20 h-20 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0 z-10">
                  <Server className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide">Next.js Edge API Control Gate</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Processes incoming socket sweep scripts and compliance lookups. Automatically reads configuration hashes, routing execution protocols.
                  </p>
                </div>
              </div>

              {/* Node 3 */}
              <div className="flex items-start gap-4 relative text-left">
                <div className="w-20 h-20 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive flex-shrink-0 z-10">
                  <Database className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wide">Adaptive Datastore Adapters</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Evaluates if environment configs exist. Uses Supabase PostgreSQL client in production, falls back to local cached `cybershield-db.json` when running in sandbox mode.
                  </p>
                </div>
              </div>
            </div>

            {/* Key architectural highlights */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-900/80 bg-slate-950/40 backdrop-blur-sm space-y-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-left">Technical Foundations</h4>
              
              <div className="space-y-4 text-left">
                <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Supabase DB Client Integration</span>
                    <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20">Production API</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Stores historical scans, file audit signatures, and role metrics in high-availability cloud servers.</p>
                </div>

                <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">In-Memory / JSON DB fallback</span>
                    <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest px-2 py-0.5 rounded bg-accent/10 border border-accent/20">Offline Sandbox</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Uses global state caching to mock system persistence inside serverless nodes when Supabase credentials are missing.</p>
                </div>

                <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">AI compliance scanner</span>
                    <span className="text-[9px] font-mono font-bold text-destructive uppercase tracking-widest px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20">Copilot Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Embeds compliance rules into interactive AI chat logs, checking tool constraints against NIST/OWASP protocols.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEVELOPER PROFILE & CONTACT ACCESS BADGE */}
        <section id="developer" className="mt-28 w-full border-t border-slate-900/60 pt-20 flex flex-col items-center scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold tracking-widest uppercase">
              <User className="w-3.5 h-3.5" /> Project Creator
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">Rishi Mistry</h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Built as an advanced security dashboard project. Verify credentials and establish communications through the direct console portal.
            </p>
          </div>

          {/* Access Badge Card */}
          <div className="w-full max-w-4xl glass-panel border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-5">
            {/* ID Badge side */}
            <div className="md:col-span-2 bg-gradient-to-b from-slate-950 to-[#070b17] p-8 border-b md:border-b-0 md:border-r border-slate-900/80 flex flex-col justify-between items-center text-center relative">
              <div className="absolute top-4 left-4 text-[9px] font-mono text-slate-650">SECOPS_ID // 2026</div>
              <div className="absolute top-4 right-4 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div className="space-y-6 my-auto pt-6">
                <div className="w-24 h-24 rounded-full border-2 border-primary/50 bg-slate-900/80 flex items-center justify-center mx-auto shadow-neon-cyan/20 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-cyan-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Shield className="w-10 h-10 text-cyan-400" />
                  </div>
                </div>

                <div className="space-y-1.5 text-center">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Rishi Mistry</h3>
                  <div className="inline-block px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-mono uppercase tracking-widest">
                    Principal Developer
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-4 space-y-1 text-left max-w-xs mx-auto">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>CLEARANCE:</span>
                    <span className="text-white font-bold">LEVEL 5 (OVERLORD)</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>SCOPE:</span>
                    <span className="text-white font-bold">FULLSTACK SEC-SUITE</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-650 tracking-wider pt-6">
                CYBERSHIELD GATEWAY AUTH
              </div>
            </div>

            {/* Direct secure endpoints side */}
            <div className="md:col-span-3 p-8 flex flex-col justify-between space-y-8 bg-slate-950/40">
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secure Communication Ports</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a communication tunnel below to initiate direct routing to Rishi Mistry&apos;s portals. Use the quick copy functions to lock coordinates in your clipboard.
                </p>
              </div>

              {/* Endpoints listing */}
              <div className="space-y-3">
                {/* Website Port */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl hover:border-primary/45 transition-colors group">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform flex-shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Port 80 / Portfolio Web</span>
                      <a 
                        href="https://rishi-mistry.vercel.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-slate-200 hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        rishi-mistry.vercel.app
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-primary transition-colors" />
                      </a>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => copyToClipboard('https://rishi-mistry.vercel.app', 'web')}
                    className="p-2 border border-slate-900 hover:border-slate-700 text-slate-400 hover:text-white rounded transition-all cursor-pointer flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'web' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Instagram Port */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl hover:border-accent/45 transition-colors group">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform flex-shrink-0">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Instagram Handle</span>
                      <a 
                        href="https://instagram.com/rishi_mistry" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-slate-200 hover:text-accent transition-colors flex items-center gap-1.5"
                      >
                        @rishi_mistry
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-accent transition-colors" />
                      </a>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => copyToClipboard('rishi_mistry', 'insta')}
                    className="p-2 border border-slate-900 hover:border-slate-700 text-slate-400 hover:text-white rounded transition-all cursor-pointer flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'insta' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Email Port */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl hover:border-destructive/45 transition-colors group">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive group-hover:scale-105 transition-transform flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Port 25 / Email SMTP</span>
                      <a 
                        href="mailto:rishimistry33@gmail.com" 
                        className="text-xs font-semibold text-slate-200 hover:text-destructive transition-colors flex items-center gap-1.5"
                      >
                        rishimistry33@gmail.com
                      </a>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => copyToClipboard('rishimistry33@gmail.com', 'email')}
                    className="p-2 border border-slate-900 hover:border-slate-700 text-slate-400 hover:text-white rounded transition-all cursor-pointer flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Phone Port */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl hover:border-primary/45 transition-colors group">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Voice Tunnel / Cell</span>
                      <a 
                        href="tel:8160960586" 
                        className="text-xs font-semibold text-slate-200 hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        +91 8160960586
                      </a>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => copyToClipboard('8160960586', 'phone')}
                    className="p-2 border border-slate-900 hover:border-slate-700 text-slate-400 hover:text-white rounded transition-all cursor-pointer flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-slate-900/60 bg-slate-950/40 flex items-center justify-center text-[10px] text-slate-650 font-mono tracking-widest uppercase px-4 text-center">
        © 2026 CyberShield Security Platform. Designed by Rishi Mistry.
      </footer>
    </div>
  );
}
