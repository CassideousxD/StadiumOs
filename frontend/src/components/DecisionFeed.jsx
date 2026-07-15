import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DecisionFeed({ logs, prefersReduced }) {
  const [expandedLogIndex, setExpandedLogIndex] = useState(null);

  const getTriggerBadge = (trigger) => {
    const text = trigger.toLowerCase();
    if (text.includes('incident')) {
      return 'bg-red-500/10 text-red-400 border-red-500/25 glow-text-rose';
    }
    if (text.includes('alert') || text.includes('occupancy')) {
      return 'bg-orange-500/10 text-orange-400 border-orange-500/25';
    }
    return 'bg-teal-500/10 text-teal-400 border-teal-500/25';
  };

  const formatTimestamp = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-3.5 pb-2 border-b border-white/[0.03]">
        <h2 className="text-[10px] font-black tracking-widest text-slate-400 flex items-center gap-2 uppercase font-mono">
          <span>🧠</span> AI DECISION LOGS
        </h2>
        <span className="text-[9px] bg-slate-950 border border-white/5 text-slate-400 px-2 py-0.5 rounded-full font-bold font-mono">
          {logs.length} Event{logs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feed container with ARIA Live updates */}
      <div 
        className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[380px]" 
        aria-live="polite" 
        role="log"
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
            <span className="text-2xl mb-1.5 opacity-60">📡</span>
            <p className="text-xs font-bold text-slate-350">Awaiting telemetry tick...</p>
            <p className="text-[9px] text-slate-450 mt-1 uppercase tracking-wider font-semibold font-mono">Autonomous reasoning active</p>
          </div>
        ) : (
          <div className="relative">
            <AnimatePresence initial={false}>
              {[...logs].reverse().map((log, index) => {
                const isExpanded = expandedLogIndex === index;
                const isIncident = log.trigger.toLowerCase().includes('incident');
                const isAlert = log.trigger.toLowerCase().includes('occupancy') || log.trigger.toLowerCase().includes('alert');

                return (
                  <motion.div
                    key={log.timestamp + index}
                    layout={prefersReduced ? false : "position"}
                    initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      type: "spring",
                      stiffness: 110,
                      damping: 15,
                      mass: 0.8
                    }}
                    className={`border rounded-xl p-3.5 mb-3 transition-all duration-300 ${
                      isIncident
                        ? 'bg-red-950/[0.02] border-red-500/10 hover:border-red-500/30'
                        : isAlert
                        ? 'bg-orange-950/[0.015] border-orange-500/10 hover:border-orange-500/30'
                        : 'bg-white/[0.003] border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Log Header */}
                    <div className="flex justify-between items-start gap-4 mb-2.5">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-450 font-mono block">
                          TICK TIME: {formatTimestamp(log.timestamp)} • UTC
                        </span>
                        <span className={`inline-block text-[8px] font-black tracking-wider px-2 py-0.5 rounded border ${getTriggerBadge(log.trigger)}`}>
                          {isIncident ? '🚨 INCIDENT' : isAlert ? '⚠️ OVERCROWD' : '⚙️ ROUTINE SCAN'}
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandedLogIndex(isExpanded ? null : index)}
                        className="text-[9px] text-teal-400 hover:text-teal-300 font-black focus-visible:ring-1 focus-visible:ring-teal-500/50 rounded px-1.5 py-0.5 bg-slate-950 border border-white/5 transition-colors"
                        aria-label={isExpanded ? "Hide execution trace details" : "View execution trace details"}
                      >
                        {isExpanded ? 'Hide Trace' : 'View Trace'}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs font-black text-slate-350 leading-relaxed mb-2.5 border-l border-white/5 pl-2">
                      {log.trigger}
                    </p>

                    {/* Reasoning terminal block */}
                    <div className="bg-slate-950 border border-white/[0.03] rounded-lg p-3 text-[11px] leading-relaxed text-slate-300 font-mono selection:bg-teal-500/20 shadow-inner">
                      <span className="text-[8px] font-bold text-teal-550 block mb-1">STADIUM_OS://COMMANDER/THOUGHTS:</span>
                      {log.reasoning}
                    </div>

                    {/* Tools executed - Animated Height Transition */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-3.5 border-t border-white/[0.04] space-y-3">
                            <h4 className="text-[8px] font-black text-slate-400 tracking-widest uppercase">
                              🛠️ RUNTIME TOOL EXECUTIONS ({log.tools_called.length})
                            </h4>
                            {log.tools_called.length === 0 ? (
                              <p className="text-[10px] text-slate-450 italic font-sans">Verify state normal. No actions triggered.</p>
                            ) : (
                              <div className="space-y-2.5">
                                {log.tools_called.map((tool, tIdx) => (
                                  <div key={tIdx} className="bg-slate-950 border border-white/[0.03] rounded-lg p-2.5">
                                    <div className="flex justify-between items-center text-[9px] mb-1.5 border-b border-white/[0.03] pb-1">
                                      <span className="font-extrabold text-teal-400 font-mono">{tool.name}()</span>
                                      <span className="text-[7px] bg-green-500/10 text-green-400 px-1.5 py-0.25 rounded font-black border border-green-500/20">
                                        EXECUTED
                                      </span>
                                    </div>

                                    {/* Arguments */}
                                    {Object.keys(tool.args).length > 0 && (
                                      <div className="mb-1.5">
                                        <span className="text-[8px] text-slate-450 font-bold block uppercase tracking-wider">PARAMS:</span>
                                        <pre className="text-[10px] text-slate-350 font-mono bg-slate-950/90 p-2 rounded border border-white/5 mt-0.5 overflow-x-auto">
                                          {JSON.stringify(tool.args, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {/* Result */}
                                    <div>
                                      <span className="text-[8px] text-slate-455 font-bold block uppercase tracking-wider">OUTPUT:</span>
                                      <pre className="text-[10px] text-teal-400/80 font-mono bg-slate-950/90 p-2 rounded border border-white/5 mt-0.5 overflow-x-auto">
                                        {JSON.stringify(tool.result, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
