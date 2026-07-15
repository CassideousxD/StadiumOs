import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Smooth numeric counter animation
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const range = end - start;
    const duration = 800; // ms
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.floor(start + range * progress);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function Heatmap({ stadiumData, selectedZone, onSelectZone, prefersReduced }) {
  const getDensityColor = (density) => {
    if (density >= 75) return 'border-red-500/25 bg-red-950/5 text-rose-200 hover:border-red-500/50';
    if (density >= 60) return 'border-orange-500/25 bg-orange-950/5 text-orange-255 hover:border-orange-500/50';
    if (density >= 40) return 'border-green-600/20 bg-green-950/5 text-emerald-200 hover:border-green-600/40';
    return 'border-white/[0.04] bg-white/[0.015] text-slate-350 hover:border-white/[0.1]';
  };

  const getPercentageBarColor = (density) => {
    if (density >= 75) return 'bg-red-650';
    if (density >= 60) return 'bg-orange-500';
    if (density >= 40) return 'bg-green-600'; // Pitch green World Cup color
    return 'bg-slate-700';
  };

  const getStatusLabel = (density) => {
    if (density >= 75) return 'CRITICAL';
    if (density >= 60) return 'CONGESTED';
    if (density >= 40) return 'OPTIMAL';
    return 'CALM';
  };

  // Framer Motion staggered grid variants
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: prefersReduced ? 0 : 12 
    },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 90, 
        damping: 14 
      } 
    }
  };

  return (
    <div className="flex flex-col h-full contain-layout-region">
      {/* Header Info */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-2 font-display">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            LIVE STADIUM HEATMAP
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Click a zone card to inspect detailed sensor diagnostics and live feeds</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3.5 text-[9px] font-black tracking-widest text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700/80"></span> CALM (&lt;40%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600/80"></span> OPTIMAL (40-60%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500/80"></span> HIGH (60-75%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-650/85 animate-pulse"></span> CRITICAL (&gt;75%)
          </div>
        </div>
      </div>

      {/* Stadium Grid */}
      <motion.div 
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1"
      >
        {Object.values(stadiumData).map((zone) => {
          const isSelected = selectedZone?.id === zone.id;
          const densityClass = getDensityColor(zone.crowd_density);
          const barColorClass = getPercentageBarColor(zone.crowd_density);
          const statusLabel = getStatusLabel(zone.crowd_density);
          const activeIncidents = (zone.incident_reports || []).filter(i => !i.resolved);
          const activeAccessibility = (zone.accessibility_alerts || []).filter(a => !a.resolved);
          const activeAlerts = zone.alerts || [];

          return (
            <motion.div
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              variants={cardVariants}
              whileHover={prefersReduced ? {} : { y: -4, scale: 1.01 }}
              whileTap={prefersReduced ? {} : { scale: 0.99 }}
              className={`glass-panel p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between relative shadow-xl overflow-hidden group ${densityClass} ${
                isSelected ? 'ring-2 ring-green-600/80 border-transparent shadow-green-950/30' : ''
              }`}
            >
              {/* Card shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              {/* Header inside card */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block">
                    {zone.id.replace('_', ' ')}
                  </span>
                  <h3 className="text-xs font-black text-slate-100 group-hover:text-green-500 transition-colors duration-250 truncate max-w-[130px] font-display">
                    {zone.name}
                  </h3>
                </div>

                {/* Status Badge */}
                <span className={`text-[8px] font-black px-1.5 py-0.25 rounded border tracking-wider ${
                  zone.crowd_density >= 75
                    ? 'bg-red-500/10 text-red-400 border-red-500/25 animate-pulse'
                    : zone.crowd_density >= 60
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                    : zone.crowd_density >= 40
                    ? 'bg-green-600/10 text-green-400 border-green-600/25'
                    : 'bg-white/5 text-slate-400 border-white/5'
                }`}>
                  {statusLabel}
                </span>
              </div>

              {/* Progress gauge visual */}
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between text-xs items-baseline font-mono">
                  <span className="text-slate-400 font-medium font-sans">Occupancy Load</span>
                  <span className="text-base font-black tracking-tight text-slate-200">
                    <AnimatedNumber value={zone.crowd_density} />%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full p-0.5 border border-white/5">
                  {/* Color bar transitions smoothly in width */}
                  <div
                    className={`h-full rounded-full ${barColorClass} transition-all duration-700`}
                    style={{ width: `${zone.crowd_density}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 my-2 text-center text-xs">
                {zone.gate_queue_time_mins > 0 && (
                  <div className="bg-slate-950/65 rounded-xl py-1.5 px-2 border border-white/5">
                    <span className="text-[8px] font-bold text-slate-500 block uppercase tracking-wider">QUEUE TIME</span>
                    <span className="font-bold text-slate-350 mt-0.5 block">{zone.gate_queue_time_mins} min</span>
                  </div>
                )}
                
                {activeIncidents.length > 0 && (
                  <div className="bg-red-500/5 rounded-xl py-1.5 px-2 border border-red-500/10 col-span-1">
                    <span className="text-[8px] font-bold text-red-400 block uppercase tracking-wider">INCIDENTS</span>
                    <span className="font-extrabold text-red-300 mt-0.5 block animate-bounce">{activeIncidents.length} Active</span>
                  </div>
                )}

                {activeAccessibility.length > 0 && (
                  <div className="bg-amber-500/5 rounded-xl py-1.5 px-2 border border-amber-500/10 col-span-1">
                    <span className="text-[8px] font-bold text-amber-400 block uppercase tracking-wider">ACCESS</span>
                    <span className="font-bold text-amber-300 mt-0.5 block">♿ Dispatch</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-white/[0.04] pt-3 mt-2">
                <span className="font-medium">{zone.weather.temp_c}°C • {zone.weather.condition}</span>
                {activeAlerts.length > 0 && (
                  <span className="bg-green-600/10 text-green-500 font-extrabold px-1.5 py-0.25 rounded border border-green-600/25">
                    {activeAlerts.length} alert{activeAlerts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
