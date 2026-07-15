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
    if (density >= 75) return 'border-red-500/25 bg-red-950/[0.03] text-rose-200 hover:border-red-500/50';
    if (density >= 60) return 'border-amber-500/25 bg-orange-950/[0.02] text-orange-200 hover:border-orange-500/50';
    if (density >= 40) return 'border-green-600/20 bg-green-950/[0.02] text-emerald-250 hover:border-green-600/40';
    // Muted slate for calm/normal state
    return 'border-white/[0.03] bg-white/[0.01] text-slate-400 hover:border-white/[0.08]';
  };

  const getPercentageBarColor = (density) => {
    if (density >= 75) return 'from-red-600 to-rose-500';
    if (density >= 60) return 'from-amber-500 to-orange-500';
    if (density >= 40) return 'from-green-600 to-emerald-500'; // Pitch green World Cup color
    return 'from-slate-700 to-slate-500';
  };

  const getStatusLabel = (density) => {
    if (density >= 75) return 'CRITICAL';
    if (density >= 60) return 'CONGESTED';
    if (density >= 40) return 'OPTIMAL';
    return 'NORMAL';
  };

  const getSVGColor = (density, isSelected) => {
    if (density >= 75) return { fill: 'rgba(239, 68, 68, 0.25)', stroke: 'rgb(239, 68, 68)', strokeWidth: isSelected ? 3 : 1.5 };
    if (density >= 60) return { fill: 'rgba(249, 115, 22, 0.15)', stroke: 'rgb(249, 115, 22)', strokeWidth: isSelected ? 3 : 1.5 };
    if (density >= 40) return { fill: 'rgba(22, 163, 74, 0.12)', stroke: 'rgb(22, 163, 74)', strokeWidth: isSelected ? 3 : 1.5 };
    return { fill: 'rgba(148, 163, 184, 0.05)', stroke: 'rgba(148, 163, 184, 0.25)', strokeWidth: isSelected ? 3 : 1 };
  };

  // Framer Motion variants
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: prefersReduced ? 0 : 0.04 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 15 } 
    }
  };

  return (
    <div className="flex flex-col h-full contain-layout-region">
      
      {/* SIGNATURE VISUAL MOMENT: STADIUM-BOWL OUTLINE HEATMAP */}
      <div className="mb-6 flex justify-center bg-slate-950/40 p-4 rounded-2xl border border-white/[0.03] relative overflow-hidden">
        {/* Decorative inner pitch glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[190px] bg-green-550/5 blur-[50px] rounded-full pointer-events-none"></div>

        <svg viewBox="0 0 600 340" className="w-full max-w-[480px] h-auto z-10">
          {/* Soccer Pitch at the Center */}
          <g opacity="0.85">
            <rect x="250" y="135" width="100" height="70" fill="#14532D" stroke="rgba(255,255,255,0.4)" strokeWidth="1" rx="2" />
            {/* Center Circle */}
            <circle cx="300" cy="170" r="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            {/* Midfield Line */}
            <line x1="300" y1="135" x2="300" y2="205" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            {/* Goal Boxes */}
            <rect x="250" y="152" width="12" height="36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <rect x="338" y="152" width="12" height="36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </g>

          {/* Stadium Zones */}
          {Object.values(stadiumData).map((zone) => {
            const isSelected = selectedZone?.id === zone.id;
            const style = getSVGColor(zone.crowd_density, isSelected);
            const isCritical = zone.crowd_density >= 75;

            // Map polygon coordinates for each zone
            let points = "";
            let textX = 300;
            let textY = 170;

            if (zone.id === 'zone_1') {
              // Gate A (North Entrance)
              points = "180,45 420,45 390,85 210,85";
              textY = 66;
            } else if (zone.id === 'zone_2') {
              // Gate B (South Entrance)
              points = "210,255 390,255 420,295 180,295";
              textY = 280;
            } else if (zone.id === 'zone_3') {
              // Concourse West (Left Wing)
              points = "75,80 180,105 180,235 75,260 45,170";
              textX = 115;
            } else if (zone.id === 'zone_4') {
              // Concourse East (Right Wing)
              points = "525,80 420,105 420,235 525,260 555,170";
              textX = 485;
            } else if (zone.id === 'zone_5') {
              // Grandstand North (Inner Top)
              points = "220,100 380,100 350,130 250,130";
              textY = 116;
            } else if (zone.id === 'zone_6') {
              // Grandstand South (Inner Bottom)
              points = "250,210 350,210 380,240 220,240";
              textY = 227;
            }

            return (
              <g 
                key={zone.id} 
                className="cursor-pointer group" 
                onClick={() => onSelectZone(zone)}
              >
                <polygon
                  points={points}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  className={`transition-all duration-300 ${
                    isCritical ? 'animate-[pulse_1.5s_infinite]' : ''
                  } group-hover:fill-white/10`}
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 6px ${style.stroke})` : 'none'
                  }}
                />
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  className={`text-[9px] font-black pointer-events-none fill-slate-400 group-hover:fill-slate-100 tracking-wider font-display transition-colors ${
                    isSelected ? 'fill-slate-100' : ''
                  }`}
                >
                  {zone.id === 'zone_1' ? 'GATE A' : zone.id === 'zone_2' ? 'GATE B' : zone.id === 'zone_3' ? 'CONCOURSE W' : zone.id === 'zone_4' ? 'CONCOURSE E' : zone.id === 'zone_5' ? 'GRANDSTAND N' : 'GRANDSTAND S'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Grid of Zones - Balanced Content Heights */}
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
          const isCritical = zone.crowd_density >= 75;
          const isCongested = zone.crowd_density >= 60 && zone.crowd_density < 75;
          const activeIncidents = (zone.incident_reports || []).filter(i => !i.resolved);
          const activeAlerts = zone.alerts || [];

          return (
            <motion.div
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              variants={cardVariants}
              whileHover={prefersReduced ? {} : { y: -3, scale: 1.01 }}
              whileTap={prefersReduced ? {} : { scale: 0.99 }}
              className={`glass-panel p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between relative shadow-xl overflow-hidden min-h-[190px] ${densityClass} ${
                isSelected ? 'ring-2 ring-green-600/80 border-transparent shadow-green-950/20' : ''
              }`}
            >
              {/* Header inside card */}
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[8px] font-extrabold tracking-widest text-slate-500 uppercase block font-mono">
                    {zone.id.replace('_', ' ')}
                  </span>
                  {/* WRAPPING CARD TITLE - NO CLIPPING */}
                  <h3 className="text-xs font-black text-slate-100 leading-tight group-hover:text-green-500 transition-colors break-words font-display">
                    {zone.name}
                  </h3>
                </div>

                {/* Highly visible alert badges */}
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border tracking-wider shrink-0 ${
                  isCritical
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-[pulse_1.5s_infinite] shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                    : isCongested
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-bold'
                    : zone.crowd_density >= 40
                    ? 'bg-green-600/10 text-green-400 border-green-600/20 font-medium'
                    : 'bg-white/5 text-slate-550 border-white/5 font-normal'
                }`}>
                  {statusLabel}
                </span>
              </div>

              {/* CORE OCCUPANCY VALUE - DOMINANT DESIGN FEATURE */}
              <div className="my-2.5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tighter text-slate-100 font-display">
                  <AnimatedNumber value={zone.crowd_density} />
                  <span className="text-lg font-bold text-slate-500 ml-0.5">%</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Capacity</span>
              </div>

              {/* Progress gauge visual - Thicker Gradient Progress Bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full p-[1px] border border-white/5 mb-3">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColorClass} transition-all duration-700 ease-out`}
                  style={{ width: `${zone.crowd_density}%` }}
                ></div>
              </div>

              {/* Grid of Metadata - EQUAL DENSITY FOR ALL CARDS */}
              <div className="grid grid-cols-2 gap-2 text-left text-[10px] border-t border-white/[0.03] pt-2.5">
                <div>
                  <span className="text-[8px] font-bold text-slate-550 block uppercase tracking-wider font-mono">
                    {zone.gate_queue_time_mins > 0 ? 'Wait Queue' : 'Access Node'}
                  </span>
                  <span className="font-extrabold text-slate-350 mt-0.5 block truncate">
                    {zone.gate_queue_time_mins > 0 
                      ? `${zone.gate_queue_time_mins} min delay` 
                      : zone.id === 'zone_3' || zone.id === 'zone_4'
                      ? 'Concourse Area'
                      : 'Spectator Area'}
                  </span>
                </div>
                
                <div>
                  <span className="text-[8px] font-bold text-slate-550 block uppercase tracking-wider font-mono">Sensors</span>
                  <span className="font-bold text-slate-400 mt-0.5 block truncate">
                    {zone.weather.temp_c}°C • {zone.weather.condition}
                  </span>
                </div>
              </div>

              {/* Accessibility/Alert Overlay Indicators */}
              {(activeIncidents.length > 0 || activeAlerts.length > 0) && (
                <div className="absolute bottom-2.5 right-2.5 flex gap-1 items-center pointer-events-none">
                  {activeIncidents.length > 0 && (
                    <span className="bg-red-650 text-white text-[7px] font-black px-1 py-0.25 rounded border border-red-500">
                      🚨 INCIDENT
                    </span>
                  )}
                  {activeAlerts.length > 0 && (
                    <span className="bg-green-700 text-white text-[7px] font-black px-1 py-0.25 rounded border border-green-600">
                      📣 ALERT
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
