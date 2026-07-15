import React, { useState } from 'react';

export default function Heatmap({ stadiumData, selectedZone, onSelectZone }) {
  const getDensityColor = (density) => {
    if (density >= 75) return 'from-rose-600/30 to-red-900/40 border-rose-500 text-rose-200 shadow-rose-950/30';
    if (density >= 60) return 'from-amber-600/20 to-orange-900/30 border-orange-500 text-orange-200 shadow-orange-950/30';
    if (density >= 40) return 'from-emerald-600/10 to-teal-900/20 border-emerald-500/60 text-emerald-200 shadow-emerald-950/20';
    return 'from-blue-600/10 to-indigo-900/20 border-blue-500/40 text-blue-200 shadow-blue-950/20';
  };

  const getDensityBadge = (density) => {
    if (density >= 75) return 'bg-rose-500/25 text-rose-400 border border-rose-500/40 animate-pulse';
    if (density >= 60) return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
    if (density >= 40) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          STADIUM HEATMAP
        </h2>
        <div className="flex gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Cool (&lt;40%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal (40-60%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> High (60-75%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Critical (&gt;75%)
          </div>
        </div>
      </div>

      {/* Grid of Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {Object.values(stadiumData).map((zone) => {
          const isSelected = selectedZone?.id === zone.id;
          const densityColorClass = getDensityColor(zone.crowd_density);
          const badgeClass = getDensityBadge(zone.crowd_density);
          const activeAlerts = zone.alerts || [];
          const activeIncidents = (zone.incident_reports || []).filter(i => !i.resolved);
          const accessibilityNeed = (zone.accessibility_alerts || []).filter(n => !n.resolved);

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              className={`glass-panel p-4 rounded-xl cursor-pointer border transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between shadow-lg relative bg-gradient-to-br ${densityColorClass} ${
                isSelected ? 'ring-2 ring-cyan-400 border-transparent shadow-cyan-950/20' : 'hover:border-slate-500/40'
              }`}
            >
              {/* Badges container */}
              <div className="absolute top-3 right-3 flex gap-1">
                {activeIncidents.length > 0 && (
                  <span className="bg-rose-600 text-rose-50 text-[10px] font-black px-1.5 py-0.5 rounded border border-rose-400 animate-bounce">
                    {activeIncidents.length} INCIDENT
                  </span>
                )}
                {accessibilityNeed.length > 0 && (
                  <span className="bg-amber-600 text-amber-50 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-400">
                    ♿ NEED
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {zone.id.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5 truncate">{zone.name}</h3>
              </div>

              {/* Core metrics */}
              <div className="grid grid-cols-2 gap-2 my-4">
                <div className="bg-slate-950/40 rounded-lg p-2 border border-slate-800/40">
                  <span className="text-[10px] font-semibold text-slate-400 block">Density</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black">{zone.crowd_density}%</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.25 rounded-full ${badgeClass}`}>
                      {zone.crowd_density >= 75 ? 'CRIT' : zone.crowd_density >= 60 ? 'HIGH' : zone.crowd_density >= 40 ? 'OK' : 'LOW'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/40 rounded-lg p-2 border border-slate-800/40">
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    {zone.gate_queue_time_mins > 0 ? 'Queue Time' : 'Status'}
                  </span>
                  <span className="text-2xl font-black block mt-1">
                    {zone.gate_queue_time_mins > 0 ? `${zone.gate_queue_time_mins}m` : 'Clear'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-800/30 pt-2">
                <span>{zone.weather.temp_c}°C • {zone.weather.condition}</span>
                {activeAlerts.length > 0 && (
                  <span className="text-cyan-400 font-semibold">
                    {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
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
