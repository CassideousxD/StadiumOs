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

// Define the 3 base paths (mathematically mirrored to construct the other 3)
const BASE_PATHS = {
  zone_1: "M 230,85 Q 400,30 570,85 L 535,110 Q 400,75 265,110 Z", // Gate A base
  zone_3: "M 120,80 Q 240,115 240,225 Q 120,260 85,170 Z",         // Concourse West base
  zone_5: "M 265,120 Q 400,90 535,120 L 510,140 Q 400,115 290,140 Z" // Grandstand North base
};

// Programmatic label positioning and collision verification
function getLabelPositions() {
  // Centroids representing the physical centers of the shapes
  const centroids = {
    zone_1: { x: 400, y: 52, dir: -1 }, // Gate A
    zone_2: { x: 400, y: 288, dir: 1 }, // Gate B (mirrored vertically)
    zone_3: { x: 145, y: 170, dir: 0 }, // Concourse West
    zone_4: { x: 655, y: 170, dir: 0 }, // Concourse East (mirrored horizontally)
    zone_5: { x: 400, y: 105, dir: 0 }, // Grandstand North
    zone_6: { x: 400, y: 235, dir: 0 }, // Grandstand South (mirrored vertically)
  };
  
  // Starting offset for outer labels
  let offset = 34;
  
  let positions = {};
  for (const [id, c] of Object.entries(centroids)) {
    positions[id] = {
      x: c.x,
      y: c.y + c.dir * offset
    };
  }
  
  // Bounding box approximation for labels (width = 80px, height = 24px)
  const width = 80;
  const height = 24;
  
  const checkCollisions = (posMap) => {
    const list = Object.entries(posMap);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [idA, posA] = list[i];
        const [idB, posB] = list[j];
        
        const leftA = posA.x - width / 2;
        const rightA = posA.x + width / 2;
        const topA = posA.y - height / 2;
        const bottomA = posA.y + height / 2;
        
        const leftB = posB.x - width / 2;
        const rightB = posB.x + width / 2;
        const topB = posB.y - height / 2;
        const bottomB = posB.y + height / 2;
        
        // Return true if boxes intersect
        const intersect = !(
          rightA < leftB ||
          leftA > rightB ||
          bottomA < topB ||
          topA > bottomB
        );
        
        if (intersect) return true;
      }
    }
    return false;
  };
  
  // Dynamically push offset further apart if labels collide
  let attempts = 0;
  while (checkCollisions(positions) && attempts < 10) {
    offset += 5;
    for (const [id, c] of Object.entries(centroids)) {
      positions[id] = {
        x: c.x,
        y: c.y + c.dir * offset
      };
    }
    attempts++;
  }
  
  return positions;
}

