import React from 'react';

export default function Heatmap({ stadiumData, selectedZone, onSelectZone }) {
  const getDensityColor = (density) => {
    if (density >= 75) return 'glow-border-red bg-gradient-to-br from-rose-950/15 to-red-950/10 text-rose-200';
    if (density >= 60) return 'glow-border-orange bg-gradient-to-br from-orange-950/10 to-amber-950/5 text-orange-200';
    if (density >= 40) return 'glow-border-green bg-gradient-to-br from-emerald-950/5 to-teal-950/5 text-emerald-200';
    return 'glow-border-blue bg-gradient-to-br from-slate-900/20 to-indigo-950/5 text-blue-200';
  };

  const getPercentageBarColor = (density) => {
    if (density >= 75) return 'from-rose-500 to-red-600';
    if (density >= 60) return 'from-orange-500 to-amber-500';
    if (density >= 40) return 'from-emerald-400 to-teal-500';
    return 'from-blue-400 to-indigo-500';
  };

  const getStatusLabel = (density) => {
    if (density >= 75) return 'CRITICAL';
    if (density >= 60) return 'CONGESTED';
    if (density >= 40) return 'OPTIMAL';
    return 'CALM';
  };

  return (
    <div className="flex flex-col h-full contain-layout-region">
      {/* Header Info */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-lg font-extrabold tracking-wider text-slate-100 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            LIVE STADIUM HEATMAP
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Click a zone card to inspect detailed sensor diagnostics and live feeds</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3.5 text-[10px] font-bold tracking-wider text-slate-400 bg-slate-950/50 p-2 rounded-xl border border-slate-900/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80 shadow-md shadow-blue-500/30"></span> CALM (&lt;40%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-md shadow-emerald-500/30"></span> OPTIMAL (40-60%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500/80 shadow-md shadow-orange-500/30"></span> HIGH (60-75%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/85 shadow-md shadow-rose-500/30 animate-pulse"></span> CRITICAL (&gt;75%)
          </div>
        </div>
      </div>

      {/* Stadium Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {Object.values(stadiumData).map((zone) => {
          const isSelected = selectedZone?.id === zone.id;
          const densityClass = getDensityColor(zone.crowd_density);
          const barColorClass = getPercentageBarColor(zone.crowd_density);
          const statusLabel = getStatusLabel(zone.crowd_density);
          const activeIncidents = (zone.incident_reports || []).filter(i => !i.resolved);
          const activeAccessibility = (zone.accessibility_alerts || []).filter(a => !a.resolved);
          const activeAlerts = zone.alerts || [];

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              className={`glass-panel p-5 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between relative shadow-xl overflow-hidden group ${densityClass} ${
                isSelected ? 'ring-2 ring-cyan-400/80 border-transparent shadow-cyan-900/30' : ''
              }`}
            >
              {/* Card shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              {/* Header inside card */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold tracking-widest text-slate-500 uppercase block">
                    {zone.id.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors duration-250 truncate max-w-[140px]">
                    {zone.name}
                  </h3>
                </div>

                {/* Status Badge */}
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border tracking-wider ${
                  zone.crowd_density >= 75
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse'
                    : zone.crowd_density >= 60
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                    : zone.crowd_density >= 40
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                }`}>
                  {statusLabel}
                </span>
              </div>

              {/* Progress gauge visual */}
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between text-xs items-baseline">
                  <span className="text-slate-400 font-medium">Occupancy Load</span>
                  <span className="text-lg font-black tracking-tight">{zone.crowd_density}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900/80 rounded-full p-0.5 border border-slate-800/40">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColorClass} transition-all duration-700`}
                    style={{ width: `${zone.crowd_density}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 my-2 text-center text-xs">
                {zone.gate_queue_time_mins > 0 && (
                  <div className="bg-slate-950/65 rounded-xl py-1.5 px-2 border border-slate-900/60">
                    <span className="text-[9px] font-bold text-slate-500 block">QUEUE TIME</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">{zone.gate_queue_time_mins} min</span>
                  </div>
                )}
                
                {activeIncidents.length > 0 && (
                  <div className="bg-rose-500/10 rounded-xl py-1.5 px-2 border border-rose-500/20">
                    <span className="text-[9px] font-bold text-rose-400 block">INCIDENTS</span>
                    <span className="font-extrabold text-rose-300 mt-0.5 block animate-bounce">{activeIncidents.length} Active</span>
                  </div>
                )}

                {activeAccessibility.length > 0 && (
                  <div className="bg-amber-500/10 rounded-xl py-1.5 px-2 border border-amber-500/20 col-span-1">
                    <span className="text-[9px] font-bold text-amber-400 block">ACCESS REQ</span>
                    <span className="font-extrabold text-amber-300 mt-0.5 block">♿ Dispatch</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900/40 pt-3 mt-2">
                <span className="font-medium">{zone.weather.temp_c}°C • {zone.weather.condition}</span>
                {activeAlerts.length > 0 && (
                  <span className="bg-cyan-500/10 text-cyan-400 font-extrabold px-2 py-0.5 rounded border border-cyan-500/25">
                    {activeAlerts.length} Broadcast{activeAlerts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
