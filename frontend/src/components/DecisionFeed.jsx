import React, { useState } from 'react';

export default function DecisionFeed({ logs }) {
  const [expandedLogIndex, setExpandedLogIndex] = useState(null);

  const getTriggerColor = (trigger) => {
    const text = trigger.toLowerCase();
    if (text.includes('incident')) return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    if (text.includes('alert') || text.includes('occupancy')) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
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
    <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/40">
        <h2 className="text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
          <span>🧠</span> AI DECISION LOGS
        </h2>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
          {logs.length} Event{logs.length !== 1 ? 's' : ''} Logged
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[580px]">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
            <span className="text-4xl mb-2 animate-pulse">📡</span>
            <p className="text-sm font-semibold">Awaiting first telemetry tick...</p>
            <p className="text-xs text-slate-600 mt-1">Simulated stadium updates run in the background</p>
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
                    ? 'bg-rose-950/10 border-rose-500/20 hover:border-rose-500/40'
                    : isAlert
                    ? 'bg-orange-950/10 border-orange-500/20 hover:border-orange-500/40'
                    : 'bg-slate-900/45 border-slate-800 hover:border-slate-700/60'
                } animate-[fadeIn_0.5s_ease-out]`}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {formatTimestamp(log.timestamp)} • UTC
                    </span>
                    <span className={`inline-block text-[11px] font-black tracking-wider px-2 py-0.5 rounded border ${getTriggerColor(log.trigger)}`}>
                      {isIncident ? '🚨 INCIDENT' : isAlert ? '⚠️ ALERT' : '⚙️ ROUTINE'}
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedLogIndex(isExpanded ? null : index)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline focus:outline-none"
                  >
                    {isExpanded ? 'Hide Trace' : 'View Trace'}
                  </button>
                </div>

                {/* Trigger description */}
                <p className="text-sm font-bold text-slate-200 mb-2">{log.trigger}</p>

                {/* Agent reasoning block */}
                <div className="bg-slate-950/60 border border-slate-850/50 rounded-lg p-3 text-xs text-slate-300 leading-relaxed font-mono">
                  <span className="text-[10px] font-bold text-cyan-400 block mb-1">REASONING:</span>
                  {log.reasoning}
                </div>

                {/* Tools details if expanded */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/40 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
                      🛠️ EXECUTED TOOLS ({log.tools_called.length})
                    </h4>
                    {log.tools_called.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No tools called. Safe state verified.</p>
                    ) : (
                      <div className="space-y-2">
                        {log.tools_called.map((tool, tIdx) => (
                          <div key={tIdx} className="bg-slate-950/80 rounded-lg p-2 border border-slate-850">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="font-bold text-cyan-400 font-mono">{tool.name}()</span>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.25 rounded font-black border border-emerald-500/20">
                                SUCCESS
                              </span>
                            </div>

                            {/* Arguments */}
                            {Object.keys(tool.args).length > 0 && (
                              <div className="mb-1">
                                <span className="text-[10px] text-slate-500 font-bold">Arguments:</span>
                                <pre className="text-[10px] text-slate-400 font-mono bg-slate-900/60 p-1.5 rounded mt-0.5 overflow-x-auto">
                                  {JSON.stringify(tool.args, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Result */}
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold">Result:</span>
                              <pre className="text-[10px] text-emerald-300/80 font-mono bg-slate-900/60 p-1.5 rounded mt-0.5 overflow-x-auto">
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