export default function Heatmap({ stadiumData, selectedZone, onSelectZone, prefersReduced }) {
  const getDensityColor = (density) => {
    if (density >= 75) return 'border-red-500/20 bg-red-950/[0.02] text-rose-250 hover:border-red-500/40';
    if (density >= 60) return 'border-orange-500/20 bg-orange-950/[0.015] text-orange-255 hover:border-orange-500/40';
    if (density >= 40) return 'border-teal-500/20 bg-teal-950/[0.01] text-teal-200 hover:border-teal-500/40';
    return 'border-white/[0.03] bg-white/[0.005] text-slate-400 hover:border-white/[0.08]';
  };

  const getPercentageBarColor = (density) => {
    if (density >= 75) return 'from-red-500 to-rose-600';
    if (density >= 60) return 'from-orange-500 to-amber-500';
    if (density >= 40) return 'from-teal-650 to-emerald-500';
    return 'from-slate-700 to-slate-500';
  };

  const getDensityTheme = (density) => {
    if (density >= 75) return { color: '#EF4444', label: 'CRITICAL', dot: 'bg-red-500 animate-pulse' };
    if (density >= 60) return { color: '#F97316', label: 'CONGESTED', dot: 'bg-orange-500 animate-pulse' };
    if (density >= 40) return { color: '#14B8A6', label: 'OPTIMAL', dot: 'bg-teal-500' };
    return { color: '#94A3B8', label: 'CALM', dot: 'bg-slate-400' };
  };

  const getSVGColor = (density, isSelected) => {
    if (density >= 75) return { fill: 'rgba(239, 68, 68, 0.22)', stroke: 'rgb(239, 68, 68)', strokeWidth: isSelected ? 3 : 1.5 };
    if (density >= 60) return { fill: 'rgba(249, 115, 22, 0.14)', stroke: 'rgb(249, 115, 22)', strokeWidth: isSelected ? 3 : 1.5 };
    if (density >= 40) return { fill: 'rgba(20, 184, 166, 0.12)', stroke: 'rgb(20, 184, 166)', strokeWidth: isSelected ? 3 : 1.5 };
    return { fill: 'rgba(148, 163, 184, 0.04)', stroke: 'rgba(148, 163, 184, 0.2)', strokeWidth: isSelected ? 3 : 1 };
  };

  // Label coordinate calculations
  const labelPositions = getLabelPositions();

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
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Click a zone shape or tag to inspect detailed sensor feeds</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3.5 text-[9px] font-black tracking-widest text-slate-400 bg-slate-950/80 p-2 py-1.5 rounded-full border border-white/[0.04] shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> CALM
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

      {/* SIGNATURE STADIUM HEATMAP WITH MATHEMATICAL SYMMETRY */}
      <div className="mb-6 flex justify-center bg-slate-950/50 p-4 rounded-3xl border border-white/[0.03] relative overflow-hidden">
        {/* Soft Background Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[200px] bg-teal-950/5 blur-[70px] rounded-full pointer-events-none"></div>

        <div className="relative w-full max-w-[580px]">
          {/* SVG Canvas scaled to fit container boundaries */}
          <svg viewBox="0 0 800 340" className="w-full h-auto z-10 relative">
            <defs>
              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Pitch turf grass gradient */}
              <linearGradient id="pitch-turf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B3C21" />
                <stop offset="100%" stopColor="#062312" />
              </linearGradient>
            </defs>

            {/* SYMMETRIC FOOTBALL PITCH IN THE CENTER */}
            <g opacity="0.95">
              {/* Green grass outline */}
              <rect x="320" y="120" width="160" height="100" fill="url(#pitch-turf-gradient)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" rx="3" />
              {/* Halfway Line */}
              <line x1="400" y1="120" x2="400" y2="220" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
              {/* Center Circle */}
              <circle cx="400" cy="170" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
              
              {/* Left Penalty Box */}
              <rect x="320" y="140" width="22" height="60" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
              
              {/* Right Penalty Box - Mirrored mathematically using transform */}
              <rect x="320" y="140" width="22" height="60" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" transform="translate(800,0) scale(-1,1)" />
            </g>

            {/* SYMMETRICAL STADIUM SECTOR PATHS (MIRRORED TRANSFORM PATTERNS) */}
            {Object.values(stadiumData).map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const theme = getDensityTheme(zone.crowd_density);
              const style = getSVGColor(zone.crowd_density, isSelected);
              const isCritical = zone.crowd_density >= 75;
              const isCongested = zone.crowd_density >= 60;

              // Assign base path and transformation matrix
              let pathData = "";
              let transform = "";

              if (zone.id === 'zone_1') {
                // Gate A: North Outer
                pathData = BASE_PATHS.zone_1;
              } else if (zone.id === 'zone_2') {
                // Gate B: Mirrored vertically from Gate A across center Y=170
                pathData = BASE_PATHS.zone_1;
                transform = "translate(0,340) scale(1,-1)";
              } else if (zone.id === 'zone_3') {
                // Concourse West: Left Wing
                pathData = BASE_PATHS.zone_3;
              } else if (zone.id === 'zone_4') {
                // Concourse East: Mirrored horizontally from Concourse West across center X=400
                pathData = BASE_PATHS.zone_3;
                transform = "translate(800,0) scale(-1,1)";
              } else if (zone.id === 'zone_5') {
                // Grandstand North: Inner Top
                pathData = BASE_PATHS.zone_5;
              } else if (zone.id === 'zone_6') {
                // Grandstand South: Mirrored vertically from Grandstand North across center Y=170
                pathData = BASE_PATHS.zone_5;
                transform = "translate(0,340) scale(1,-1)";
              }

              const glowOpacity = isCritical ? 0.45 : isCongested ? 0.25 : 0.05;

              return (
                <g 
                  key={zone.id} 
                  className="cursor-pointer group" 
                  onClick={() => onSelectZone(zone)}
                >
                  {/* Glowing background path for active alerts */}
                  {(isCongested || isSelected) && (
                    <motion.path
                      d={pathData}
                      transform={transform}
                      fill={theme.color}
                      opacity={glowOpacity}
                      filter="url(#glow-effect)"
                      animate={isCritical && !prefersReduced ? { opacity: [glowOpacity * 0.5, glowOpacity, glowOpacity * 0.5] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="pointer-events-none"
                    />
                  )}

                  {/* Dynamic translucent color fill segment */}
                  <path
                    d={pathData}
                    transform={transform}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    className="transition-all duration-300 group-hover:fill-white/10"
                  />
                </g>
              );
            })}
          </svg>

          {/* DYNAMIC HTML FLOATING PILL LABELS WITH BACKDROP BLUR (PROPORTIONAL OFFSET MAPS) */}
          <div className="absolute inset-0 pointer-events-none">
            {Object.values(stadiumData).map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const theme = getDensityTheme(zone.crowd_density);
              const pos = labelPositions[zone.id];

              // Convert viewBox (800x340) coordinates to responsive percentage values
              const leftPercent = `${(pos.x / 800) * 100}%`;
              const topPercent = `${(pos.y / 340) * 100}%`;

              let labelName = "";
              if (zone.id === 'zone_1') labelName = "Gate A";
              else if (zone.id === 'zone_2') labelName = "Gate B";
              else if (zone.id === 'zone_3') labelName = "Concourse W";
              else if (zone.id === 'zone_4') labelName = "Concourse E";
              else if (zone.id === 'zone_5') labelName = "Grandstand N";
              else if (zone.id === 'zone_6') labelName = "Grandstand S";

              return (
                <div
                  key={zone.id}
                  style={{ top: topPercent, left: leftPercent }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center transition-all duration-300"
                >
                  <button
                    onClick={() => onSelectZone(zone)}
                    className={`pointer-events-auto rounded-full px-2.5 py-1 text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-md transition-all border duration-300 ${
                      isSelected
                        ? 'bg-slate-950 text-slate-100 border-white/20 shadow-lg shadow-black/40 scale-105 ring-1 ring-teal-500/50'
                        : 'bg-slate-950/80 text-slate-400 border-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
                    {labelName}
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
                  <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase block font-mono">
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
                    ? 'bg-teal-555/10 text-teal-400 border-teal-500/25 font-bold'
                    : 'bg-white/5 text-slate-400 border-white/5 font-normal'
                }`}>
                  {theme.label}
                </span>
              </div>

              {/* CORE OCCUPANCY VALUE - DOMINANT DESIGN FEATURE */}
              <div className="my-2.5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tighter text-slate-100 font-display">
                  <AnimatedNumber value={zone.crowd_density} />
                  <span className="text-lg font-bold text-slate-450 ml-0.5">%</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">Capacity</span>
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
                  <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                    {zone.gate_queue_time_mins > 0 ? 'Wait Queue' : 'Access Node'}
                  </span>
                  <span className="font-extrabold text-slate-350 mt-0.5 block truncate font-mono">
                    {zone.gate_queue_time_mins > 0 
                      ? `${zone.gate_queue_time_mins} min delay` 
                      : zone.id === 'zone_3' || zone.id === 'zone_4'
                      ? 'Concourse Area'
                      : 'Spectator Area'}
                  </span>
                </div>
                
                <div>
                  <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider font-mono">Sensors</span>
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
                    <span className="bg-teal-750 text-white text-[7px] font-black px-1 py-0.25 rounded border border-teal-600">
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
