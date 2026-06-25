'use client';

import React, { useEffect, useState } from 'react';
import { useLayoutStore } from '../lib/layoutStore';
import { useAuthStore } from '../lib/auth';
import { evaluateRules, Recommendation } from '../lib/aiRules';
import { 
  Bot, 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';

export default function AIAssistant() {
  const { isAiOpen, setAiOpen, activeContext } = useLayoutStore();
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Evaluate the active tool findings against the cybersecurity rules
    const rulesContext = {
      ...activeContext,
      userRole: user?.role
    };
    const results = evaluateRules(rulesContext);
    setRecommendations(results);
    
    // Auto-expand the first warning or recommendation if available
    if (results.length > 0) {
      setExpandedId(results[0].id);
    } else {
      setExpandedId(null);
    }
  }, [activeContext, user]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!isAiOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-slate-950/95 border-l border-slate-800/80 shadow-2xl z-40 flex flex-col justify-between backdrop-blur-md animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-6 h-6 text-primary shadow-neon-cyan" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">AI Copilot</h3>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Security Advisor</span>
          </div>
        </div>
        <button
          onClick={() => setAiOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Info panel */}
        <div className="p-3 bg-slate-900/35 border border-slate-800/40 rounded-lg text-xs">
          <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>Context scope</span>
            <span className="text-[10px] text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              {activeContext.tool.replace('-', ' ')}
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed font-medium">
            Analyzing current interface metrics against OWASP, NIST, and CIS framework profiles.
          </p>
        </div>

        {/* Recommendations list */}
        <div className="space-y-3">
          {recommendations.length > 0 ? (
            recommendations.map((rec) => {
              const isExpanded = expandedId === rec.id;
              const isWarning = rec.type === 'warning';
              const isAction = rec.type === 'action';

              return (
                <div 
                  key={rec.id} 
                  className={`rounded-lg border transition-all duration-300 overflow-hidden ${
                    isWarning 
                      ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50' 
                      : isAction
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                      : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
                  }`}
                >
                  {/* Collapsed view header */}
                  <button
                    onClick={() => toggleExpand(rec.id)}
                    className="w-full p-3 flex items-start justify-between text-left gap-2"
                  >
                    <div className="flex items-start gap-2.5">
                      {isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      ) : isAction ? (
                        <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{rec.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{rec.message}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded view details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-800/50 text-[11px] space-y-2.5 bg-slate-950/20">
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-400 tracking-wider uppercase text-[9px]">Recommended Actions:</span>
                        <ul className="space-y-1">
                          {rec.actions.map((act, idx) => (
                            <li key={idx} className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {rec.references && rec.references.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/40 flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-500 tracking-wider uppercase text-[9px]">References:</span>
                          {rec.references.map((ref, idx) => (
                            <span 
                              key={idx} 
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                            >
                              {ref}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-accent/80 mb-2 animate-bounce" />
              <h4 className="text-xs font-bold text-slate-300">Clean Bill of Health</h4>
              <p className="text-[10px] text-slate-500 mt-1">No warnings triggered for this context.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer watermark */}
      <div className="p-3 border-t border-slate-800/50 text-center bg-slate-900/10">
        <span className="text-[9px] font-mono text-slate-600 tracking-widest uppercase">
          CyberShield Expert System • Local Engine
        </span>
      </div>
    </div>
  );
}
