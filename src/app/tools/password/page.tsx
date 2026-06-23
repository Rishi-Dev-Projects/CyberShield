'use client';

import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../../lib/layoutStore';
import { api } from '../../../lib/api';
import { Lock, RefreshCw, Clipboard, Check, Sparkles, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PasswordPage() {
  const { setContext } = useLayoutStore();
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate'>('analyze');

  // Analyze state
  const [passwordInput, setPasswordInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate state
  const [length, setLength] = useState(16);
  const [incUppercase, setIncUppercase] = useState(true);
  const [incLowercase, setIncLowercase] = useState(true);
  const [incNumbers, setIncNumbers] = useState(true);
  const [incSpecial, setIncSpecial] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Analyze password callback
  const handleAnalyze = async (pwd: string) => {
    if (!pwd) {
      setAnalysisResult(null);
      setContext({ tool: 'password', data: null });
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await api.post('/api/tools/password/analyze', { password: pwd });
      setAnalysisResult(res.data);
      
      // Update AI Copilot context
      setContext({
        tool: 'password',
        data: res.data
      });
    } catch (err) {
      console.error('Password analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounced password analysis on input change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (activeTab === 'analyze') {
        handleAnalyze(passwordInput);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [passwordInput, activeTab]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setCopied(false);
    try {
      const res = await api.post('/api/tools/password/generate', {
        length,
        includeUppercase: incUppercase,
        includeLowercase: incLowercase,
        includeNumbers: incNumbers,
        includeSpecialChars: incSpecial
      });
      
      const newPwd = res.data.password;
      setGeneratedPassword(newPwd);
      
      // Immediately run analysis on the generated password
      const analysis = await api.post('/api/tools/password/analyze', { password: newPwd });
      setAnalysisResult(analysis.data);
      
      setContext({
        tool: 'password',
        data: analysis.data
      });
    } catch (err) {
      console.error('Password generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return 'text-red-400 border-red-500/20 bg-red-500/5';
    if (score < 75) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-accent border-accent/20 bg-accent/5';
  };

  const getProgressColor = (score: number) => {
    if (score < 50) return 'bg-red-500';
    if (score < 75) return 'bg-amber-500';
    return 'bg-accent';
  };

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800/40">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'analyze' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Analyze Password
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'generate' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Generate Password
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form Panel (Col span 2) */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'analyze' ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary shadow-neon-cyan" />
                Password Analysis Console
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Input Secret Password</label>
                <input
                  type="text"
                  placeholder="Type a password to verify exposure metrics..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary shadow-neon-cyan" />
                Entropy Generator Parameters
              </h3>

              <form onSubmit={handleGenerate} className="space-y-6"> {/* wait, typo, it should call handleGenerate! Let's watch out! */}
                {/* Length slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Key Character Length</span>
                    <span className="font-mono text-primary text-xs">{length} chars</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Character set checkboxes */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-3 bg-slate-900/25 border border-slate-850 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={incUppercase}
                      onChange={(e) => setIncUppercase(e.target.checked)}
                      className="rounded border-slate-800 text-primary bg-slate-900 focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-350">Uppercase (A-Z)</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-900/25 border border-slate-850 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={incLowercase}
                      onChange={(e) => setIncLowercase(e.target.checked)}
                      className="rounded border-slate-800 text-primary bg-slate-900 focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-350">Lowercase (a-z)</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-900/25 border border-slate-850 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={incNumbers}
                      onChange={(e) => setIncNumbers(e.target.checked)}
                      className="rounded border-slate-800 text-primary bg-slate-900 focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-350">Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-900/25 border border-slate-850 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={incSpecial}
                      onChange={(e) => setIncSpecial(e.target.checked)}
                      className="rounded border-slate-800 text-primary bg-slate-900 focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-350">Symbols (@#$%)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || (!incUppercase && !incLowercase && !incNumbers && !incSpecial)}
                  className="w-full py-2.5 bg-primary text-slate-950 font-bold rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </form>

              {/* Generated Password Card */}
              {generatedPassword && (
                <div className="mt-6 p-4 bg-slate-900/30 border border-slate-800/40 rounded-xl flex items-center justify-between gap-4">
                  <span className="font-mono text-sm text-slate-200 tracking-wider break-all">{generatedPassword}</span>
                  <button
                    onClick={handleCopy}
                    className="p-2 border border-slate-850 rounded-lg hover:border-primary/50 text-slate-400 hover:text-white transition-all flex-shrink-0"
                    title="Copy secret key"
                  >
                    {copied ? <Check className="w-4 h-4 text-accent" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Info Score Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 flex flex-col min-h-[300px]">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Strength Metrics</h4>

          {analysisResult ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Score bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Entropy Rating:</span>
                  <span className={`text-sm font-black px-2 py-0.5 rounded border uppercase ${getScoreColor(analysisResult.score)}`}>
                    {analysisResult.strength} ({analysisResult.score}/100)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div 
                    className={`h-full transition-all duration-500 ${getProgressColor(analysisResult.score)}`} 
                    style={{ width: `${analysisResult.score}%` }}
                  />
                </div>
              </div>

              {/* Feedback weaknesses list */}
              <div className="space-y-2 flex-1 pt-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Structural Warnings:</span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {analysisResult.feedback && analysisResult.feedback.length > 0 ? (
                    analysisResult.feedback.map((feed: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-400 leading-normal">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{feed}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-[11px] text-accent font-medium">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span>Zero weaknesses detected. Enterprise ready.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-500">
              Score diagnostics offline. Input a password code to sweep characteristics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
