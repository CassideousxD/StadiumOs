import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import FanInterface from './components/FanInterface';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('control-tower'); // 'control-tower' | 'fan'
  const [stadiumData, setStadiumData] = useState({});
  const [transportData, setTransportData] = useState({});
  const [logs, setLogs] = useState([]);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // 1. Accessibility: Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setShowSplash(false); // Skip intro if prefers-reduced-motion is active
    }
    
    const listener = (e) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) setShowSplash(false);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // 2. Path-based routing sync
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/fan') {
        setActiveTab('fan');
      } else {
        setActiveTab('control-tower');
        if (path !== '/control-tower') {
          window.history.replaceState({}, '', '/control-tower');
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.pushState({}, '', `/${tab}`);
  };

  // 3. Fetch active telemetry status
  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/status');
      if (!res.ok) throw new Error('API server returned error');
      const data = await res.json();
      setStadiumData(data.stadium);
      setTransportData(data.transport);
      setSimulationPaused(data.simulation_paused);
      setApiKeyConfigured(data.api_key_configured);
      
      if (data.stadium && selectedZone) {
        setSelectedZone(data.stadium[selectedZone.id]);
      }
    } catch (err) {
      console.error('Error fetching stadium status:', err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  // 4. WebSocket listener for live AI reasoning
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connectWebSocket = () => {
      ws = new WebSocket('ws://localhost:8000/ws/logs');

      ws.onopen = () => {
        console.log('Connected to StadiumOS log stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'history') {
            setLogs(data.logs);
          } else if (data.type === 'new_log') {
            setLogs(prev => [...prev, data.log]);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // 5. API mutations
  const toggleSimulation = async () => {
    const nextState = !simulationPaused;
    try {
      const res = await fetch('http://localhost:8000/api/simulation/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: nextState })
      });
      if (res.ok) {
        setSimulationPaused(nextState);
      }
    } catch (err) {
      console.error('Error toggling simulation:', err);
    }
  };

  const injectIncident = async (description) => {
    try {
      const res = await fetch('http://localhost:8000/api/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (res.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Error injecting incident:', err);
    }
  };

  const resetSimulation = async () => {
    if (!window.confirm('Are you sure you want to reset all stadium telemetry and AI log history?')) return;
    try {
      const res = await fetch('http://localhost:8000/api/reset', {
        method: 'POST'
      });
      if (res.ok) {
        setLogs([]);
        fetchStatus();
      }
    } catch (err) {
      console.error('Error resetting simulation:', err);
    }
  };

  // SKELETON LOADING STATE
  if (loading && Object.keys(stadiumData).length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A12] p-6 space-y-6 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <div className="h-16 w-full bg-white/[0.01] border border-white/[0.03] rounded-2xl flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/[0.03] rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-white/[0.03] rounded animate-pulse"></div>
              <div className="h-2.5 w-36 bg-white/[0.015] rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-48 h-10 bg-white/[0.02] rounded-xl animate-pulse"></div>
        </div>

        {/* Controls Skeleton */}
        <div className="h-14 w-full bg-white/[0.01] border border-white/[0.03] rounded-2xl animate-pulse"></div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1">
          <div className="xl:col-span-3 space-y-4 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-5 flex flex-col justify-between h-[180px]">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-20 bg-white/[0.03] rounded animate-pulse"></div>
                    <div className="h-4 w-12 bg-white/[0.03] rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-14 bg-white/[0.01] rounded animate-pulse"></div>
                    <div className="h-6 w-24 bg-white/[0.03] rounded animate-pulse"></div>
                  </div>
                  <div className="h-2 w-full bg-white/[0.02] rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="h-[120px] bg-white/[0.01] border border-white/[0.03] rounded-2xl animate-pulse"></div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-4">
            <div className="h-[280px] bg-white/[0.01] border border-white/[0.03] rounded-2xl animate-pulse"></div>
            <div className="flex-1 min-h-[300px] bg-white/[0.01] border border-white/[0.03] rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Route tab variant crossfade + scale
  const tabVariants = {
    initial: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.98
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1] // Custom ease-out curve
      }
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 1.01,
      transition: {
        duration: 0.22,
        ease: "easeIn"
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <motion.div
          key="splash"
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.05 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50"
        >
          <SplashScreen onEnter={() => setShowSplash(false)} prefersReduced={prefersReducedMotion} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen flex flex-col ambient-bg relative overflow-x-hidden"
        >
          {/* Ambient Glow Orbs */}
          <div className="glow-orb glow-orb-green"></div>
          <div className="glow-orb glow-orb-teal"></div>

          {/* Nav Header */}
          <header className="sticky top-0 z-50 px-6 py-3.5 mx-4 my-3 rounded-2xl glass-panel-heavy border-white/[0.06] flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F5132] to-[#14B8A6] flex items-center justify-center text-white text-xl shadow-lg shadow-teal-950/20">
                🏟️
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-100 flex items-center gap-1.5 font-display">
                  Stadium<span className="text-teal-400">OS</span>
                </h1>
                <span className="text-[9px] text-slate-400 font-bold tracking-[0.18em] block uppercase">
                  FIFA World Cup 2026 AI Control Tower
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.05] shadow-inner">
              <button
                onClick={() => handleTabChange('control-tower')}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 focus-visible:ring-1 focus-visible:ring-teal-500/50 ${
                  activeTab === 'control-tower'
                    ? 'bg-slate-900 text-teal-400 border border-white/[0.04] shadow-md shadow-slate-950/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎛️ Control Tower
              </button>
              <button
                onClick={() => handleTabChange('fan')}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 focus-visible:ring-1 focus-visible:ring-teal-500/50 ${
                  activeTab === 'fan'
                    ? 'bg-slate-900 text-teal-400 border border-white/[0.04] shadow-md shadow-slate-950/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🙋 Fan Portal
              </button>
            </nav>
          </header>

          {/* Main Container with custom Tab transitions */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-1.5 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={tabVariants}
                className="w-full h-full"
              >
                {activeTab === 'control-tower' ? (
                  <Dashboard
                    stadiumData={stadiumData}
                    transportData={transportData}
                    logs={logs}
                    simulationPaused={simulationPaused}
                    apiKeyConfigured={apiKeyConfigured}
                    selectedZone={selectedZone}
                    onSelectZone={setSelectedZone}
                    onToggleSimulation={toggleSimulation}
                    onInjectIncident={injectIncident}
                    onResetSimulation={resetSimulation}
                    prefersReduced={prefersReducedMotion}
                  />
                ) : (
                  <FanInterface
                    stadiumData={stadiumData}
                    onRefresh={fetchStatus}
                    prefersReduced={prefersReducedMotion}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="py-5 text-center border-t border-white/[0.03] text-[9px] text-slate-500 font-extrabold tracking-[0.2em] bg-slate-950/20 backdrop-blur-md relative z-10 uppercase mt-8">
            STADIUMOS © 2026 • FIFA WORLD CUP stadium MANAGEMENT AI AGENT SYSTEM
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
