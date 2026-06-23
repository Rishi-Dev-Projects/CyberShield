'use client';

import React, { useEffect, useState } from 'react';
import { useLayoutStore } from '../../lib/layoutStore';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import Link from 'next/link';
import { 
  Activity, 
  Terminal, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface MetricData {
  scansLast30Days: number;
  activeJobs: number;
  criticalVulnerabilities: number;
  recentScans: any[];
}

interface HealthData {
  backend: string;
  database: string;
  portScanner: string;
  vulnScanner: string;
}

export default function DashboardPage() {
  const { setContext } = useLayoutStore();
  const { user } = useAuthStore();
  
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [metricsRes, healthRes] = await Promise.all([
        api.get('/api/dashboard/metrics'),
        api.get('/api/dashboard/health')
      ]);
      setMetrics(metricsRes.data);
      setHealth(healthRes.data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError('System degraded: Failed to query backend metrics.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Set AI Copilot active context
    setContext({ tool: 'dashboard', data: null });
    
    // Fetch initial data
    fetchDashboardData();

    // Auto-refresh metrics every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [setContext]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-accent animate-pulse" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <HelpCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getJobStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'FAILED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'RUNNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex justify-between items-center bg-slate-900/10 p-6 rounded-2xl border border-slate-800/30">
        <div>
          <h2 className="text-2xl font-black text-white">
            Console Active: {user?.username}
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Assigned Level: <span className="text-primary font-bold">{user?.role}</span>. Clear to trigger network testing profiles.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl hover:border-primary/50 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          title="Manually query endpoints"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scans (30 Days)</span>
            <Activity className="w-5 h-5 text-primary shadow-neon-cyan" />
          </div>
          <h3 className="text-5xl font-black text-white tracking-tight mt-4">
            {metrics?.scansLast30Days ?? 0}
          </h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">Aggregate total executions</span>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Jobs</span>
            <Terminal className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-5xl font-black text-white tracking-tight mt-4">
            {metrics?.activeJobs ?? 0}
          </h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">Currently running in queues</span>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Critical Threats</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-5xl font-black text-red-400 tracking-tight mt-4">
            {metrics?.criticalVulnerabilities ?? 0}
          </h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">Unremediated CVE classifications</span>
        </div>
      </div>

      {/* Main Grid: Health & Scans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Scans (Col span 2) */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/50">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recent Scan Jobs</h4>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">showing latest 5</span>
          </div>

          <div className="overflow-x-auto">
            {metrics && metrics.recentScans.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 pb-3">
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Target</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Scan Type</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-center">Status</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-right">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentScans.map((scan) => (
                    <tr key={scan.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 text-xs font-mono font-bold text-slate-200 truncate max-w-[180px]">
                        {scan.target}
                      </td>
                      <td className="py-3.5 text-xs text-slate-400 font-semibold uppercase">
                        {scan.type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border inline-block ${getJobStatusStyle(scan.status)}`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-xs text-slate-500 font-semibold font-mono">
                        {new Date(scan.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-medium">
                No active scan jobs recorded. Select a tool to begin sweeps.
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Service Clusters</h4>
            
            <div className="space-y-4">
              {/* Service 1 */}
              <div className="flex justify-between items-center p-3 bg-slate-900/25 border border-slate-800/40 rounded-xl">
                <div>
                  <h5 className="text-xs font-bold text-slate-200">Express API Router</h5>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Port 3001 Connection</span>
                </div>
                {getStatusIcon(health?.backend || 'healthy')}
              </div>

              {/* Service 2 */}
              <div className="flex justify-between items-center p-3 bg-slate-900/25 border border-slate-800/40 rounded-xl">
                <div>
                  <h5 className="text-xs font-bold text-slate-200">Postgres Database</h5>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">SQL Data Tier</span>
                </div>
                {getStatusIcon(health?.database || 'healthy')}
              </div>

              {/* Service 3 */}
              <div className="flex justify-between items-center p-3 bg-slate-900/25 border border-slate-800/40 rounded-xl">
                <div>
                  <h5 className="text-xs font-bold text-slate-200">Nmap Port Daemon</h5>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">FastAPI Port 8001</span>
                </div>
                {getStatusIcon(health?.portScanner || 'unknown')}
              </div>

              {/* Service 4 */}
              <div className="flex justify-between items-center p-3 bg-slate-900/25 border border-slate-800/40 rounded-xl">
                <div>
                  <h5 className="text-xs font-bold text-slate-200">CVE Audit Core</h5>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">FastAPI Port 8002</span>
                </div>
                {getStatusIcon(health?.vulnScanner || 'unknown')}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/30 flex items-center gap-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider justify-center">
            <Clock className="w-3.5 h-3.5" />
            <span>Updates every 30s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
