import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DecisionFeed({ logs, pendingActions = [], onApprove, onDismiss, onExportLogs, prefersReduced }) {
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

  const getCategoryBadge = (category) => {
    const cat = category ? category.toLowerCase() : 'reactive';
    if (cat === 'predictive') {
      return 'bg-teal-950/40 text-teal-350 border border-teal-500/30';
    }
    if (cat === 'routine') {
      return 'bg-slate-950/40 text-slate-400 border border-white/5';
    }
    return 'bg-orange-950/40 text-orange-400 border border-orange-500/30';
  };

  const getCategoryLabel = (category) => {
    const cat = category ? category.toLowerCase() : 'reactive';
    if (cat === 'predictive') return '🔮 PREDICTIVE';
    if (cat === 'routine') return '⚙️ ROUTINE';
    return '🚨 REACTIVE';
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
      {/* Header with Export Action */}
      <div className="flex justify-between items-center mb-3.5 pb-2 border-b border-white/[0.03] shrink-0">
        <h2 className="text-[10px] font-black tracking-widest text-slate-400 flex items-center gap-2 uppercase font-mono">
          <span>🧠</span> AI DECISION LOGS
        </h2>
        
        <div className="flex items-center gap-1.5">
          {/* EXPORT DECISION AUDIT TRAIL BUTTON */}
          <button
            onClick={onExportLogs}
            className="text-[8px] font-black bg-slate-900/80 hover:bg-slate-800/85 text-teal-400 hover:text-teal-350 border border-white/5 rounded px-2.5 py-1 transition-colors uppercase font-mono tracking-wider focus-visible:ring-1 focus-visible:ring-teal-500/50"
            title="Download full decision history as a JSON file"
          >
            📥 Export
          </button>
          
          <span className="text-[9px] bg-slate-950 border border-white/5 text-slate-400 px-2 py-0.5 rounded-full font-bold font-mono">
            {logs.length} Event{logs.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Feed container with ARIA Live updates */}
      <div 
        className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px] xl:max-h-[430px]" 
        aria-live="polite" 
        role="log"
      >
        {/* 1. PENDING ACTIONS CONTAINER (HUMAN IN THE LOOP CARDS) */}
        {pendingActions.length > 0 && (
          <div className="space-y-3.5 mb-4 border-b border-white/[0.05] pb-4">
            <h3 className="text-[9px] font-black tracking-widest text-amber-400 flex items-center gap-1.5 uppercase font-mono animate-pulse">
              <span>⚠️</span> PENDING APPROVALS ({pendingActions.length})
            </h3>
            
            <AnimatePresence initial={false}>
              {pendingActions.map((action) => (
                <motion.div
                  key={action.id}
                  layout={prefersReduced ? false : "position"}
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="border border-amber-500/35 bg-amber-500/[0.015] rounded-xl p-3.5 shadow-lg shadow-amber-950/20"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 block">
                        TICK TIME: {formatTimestamp(action.timestamp)}
                      </span>
                      <span className="text-[8px] font-mono text-amber-500/80 block mt-0.5">
                        ID: {action.id}
                      </span>
                    </div>
                    <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wider uppercase font-mono animate-pulse">
                      Awaiting Staff Approval
                    </span>
                  </div>

                  {/* Trajectory classification label */}
                  <div className="mb-2">
                    <span className={`inline-block text-[8px] font-black tracking-wider px-2 py-0.5 rounded font-mono ${getCategoryBadge(action.category)}`}>
                      {getCategoryLabel(action.category)} PROPOSAL
                    </span>
                  </div>

                  {/* AI Reasoning */}
                  <p className="text-xs font-black text-slate-200 leading-relaxed mb-3 pl-2.5 border-l-2 border-amber-500/40">
                    {action.reasoning}
                  </p>

                  {/* Proposed tool execution block */}
                  <div className="bg-slate-950 border border-white/[0.03] rounded-lg p-2.5 mb-3 font-mono text-[10px]">
                    <div className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider mb-1">PROPOSED ACTION:</div>
                    <span className="font-extrabold text-teal-400">{action.tool_name}()</span>
                    <pre className="text-slate-400 mt-1 bg-slate-900/60 p-1.5 rounded border border-white/5 overflow-x-auto text-[9px]">
                      {JSON.stringify(action.args, null, 2)}
                    </pre>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => onDismiss(action.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-[9px] px-3 py-1.5 rounded-lg border border-white/5 transition-colors uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-red-600"
                    >
                      Dismiss/Override
                    </button>
                    <button
                      onClick={() => onApprove(action.id)}
                      className="bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-[9px] px-3.5 py-1.5 rounded-lg border border-teal-500/20 shadow-lg transition-colors uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-teal-450"
                    >
                      Approve Action
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 2. COMPLETED DECISION ENTRIES */}
        {logs.length === 0 ? (
          pendingActions.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
              <span className="text-2xl mb-1.5 opacity-60">📡</span>
              <p className="text-xs font-bold text-slate-350">Awaiting telemetry tick...</p>
              <p className="text-[9px] text-slate-450 mt-1 uppercase tracking-wider font-semibold font-mono">Autonomous reasoning active</p>
            </div>
          )
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
                        ? 'bg-red-950/[0.01] border-red-500/10 hover:border-red-500/30'
                        : isAlert
                        ? 'bg-orange-950/[0.01] border-orange-500/10 hover:border-orange-500/30'
                        : 'bg-white/[0.003] border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Log Header */}
                    <div className="flex justify-between items-start gap-4 mb-2.5">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-455 font-mono block">
                          TICK TIME: {formatTimestamp(log.timestamp)} • UTC
                        </span>
                        
                        <div className="flex gap-1.5 flex-wrap items-center mt-1">
                          <span className={`inline-block text-[7.5px] font-black tracking-wider px-1.5 py-0.25 rounded border ${getTriggerBadge(log.trigger)}`}>
                            {isIncident ? '🚨 INCIDENT' : isAlert ? '⚠️ OVERCROWD' : '⚙️ ROUTINE SCAN'}
                          </span>
                          
                          {/* Trajectory Category Tag */}
                          <span className={`inline-block text-[7.5px] font-black tracking-wider px-1.5 py-0.25 rounded font-mono ${getCategoryBadge(log.category)}`}>
                            {getCategoryLabel(log.category)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedLogIndex(isExpanded ? null : index)}
                        className="text-[9px] text-teal-400 hover:text-teal-350 font-black focus-visible:ring-1 focus-visible:ring-teal-500/50 rounded px-1.5 py-0.5 bg-slate-950 border border-white/5 transition-colors shrink-0"
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
                      <span className="text-[8px] font-bold text-teal-555 block mb-1">STADIUM_OS://COMMANDER/THOUGHTS:</span>
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
                            <h4 className="text-[8px] font-black text-slate-400 tracking-widest uppercase font-mono">
                              🛠️ RUNTIME TOOL EXECUTIONS ({log.tools_called.length})
                            </h4>
                            {log.tools_called.length === 0 ? (
                              <p className="text-[10px] text-slate-455 italic font-sans">Verify state normal. No actions triggered.</p>
                            ) : (
                              <div className="space-y-2.5">
                                {log.tools_called.map((tool, tIdx) => (
                                  <div key={tIdx} className="bg-slate-950 border border-white/[0.03] rounded-lg p-2.5">
                                    <div className="flex justify-between items-center text-[9px] mb-1.5 border-b border-white/[0.03] pb-1">
                                      <span className="font-extrabold text-teal-400 font-mono">{tool.name}()</span>
                                      <span className="text-[7px] bg-green-500/10 text-green-400 px-1.5 py-0.25 rounded font-black border border-green-500/20 font-mono">
                                        {tool.result === 'AWAITING_APPROVAL' ? 'PENDING' : 'EXECUTED'}
                                      </span>
                                    </div>

                                    {/* Arguments */}
                                    {Object.keys(tool.args).length > 0 && (
                                      <div className="mb-1.5">
                                        <span className="text-[8px] text-slate-455 font-bold block uppercase tracking-wider font-mono">PARAMS:</span>
                                        <pre className="text-[10px] text-slate-350 font-mono bg-slate-950/90 p-2 rounded border border-white/5 mt-0.5 overflow-x-auto">
                                          {JSON.stringify(tool.args, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {/* Result */}
                                    <div>
                                      <span className="text-[8px] text-slate-455 font-bold block uppercase tracking-wider font-mono">OUTPUT:</span>
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
