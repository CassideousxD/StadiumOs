import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onEnter, prefersReduced }) {
  useEffect(() => {
    // Auto-advance after 2.5 seconds
    const timer = setTimeout(() => {
      onEnter();
    }, 2800);

    return () => clearTimeout(timer);
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
        duration: 0.65, 
        ease: [0.16, 1, 0.3, 1] 
      } 
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A12] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Central Soft Ambient Glow Orb */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full filter blur-[100px] opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #14B8A6, #0F5132, transparent 65%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      ></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="text-center space-y-6 max-w-lg z-10"
      >
        <motion.div variants={itemVariants} className="flex justify-center mb-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F5132] to-[#14B8A6] flex items-center justify-center text-white text-2xl shadow-xl shadow-teal-950/20">
            🏟️
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
      </motion.div>

      {/* Decorative Bottom Bar */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[9px] text-slate-650 font-bold tracking-widest uppercase pointer-events-none">
        <span>STADIUMOS V1.0</span>
        <span>© FIFA 2026</span>
      </div>
    </div>
  );
}
