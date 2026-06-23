'use client';

import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../../lib/layoutStore';
import { api } from '../../../lib/api';
import { Globe, Play, Loader2, AlertCircle, ShieldAlert, CheckCircle2, Shield, Info, Calendar } from 'lucide-react';

export default function UrlAnalyzerPage() {
  const { setContext } = useLayoutStore();

  const [url, setUrl] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set AI Assistant baseline context
    setContext({ tool: 'url-analyzer', data: null });
  }, [setContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Please provide a target URL to check.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await api.post('/api/tools/url/analyze', { url });
      setResults(res.data);

      // Send analysis data to AI Assistant for threat evaluation
      setContext({
        tool: 'url-analyzer',
        data: res.data
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'URL reputation scan failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const getReputationStyle = (rep: string) => {
    switch (rep) {
      case 'Malicious': return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-neon-red';
      case 'Suspicious': return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-neon-amber';
      default: return 'bg-accent/10 text-accent border-accent/20 shadow-neon-green';
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 70) return 'text-red-400';
    if (score > 30) return 'text-amber-400';
    return 'text-accent';
  };

  return (
    <div className="space-y-8">
      {/* Parameters Setup */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary shadow-neon-cyan" />
          Target URL Reputation Scope
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-1.5 flex-1 w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Web URL Link</label>
            <input
              type="text"
              placeholder="e.g. https://google.com or suspicious-link.ru"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
            />
          </div>

          <div className="w-full md:w-48">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary text-slate-950 font-bold rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Analyze Reputation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Results View */}
      {results ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reputation score meter (Col span 1) */}
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center justify-between text-center min-h-[220px]">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Reputation Verdict</h4>
                <span className={`text-base font-black px-4 py-1.5 rounded-full border uppercase tracking-wider inline-block ${getReputationStyle(results.reputation)}`}>
                  {results.reputation}
                </span>
              </div>

              <div className="mt-6 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Risk Threat Score:</span>
                <span className={`text-5xl font-black ${getScoreColor(results.riskScore)}`}>{results.riskScore}</span>
                <span className="text-[9px] text-slate-500 block uppercase font-semibold">Scale 0 - 100</span>
              </div>
            </div>
          </div>

          {/* Indicators list (Col span 2) */}
          <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/50 flex flex-col justify-between min-h-[220px]">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Threat Indicators Diagnostics</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SSL status */}
                <div className="p-3 bg-slate-900/25 border border-slate-850 rounded-xl flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-2">SSL Cryptography:</span>
                  <div className="flex items-center gap-2">
                    {results.indicators?.sslValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="text-xs text-slate-200 font-bold">Valid certificate</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-red-400 font-bold">Invalid / Self-signed</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Abuse feeds list status */}
                <div className="p-3 bg-slate-900/25 border border-slate-850 rounded-xl flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Abuse Blocklists:</span>
                  <div className="flex items-center gap-2">
                    {results.indicators?.onBlocklist ? (
                      <>
                        <ShieldAlert className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-red-400 font-bold">Domain listed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="text-xs text-slate-200 font-bold">Clean record</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Domain age */}
                <div className="p-3 bg-slate-900/25 border border-slate-850 rounded-xl flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Domain Age:</span>
                  <div className="flex items-center gap-1 text-slate-300 font-semibold text-xs mt-1">
                    <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{results.indicators?.domainAge ?? 0} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Text details */}
            <div className="mt-6 pt-4 border-t border-slate-800/40 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Reputation Audit Details:</span>
              <p className="text-xs text-slate-350 leading-relaxed font-medium bg-slate-950/20 p-3 rounded-lg border border-slate-850">
                {results.analysis}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800/50 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-slate-400">Querying threat databases...</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Input a web target link above to request domain assessments.</span>
          )}
        </div>
      )}
    </div>
  );
}
