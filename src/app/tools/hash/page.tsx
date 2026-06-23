'use client';

import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../../lib/layoutStore';
import { api } from '../../../lib/api';
import { Hash, Clipboard, Check, AlertCircle, Info } from 'lucide-react';

export default function HashPage() {
  const { setContext } = useLayoutStore();

  const [input, setInput] = useState('');
  const [results, setResults] = useState<any>(null);
  const [copiedAlg, setCopiedAlg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set AI Assistant baseline context
    setContext({ tool: 'hash', data: null });
  }, [setContext]);

  // Generate hashes dynamically as user types (with debounce)
  useEffect(() => {
    if (!input) {
      setResults(null);
      setError(null);
      return;
    }

    // Size limit check (1MB = 1048576 bytes)
    if (input.length > 1048576) {
      setError('Payload exceeded: Size is limited to 1 MB.');
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setError(null);
      try {
        const res = await api.post('/api/tools/hash', { input });
        setResults(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Error generating hashes.');
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [input]);

  const handleCopy = (alg: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedAlg(alg);
    setTimeout(() => setCopiedAlg(null), 1500);
  };

  const getPercentageUsed = () => {
    return Math.min(100, (input.length / 1048576) * 100);
  };

  const algorithms = [
    { name: 'MD5', key: 'md5', length: '128 bits / 32 hex chars', security: 'Broken' },
    { name: 'SHA-1', key: 'sha1', length: '160 bits / 40 hex chars', security: 'Deprecated' },
    { name: 'SHA-256', key: 'sha256', length: '256 bits / 64 hex chars', security: 'Secure' },
    { name: 'SHA-512', key: 'sha512', length: '512 bits / 128 hex chars', security: 'Secure' }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Panel (Col span 1) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary shadow-neon-cyan" />
            Input Workspace
          </h3>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Text payload</label>
            <textarea
              placeholder="Paste raw string code here to analyze..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-[200px] p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Size progress indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Workspace occupancy:</span>
              <span>{input.length} B / 1 MB</span>
            </div>
            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${getPercentageUsed()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Results Panel (Col span 2) */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/50 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cryptographic Hash Digest</h4>
            <span className="text-[10px] text-slate-500 font-semibold font-mono uppercase">
              Encrypted: HEX Format
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 flex-1">
            {results ? (
              algorithms.map((alg) => {
                const hashValue = results[alg.key];
                const isCopied = copiedAlg === alg.key;
                
                return (
                  <div key={alg.key} className="p-3 bg-slate-900/35 border border-slate-800/40 rounded-xl flex items-center justify-between gap-4 group">
                    <div className="overflow-hidden space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{alg.name}</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase">({alg.length})</span>
                        <span className={`text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded border ${
                          alg.security === 'Secure' 
                            ? 'bg-accent/10 text-accent border-accent/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {alg.security}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 break-all select-all leading-normal">
                        {hashValue}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(alg.key, hashValue)}
                      className="p-2 border border-slate-850 rounded-lg hover:border-primary/50 text-slate-450 hover:text-white transition-all flex-shrink-0"
                      title={`Copy ${alg.name} digest`}
                    >
                      {isCopied ? <Check className="w-4 h-4 text-accent" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-slate-500 font-medium">
                <Info className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                <span>Diagnostics ready. Populate text inside input workspace.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
