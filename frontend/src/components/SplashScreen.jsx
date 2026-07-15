import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onEnter, prefersReduced }) {
  useEffect(() => {
    // Prevent document body scrolling while splash screen is active
    document.body.style.overflow = 'hidden';
    
    // Auto-advance after 2.8 seconds
    const timer = setTimeout(() => {
      onEnter();
    }, 2800);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [onEnter]);

  // Framer Motion staggered variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      filter: 'blur(10px)', 
      y: prefersReduced ? 0 : 15 
    },
    show: { 
      opacity: 1, 
      filter: 'blur(0px)', 
      y: 0, 
      transition: { 
        duration: 0.7, 
        ease: [0.16, 1, 0.3, 1] 
      } 
    }
  };

  return (
    // Fixed layout bug: Removed 'relative' to allow 'fixed inset-0' to lock properly
    <div className="fixed inset-0 z-50 bg-[#0A0A12] flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Background soft glowing orb */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full filter blur-[120px] opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #14B8A6, #0F5132, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      ></div>

      {/* BACKGROUND DECORATIVE STADIUM GEOMETRIC OUTLINE (PULSING/ROTATING) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
        <svg viewBox="0 0 800 800" className="w-[120%] h-auto animate-[spin_120s_linear_infinite]">
          <circle cx="400" cy="400" r="380" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 15" />
          <circle cx="400" cy="400" r="300" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="400" cy="400" rx="350" ry="200" fill="none" stroke="white" strokeWidth="1.5" />
          <ellipse cx="400" cy="400" rx="250" ry="140" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="text-center space-y-6 max-w-lg z-10"
      >
        {/* GEOMETRIC STADIUM-BOWL LOGOMARK INSTEAD OF EMOJI */}
        <motion.div variants={itemVariants} className="flex justify-center mb-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F5132] to-[#14B8A6] flex items-center justify-center p-3 shadow-2xl shadow-teal-950/20">
            <svg viewBox="0 0 100 100" className="w-full h-full text-white">
              <ellipse cx="50" cy="50" rx="40" ry="24" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.4" />
              <ellipse cx="50" cy="50" rx="28" ry="16" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="36" y="42" width="28" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        <div className="space-y-2">
          <motion.h1 
            variants={itemVariants} 
            className="text-4xl font-extrabold tracking-tight text-slate-100 font-display sm:text-5xl"
          >
            Stadium<span className="text-teal-400">OS</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants} 
            className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400/90 font-mono"
          >
            FIFA World Cup 2026 AI Control Tower
          </motion.p>
        </div>

        <motion.p 
          variants={itemVariants} 
          className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed"
        >
          Autonomous operational intelligence and real-time reasoning orchestrating safety, transit, and sustainability.
        </motion.p>

        <motion.div variants={itemVariants} className="pt-4">
          <motion.button
            onClick={onEnter}
            whileHover={prefersReduced ? {} : { scale: 1.02, y: -1 }}
            whileTap={prefersReduced ? {} : { scale: 0.98 }}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0F5132] to-[#14B8A6] text-white shadow-lg shadow-teal-950/30 hover:shadow-teal-400/10 border border-teal-500/20 transition-shadow focus-visible:ring-1 focus-visible:ring-teal-450"
          >
            Enter Control Tower
          </motion.button>
        </motion.div>

        {/* 3 STAGGER-ANIMATED STAT CHIPS BELOW BUTTON */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-center gap-2.5 pt-6 flex-wrap"
        >
          <div className="bg-white/[0.02] border border-white/5 rounded-full px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            🛡️ 6 Zones Monitored
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-full px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            🧠 Real-time AI Reasoning
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-full px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            🌐 Multilingual Support
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative Bottom Bar */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[9px] text-slate-500 font-bold tracking-widest uppercase pointer-events-none font-mono">
        <span>STADIUMOS V1.0</span>
        <span>© FIFA 2026</span>
      </div>
    </div>
  );
}
