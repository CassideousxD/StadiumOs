import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (density >= 75) return 'border-red-500/20 bg-red-950/[0.02] text-rose-250 hover:border-red-500/40';
    if (density >= 60) return 'border-orange-500/20 bg-orange-950/[0.015] text-orange-255 hover:border-orange-500/40';
    if (density >= 40) return 'border-teal-500/20 bg-teal-950/[0.01] text-teal-200 hover:border-teal-500/40'; // World cup green-teal
    return 'border-white/[0.03] bg-white/[0.005] text-slate-450 hover:border-white/[0.08]';
  };

  const getPercentageBarColor = (density) => {
    if (density >= 75) return 'from-red-500 to-rose-600';
    if (density >= 60) return 'from-orange-500 to-amber-500';
    if (density >= 40) return 'from-teal-650 to-emerald-500'; // Green-teal gradient
    return 'from-slate-700 to-slate-500';
  };

  const getStatusLabel = (density) => {
    if (density >= 75) return 'CRITICAL';
    if (density >= 60) return 'CONGESTED';
    if (density >= 40) return 'OPTIMAL';
    return 'CALM';
  };

  const getDensityTheme = (density) => {
    if (density >= 75) return { color: '#EF4444', label: 'CRITICAL', dot: 'bg-red-500 animate-pulse' };
    if (density >= 60) return { color: '#F97316', label: 'CONGESTED', dot: 'bg-orange-500 animate-pulse' };
    if (density >= 40) return { color: '#14B8A6', label: 'OPTIMAL', dot: 'bg-teal-500' };
    return { color: '#64748B', label: 'CALM', dot: 'bg-slate-500' };
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

  // Scroll Reveal Animations in the style of Google Antigravity (blur + slide)
  const revealVariants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 20, filter: prefersReduced ? "blur(0px)" : "blur(6px)" },
    show: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <motion.div 
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="flex flex-col h-full contain-layout-region"
    >
      {/* Header Info */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-sm font-extrabold tracking-widest text-slate-400 flex items-center gap-2 uppercase font-display">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-550"></span>
            </span>
            LIVE STADIUM HEATMAP
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Click a zone to inspect detailed sensor diagnostics and live feeds</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3.5 text-[9px] font-black tracking-widest text-slate-550 bg-slate-950/80 p-2 py-1.5 rounded-full border border-white/[0.04] shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span> CALM
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span> OPTIMAL
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> HIGH
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> CRITICAL
          </div>
        </div>
      </div>

      {/* SIGNATURE VISUAL MOMENT: ORGANIC STADIUM SHAPE WITH RADIAL GRADIENTS */}
      <div className="mb-6 flex justify-center bg-slate-950/50 p-6 rounded-3xl border border-white/[0.03] relative overflow-hidden">
        {/* Soft Background Stadium Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[180px] bg-teal-950/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="relative w-full max-w-[480px]">
          <svg viewBox="0 0 600 340" className="w-full h-auto z-10 relative">
            <defs>
              {/* Glowing Filters */}
              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Gradients representing Stadium Fields */}
              <radialGradient id="pitch-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0F5132" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Soccer Pitch Outline */}
            <g opacity="0.6">
              <rect x="240" y="135" width="120" height="70" fill="url(#pitch-glow)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" rx="4" />
              <circle cx="300" cy="170" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="300" y1="135" x2="300" y2="205" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            </g>

            {/* Stadium Zones - Soft Bezier curves for organic stadium mapping */}
            {Object.values(stadiumData).map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const theme = getDensityTheme(zone.crowd_density);
              const isCritical = zone.crowd_density >= 75;
              const isCongested = zone.crowd_density >= 60;

              // Bezier Curves representing sectors of a rounded stadium
              let pathData = "";
              if (zone.id === 'zone_1') {
                // North Entrance Gate A (curved arch)
                pathData = "M 190,55 Q 300,10 410,55 L 380,85 Q 300,50 220,85 Z";
              } else if (zone.id === 'zone_2') {
                // South Entrance Gate B
                pathData = "M 220,255 Q 300,290 380,255 L 410,285 Q 300,330 190,285 Z";
              } else if (zone.id === 'zone_3') {
                // Left Wing Concourse West
                pathData = "M 80,90 Q 150,115 175,230 Q 80,250 55,170 Z";
              } else if (zone.id === 'zone_4') {
                // Right Wing Concourse East
                pathData = "M 520,90 Q 450,115 425,230 Q 520,250 545,170 Z";
              } else if (zone.id === 'zone_5') {
                // Grandstand North (Inner Top)
                pathData = "M 210,95 L 390,95 Q 340,125 210,125 Z";
              } else if (zone.id === 'zone_6') {
                // Grandstand South (Inner Bottom)
                pathData = "M 210,215 Q 340,215 390,245 L 210,245 Z";
              }

              // Glow configurations depending on congestion
              const glowOpacity = isCritical ? 0.45 : isCongested ? 0.25 : 0.05;
              const hoverGlow = isSelected ? 0.6 : 0.2;

              return (
                <g 
                  key={zone.id} 
                  className="cursor-pointer group" 
                  onClick={() => onSelectZone(zone)}
                >
                  {/* Glowing background duplicate path */}
                  {(isCongested || isSelected) && (
                    <motion.path
                      d={pathData}
                      fill={theme.color}
                      opacity={glowOpacity}
                      filter="url(#glow-effect)"
                      animate={isCritical && !prefersReduced ? { opacity: [glowOpacity * 0.5, glowOpacity, glowOpacity * 0.5] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="pointer-events-none"
                    />
                  )}

                  {/* Top transparent colored interactive segment */}
                  <path
                    d={pathData}
                    fill={theme.color}
                    opacity={isSelected ? 0.22 : 0.08}
                    stroke={theme.color}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-300 group-hover:opacity-20"
                  />
                </g>
              );
            })}
          </svg>

          {/* HTML FLOATING PILL LABELS WITH BACKDROP BLUR */}
          <div className="absolute inset-0 pointer-events-none">
            {Object.values(stadiumData).map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const theme = getDensityTheme(zone.crowd_density);

              let style = {};
              let name = "";
              if (zone.id === 'zone_1') {
                style = { top: '23%', left: '50%' };
                name = "Gate A";
              } else if (zone.id === 'zone_2') {
                style = { top: '77%', left: '50%' };
                name = "Gate B";
              } else if (zone.id === 'zone_3') {
                style = { top: '50%', left: '19%' };
                name = "Concourse W";
              } else if (zone.id === 'zone_4') {
                style = { top: '50%', left: '81%' };
                name = "Concourse E";
              } else if (zone.id === 'zone_5') {
                style = { top: '35%', left: '50%' };
                name = "Grandstand N";
              } else if (zone.id === 'zone_6') {
                style = { top: '65%', left: '50%' };
                name = "Grandstand S";
              }

              return (
                <div
                  key={zone.id}
                  style={style}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center transition-all duration-300"
                >
                  <button
                    onClick={() => onSelectZone(zone)}
                    className={`pointer-events-auto rounded-full px-2.5 py-1 text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-md transition-all border duration-300 ${
                      isSelected
                        ? 'bg-slate-950 text-slate-100 border-white/20 shadow-lg shadow-black/40 scale-105'
                        : 'bg-slate-950/80 text-slate-400 border-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                    {name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
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
          const theme = getDensityTheme(zone.crowd_density);
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
                isSelected ? 'ring-2 ring-teal-500/50 border-transparent shadow-teal-950/20' : ''
              }`}
            >
              {/* Header inside card */}
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase block font-mono">
                    {zone.id.replace('_', ' ')}
                  </span>
                  <h3 className="text-xs font-black text-slate-100 leading-tight group-hover:text-teal-400 transition-colors break-words font-display">
                    {zone.name}
                  </h3>
                </div>

                {/* Highly visible alert badges */}
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border tracking-wider shrink-0 ${
                  zone.crowd_density >= 75
                    ? 'bg-red-500/10 text-red-450 border-red-500/25 glow-pulse-red'
                    : zone.crowd_density >= 60
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                    : zone.crowd_density >= 40
                    ? 'bg-teal-550/10 text-teal-400 border-teal-500/25 font-bold'
                    : 'bg-white/5 text-slate-450 border-white/5 font-normal'
                }`}>
                  {theme.label}
                </span>
              </div>

              {/* CORE OCCUPANCY VALUE - DOMINANT DESIGN FEATURE */}
              <div className="my-2.5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tighter text-slate-100 font-display">
                  <AnimatedNumber value={zone.crowd_density} />
                  <span className="text-lg font-bold text-slate-500 ml-0.5">%</span>
                </span>
                <span className="text-[10px] text-slate-550 font-semibold uppercase tracking-wider font-mono">Capacity</span>
              </div>

              {/* Thicker Gradient Progress Bar */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full p-[1px] border border-white/5 mb-3">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColorClass} transition-all duration-700 ease-out`}
                  style={{ width: `${zone.crowd_density}%` }}
                ></div>
              </div>

              {/* Grid of Metadata */}
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
                    <span className="bg-teal-700 text-white text-[7px] font-black px-1 py-0.25 rounded border border-teal-600">
                      📣 ALERT
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
