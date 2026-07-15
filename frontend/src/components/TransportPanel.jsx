import React from 'react';

export default function TransportPanel({ transportData }) {
  const getStatusColor = (status) => {
    if (status.toLowerCase() === 'delayed') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    if (status.toLowerCase() === 'suspended') return 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse';
    return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
  };

  const getLoadBarColor = (load) => {
    if (load >= 85) return 'bg-rose-500';
    if (load >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-wider text-slate-100 mb-4 flex items-center gap-2">
          <span>🚇</span> TRANSPORT MONITOR
        </h2>

        <div className="space-y-4">
          {Object.values(transportData).map((route) => (
            <div key={route.route_id} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/40">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 truncate max-w-[180px]">{route.name}</h3>
                  <span className="text-[10px] text-slate-400">Route ID: {route.route_id}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getStatusColor(route.status)}`}>
                  {route.status}
                </span>
              </div>

              {/* Progress bar of Capacity */}
              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Passenger Load</span>
                  <span className="font-bold text-slate-200">{route.load_percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getLoadBarColor(route.load_percentage)}`}
                    style={{ width: `${route.load_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Wait Time Indicator */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Wait Time</span>
                <span className="font-bold text-slate-100 flex items-center gap-1">
                  ⏱️ {route.estimated_wait_time_mins} mins
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 border-t border-slate-800/40 pt-3 mt-4 text-center">
        ⚡ Operations synched with Commander AI Agent
      </div>
    </div>
  );
}
