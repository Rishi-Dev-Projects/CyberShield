'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLayoutStore } from '../lib/layoutStore';
import { api } from '../lib/api';
import { Bot, HelpCircle, Activity, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { toggleAi, isAiOpen } = useLayoutStore();
  const [systemHealthy, setSystemHealthy] = useState(true);

  // Poll system health briefly to show green/red indicator in header
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/api/dashboard/health');
        const services = res.data.services || {};
        const healthy = Object.values(services).every((s: any) => s.status === 'healthy');
        setSystemHealthy(healthy);
      } catch (err) {
        setSystemHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Welcome';
    
    // Format title
    const lastPart = parts[parts.length - 1];
    return lastPart
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="h-16 fixed top-0 right-0 left-64 glass-panel border-b border-slate-800/40 px-8 flex items-center justify-between z-20">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-wide">
          {getPageTitle()}
        </h1>
      </div>

      {/* Actions and Status */}
      <div className="flex items-center gap-6">
        {/* System Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/40 border border-slate-800/40">
          <Activity className={`w-3.5 h-3.5 ${systemHealthy ? 'text-accent animate-pulse' : 'text-destructive'}`} />
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Node: {systemHealthy ? <span className="text-accent">ONLINE</span> : <span className="text-destructive">DEGRADED</span>}
          </span>
        </div>

        {/* AI Copilot Button */}
        <button
          onClick={toggleAi}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
            isAiOpen 
              ? 'bg-primary text-slate-950 border-primary shadow-neon-cyan' 
              : 'bg-primary/10 text-primary border-primary/20 hover:border-primary/50 hover:bg-primary/20 shadow-none'
          }`}
        >
          <Bot className={`w-4 h-4 ${isAiOpen ? 'animate-bounce' : ''}`} />
          <span>AI COPILOT</span>
        </button>
      </div>
    </header>
  );
}
