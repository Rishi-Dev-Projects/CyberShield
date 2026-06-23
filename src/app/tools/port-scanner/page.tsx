'use client';

import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../../lib/layoutStore';
import { useAuthStore } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { Terminal, Shield, Play, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function PortScannerPage() {
  const { setContext } = useLayoutStore();
  const { user } = useAuthStore();

  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('TCP_CONNECT');
  const [ports, setPorts] = useState('22,80,443,3000,3306,3389,8080');
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Push logs to the visual terminal screen
  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    // Set baseline AI Assistant context
    setContext({ tool: 'port-scanner', data: null });
  }, [setContext]);

  // Handle target restriction helper for students
  const isStudent = user?.role === 'STUDENT';
  useEffect(() => {
    if (isStudent) {
      setTarget('scanme.nmap.org'); // default safe target
    }
  }, [isStudent]);

  // Polling loop for scan job status
  useEffect(() => {
    if (!jobId || jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

    let pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/api/scans/port/${jobId}`);
        const status = res.data.status;
        setJobStatus(status);
        addLog(`Daemon check: Job status is ${status}...`);

        if (status === 'COMPLETED') {
          clearInterval(pollInterval);
          setIsLoading(false);
          const portsData = res.data.results?.ports || [];
          setScanResults(res.data.results);
          addLog(`SUCCESS: Target scan complete. Found ${portsData.length} active ports.`);
          
          // Send findings data to AI Assistant for threat evaluation
          setContext({
            tool: 'port-scanner',
            data: { ports: portsData }
          });
        } else if (status === 'FAILED') {
          clearInterval(pollInterval);
          setIsLoading(false);
          setError(res.data.errorMsg || 'Scan job failed at daemon execution.');
          addLog(`ERROR: Daemon reported failure.`);
        }
      } catch (err: any) {
        clearInterval(pollInterval);
        setIsLoading(false);
        const errMsg = err.response?.data?.error?.message || 'Error querying daemon status.';
        setError(errMsg);
        addLog(`CRITICAL: Status fetch failed.`);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, jobStatus]);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) {
      setError('Please provide a target host IP or Domain.');
      return;
    }

    if (isStudent && target !== 'scanme.nmap.org' && target !== 'localhost' && target !== '127.0.0.1') {
      setError('Student accounts are locked to scanme.nmap.org target range for safety audits.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setScanResults(null);
    setTerminalLogs([]);
    setJobStatus('PENDING');

    addLog(`Initializing scan request to ${target} via ${scanType}...`);
    try {
      const res = await api.post('/api/scans/port', {
        target,
        scanType,
        ports: ports || undefined
      });

      const { id, status } = res.data;
      setJobId(id);
      setJobStatus(status);
      addLog(`Job successfully queued with ID: ${id}`);
      addLog(`Waiting for available daemon slot...`);
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.response?.data?.error?.message || 'Failed to dispatch port scan job.';
      setError(errMsg);
      addLog(`CRITICAL: Dispatch failed: ${errMsg}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Target config card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary shadow-neon-cyan" />
          Scanner Parameters
        </h3>

        {isStudent && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary text-xs rounded-xl flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4" />
            <span>Clearance restrictions active: Targets restricted to scanme.nmap.org.</span>
          </div>
        )}

        <form onSubmit={handleStartScan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Host / IP</label>
            <input
              type="text"
              placeholder="e.g. scanme.nmap.org"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isLoading || isStudent}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Strategy</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)} // wait, typo, it should be setScanType! Let's check
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium appearance-none"
            >
              <option value="TCP_CONNECT">TCP Connect (-sT)</option>
              <option value="SYN_STEALTH">SYN Stealth (-sS)</option>
              <option value="UDP">UDP Scan (-sU)</option>
              <option value="COMPREHENSIVE">Comprehensive (-sS -sV -O)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary text-slate-950 font-bold rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Sweep</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1.5 md:col-span-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Port Definitions (leave blank for defaults)</label>
            <input
              type="text"
              placeholder="e.g. 21,22,25,80,443,8080"
              value={ports}
              onChange={(e) => setPorts(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
            />
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Terminal and results side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Terminal Screen (Col span 1) */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/50 flex flex-col h-[320px] bg-black/80">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Audit Console Logs</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] text-green-400 space-y-1.5 scrollbar-thin">
            {terminalLogs.length > 0 ? (
              terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed break-all">{log}</div>
              ))
            ) : (
              <div className="text-slate-600 italic">CONSOLE OFFLINE: Queue a scan target to trigger logs...</div>
            )}
          </div>
        </div>

        {/* Results view (Col span 2) */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/50 flex flex-col min-h-[320px]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Scan Report Results</h4>
            {scanResults && (
              <span className="text-[10px] text-slate-500 font-semibold font-mono uppercase">
                Duration: {scanResults.scanDuration?.toFixed(2) || '0.00'}s
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[220px]">
            {scanResults ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 pb-3">
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Port</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">State</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Service</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Version Info</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.ports && scanResults.ports.length > 0 ? (
                    scanResults.ports.map((portInfo: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/10 transition-colors">
                        <td className="py-2.5 text-xs font-mono font-bold text-primary">{portInfo.port}</td>
                        <td className="py-2.5">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border inline-block ${
                            portInfo.state === 'open' 
                              ? 'bg-accent/10 text-accent border-accent/20' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {portInfo.state}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-slate-200 font-semibold">{portInfo.service}</td>
                        <td className="py-2.5 text-xs font-mono text-slate-400 truncate max-w-[200px]" title={portInfo.version}>
                          {portInfo.version || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-slate-500 font-medium">
                        No open ports detected in the tested range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-slate-500 font-medium">
                {isLoading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    <span>Executing target scan... Status: {jobStatus}</span>
                  </>
                ) : (
                  <span>Sweep report idle. Submit a host above to display port maps.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
