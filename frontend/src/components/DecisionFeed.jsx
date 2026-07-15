import React, { useState } from 'react';

export default function DecisionFeed({ logs }) {
  const [expandedLogIndex, setExpandedLogIndex] = useState(null);

  const getTriggerBadge = (trigger) => {
    const text = trigger.toLowerCase();
    if (text.includes('incident')) {
      return 'bg-rose-500/10 text-rose-450 border-rose-500/25 glow-text-rose';
    }
    if (text.includes('alert') || text.includes('occupancy')) {
      return 'bg-orange-500/10 text-orange-450 border-orange-500/25';
    }
    return 'bg-blue-500/10 text-blue-450 border-blue-500/25';
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
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-2xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-900/60">
        <h2 className="text-base font-extrabold tracking-wider text-slate-100 flex items-center gap-2">
          <span>🧠</span> AI DECISION LOGS
        </h2>
        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-350 px-2 py-0.5 rounded-full font-bold">
          {logs.length} Event{logs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feed container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[580px]">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-16 text-center">
            <span className="text-3xl mb-2 animate-pulse">📡</span>
            <p className="text-xs font-bold text-slate-400">Awaiting telemetry tick...</p>
            <p className="text-[10px] text-slate-600 mt-1">Autonomous cycles start in background</p>
          </div>
        ) : (
          [...logs].reverse().map((log, index) => {
            const isExpanded = expandedLogIndex === index;
            const isIncident = log.trigger.toLowerCase().includes('incident');
            const isAlert = log.trigger.toLowerCase().includes('occupancy') || log.trigger.toLowerCase().includes('alert');

            return (
              <div
                key={log.timestamp + index}
                className={`border rounded-xl p-4 transition-all duration-300 ${
                  isIncident
                    ? 'bg-rose-950/5 border-rose-500/15 hover:border-rose-500/30'
                    : isAlert
                    ? 'bg-orange-950/5 border-orange-500/15 hover:border-orange-500/30'
                    : 'bg-slate-950/20 border-slate-900/80 hover:border-slate-800'
                } animate-fade-in`}
              >
                {/* Log Header */}
                <div className="flex justify-between items-start gap-4 mb-2.5">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono block">
                      TICK TIME: {formatTimestamp(log.timestamp)} • UTC
                    </span>
                    <span className={`inline-block text-[9px] font-black tracking-wider px-2 py-0.5 rounded border ${getTriggerBadge(log.trigger)}`}>
                      {isIncident ? '🚨 INCIDENT REPORT' : isAlert ? '⚠️ OVERCROWD ALERT' : '⚙️ ROUTINE SCAN'}
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedLogIndex(isExpanded ? null : index)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-extrabold focus:outline-none transition-colors"
                  >
                    {isExpanded ? '[- Close trace]' : '[+ View trace]'}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs font-extrabold text-slate-350 leading-relaxed mb-2.5 border-l-2 border-slate-800 pl-2.5">
                  {log.trigger}
                </p>

                {/* Reasoning terminal block */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-3 text-[11px] leading-relaxed text-slate-300 font-mono selection:bg-cyan-500/20 shadow-inner">
                  <span className="text-[9px] font-black text-cyan-500 block mb-1">STADIUM_OS://COMMANDER/THOUGHTS:</span>
                  {log.reasoning}
                </div>

                {/* Tools executed */}
                {isExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-slate-900/60 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 tracking-widest uppercase">
                      🛠️ RUNTIME TOOL EXECUTIONS ({log.tools_called.length})
                    </h4>
                    {log.tools_called.length === 0 ? (
                      <p className="text-[10px] text-slate-600 italic">Verify state normal. No actions triggered.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {log.tools_called.map((tool, tIdx) => (
                          <div key={tIdx} className="bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                            <div className="flex justify-between items-center text-[10px] mb-1.5 border-b border-slate-900/40 pb-1">
                              <span className="font-extrabold text-cyan-400 font-mono">{tool.name}()</span>
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.25 rounded font-black border border-emerald-500/20">
                                EXECUTED
                              </span>
                            </div>

                            {/* Arguments */}
                            {Object.keys(tool.args).length > 0 && (
                              <div className="mb-1.5">
                                <span className="text-[9px] text-slate-650 font-bold block">PARAMS:</span>
                                <pre className="text-[10px] text-slate-450 font-mono bg-slate-950/90 p-2 rounded border border-slate-900/40 mt-0.5 overflow-x-auto">
                                  {JSON.stringify(tool.args, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Result */}
                            <div>
                              <span className="text-[9px] text-slate-650 font-bold block">OUTPUT:</span>
                              <pre className="text-[10px] text-emerald-400/80 font-mono bg-slate-950/90 p-2 rounded border border-slate-900/40 mt-0.5 overflow-x-auto">
                                {JSON.stringify(tool.result, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
