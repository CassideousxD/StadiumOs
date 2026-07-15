import React from 'react';

export default function TransportPanel({ transportData }) {
  const getStatusBadgeColor = (status) => {
    const s = status.toLowerCase();
    if (s === 'delayed') return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    if (s === 'suspended') return 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse';
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  };

  const getLoadBarColor = (load) => {
    if (load >= 85) return 'from-rose-500 to-red-500';
    if (load >= 60) return 'from-amber-400 to-orange-500';
    return 'from-emerald-400 to-cyan-500';
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
      <div>
        <h2 className="text-base font-extrabold tracking-wider text-slate-100 mb-4 flex items-center gap-2">
          <span>🚇</span> TRANSIT MONITOR
        </h2>

        <div className="space-y-3.5">
          {Object.values(transportData).map((route) => (
            <div key={route.route_id} className="bg-slate-950/45 rounded-xl p-3 border border-slate-900/60 transition-all hover:border-slate-800">
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 truncate max-w-[140px]">{route.name}</h3>
                  <span className="text-[9px] text-slate-500 font-mono block">ID: {route.route_id}</span>
                </div>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded tracking-wider uppercase ${getStatusBadgeColor(route.status)}`}>
                  {route.status}
                </span>
              </div>

              {/* Load slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-slate-450 font-medium">Passenger Capacity</span>
                  <span className="font-bold text-slate-200">{route.load_percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden p-0.25 border border-slate-850">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getLoadBarColor(route.load_percentage)} transition-all duration-700`}
                    style={{ width: `${route.load_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Transit delay wait */}
              <div className="flex justify-between items-center text-[11px] mt-2 pt-2 border-t border-slate-900/30">
                <span className="text-slate-500">Wait Time</span>
                <span className="font-extrabold text-slate-205 flex items-center gap-1">
                  ⏱️ {route.estimated_wait_time_mins} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 border-t border-slate-900/40 pt-3 mt-4 text-center font-bold tracking-wider uppercase">
        ⚡ Synced with Commander AI
      </div>
    </div>
  );
}
