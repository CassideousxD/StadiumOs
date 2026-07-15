import React from 'react';
import { motion } from 'framer-motion';

export default function TransportPanel({ transportData, prefersReduced }) {
  const getStatusBadgeColor = (status) => {
    const s = status.toLowerCase();
    if (s === 'delayed') return 'bg-amber-500/10 text-amber-405 border border-amber-500/25';
    if (s === 'suspended') return 'bg-rose-500/10 text-rose-450 border border-rose-500/25';
    return 'bg-teal-500/10 text-teal-450 border border-teal-550/20'; // World cup teal
  };

  const getLoadBarColor = (load) => {
    if (load >= 85) return 'from-red-500 to-rose-600';
    if (load >= 60) return 'from-orange-450 to-amber-500';
    return 'from-teal-600 to-emerald-500'; // Green-teal gradient
  };

  // Stagger configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: prefersReduced ? 0 : -8 },
    show: { opacity: 1, x: 0, transition: { type: "tween", ease: "easeOut", duration: 0.2 } }
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <h2 className="text-[10px] font-black tracking-widest text-slate-500 mb-3.5 flex items-center gap-2 uppercase font-mono">
          <span>🚇</span> TRANSIT MONITOR
        </h2>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {Object.values(transportData).map((route) => (
            <motion.div 
              key={route.route_id} 
              variants={itemVariants}
              className="bg-slate-950/40 rounded-xl p-3 border border-white/[0.02] transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 truncate max-w-[130px]">{route.name}</h3>
                  <span className="text-[9px] text-slate-500 font-mono block">ID: {route.route_id}</span>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.25 rounded tracking-wider uppercase ${getStatusBadgeColor(route.status)}`}>
                  {route.status}
                </span>
              </div>

              {/* Load bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] items-center">
                  <span className="text-slate-500 font-medium font-sans">Passenger Load</span>
                  <span className="font-bold text-slate-350">{route.load_percentage}%</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden p-0.25 border border-white/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getLoadBarColor(route.load_percentage)} transition-all duration-750 ease-out`}
                    style={{ width: `${route.load_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Transit delay wait */}
              <div className="flex justify-between items-center text-[10px] mt-2 pt-1.5 border-t border-white/[0.03]">
                <span className="text-slate-550 font-sans">Wait Time</span>
                <span className="font-bold text-slate-305 flex items-center gap-1 font-mono">
                  ⏱️ {route.estimated_wait_time_mins} min
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
