import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import FanInterface from './components/FanInterface';
import SplashScreen from './components/SplashScreen';

// Dynamic deployment endpoints based on Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const cleanBaseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
const wsUrl = `${wsProtocol}://${cleanBaseUrl}/ws/logs`;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('control-tower'); // 'control-tower' | 'fan'
  const [stadiumData, setStadiumData] = useState({});
  const [transportData, setTransportData] = useState({});
  const [logs, setLogs] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [autoTimeout, setAutoTimeout] = useState(false);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Shift Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [shiftReport, setShiftReport] = useState(null);

  // 1. Accessibility: Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setShowSplash(false);
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

  // 3. Fetch active telemetry status and config
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/status`);
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

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setAutoTimeout(data.auto_timeout_enabled);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  // 4. WebSocket listener for live AI reasoning and pending actions
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to StadiumOS log stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'history') {
            if (data.logs) setLogs(data.logs);
            if (data.pending) setPendingActions(data.pending);
          } else if (data.type === 'new_log') {
            setLogs(prev => [...prev, data.log]);
          } else if (data.type === 'new_pending') {
            setPendingActions(prev => [...prev, data.action]);
          } else if (data.type === 'resolved_pending') {
            setPendingActions(prev => prev.filter(act => act.id !== data.id));
            fetchStatus(); // Refetch status to sync changes immediately
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
      const res = await fetch(`${API_BASE_URL}/api/simulation/toggle`, {
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
      const res = await fetch(`${API_BASE_URL}/api/incident`, {
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
      const res = await fetch(`${API_BASE_URL}/api/reset`, {
        method: 'POST'
      });
      if (res.ok) {
        setLogs([]);
        setPendingActions([]);
        fetchStatus();
      }
    } catch (err) {
      console.error('Error resetting simulation:', err);
    }
  };

  // HITL Action Resolvers
  const handleApproveAction = async (actionId) => {
    try {
      await fetch(`${API_BASE_URL}/api/pending/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: actionId })
      });
    } catch (err) {
      console.error('Error approving action:', err);
    }
  };

  const handleDismissAction = async (actionId) => {
    try {
      await fetch(`${API_BASE_URL}/api/pending/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: actionId })
      });
    } catch (err) {
      console.error('Error dismissing action:', err);
    }
  };

  const handleToggleAutoTimeout = async () => {
    const nextState = !autoTimeout;
    try {
      const res = await fetch(`${API_BASE_URL}/api/config/auto-timeout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
      if (res.ok) {
        setAutoTimeout(nextState);
      }
    } catch (err) {
      console.error('Error toggling auto timeout config:', err);
    }
  };

  // Exporters & Generators
  const handleExportLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/logs/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stadium_os_decision_audit_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setShowReportModal(true);
    setShiftReport(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/shift-report`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setShiftReport(data);
      } else {
        throw new Error('Failed to generate operational report.');
      }
    } catch (err) {
      console.error('Error generating shift report:', err);
      setShiftReport({
        overview: `Failed to compile shift logs: ${err.message}`,
        incidents: 'N/A',
        actions: 'N/A',
        sustainability: 'N/A'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const copyReportToClipboard = () => {
    if (!shiftReport) return;
    const text = `STADIUMOS SHIFT OPERATIONS REPORT\n==================================\n\nOVERVIEW:\n${shiftReport.overview}\n\nINCIDENTS HANDLED:\n${shiftReport.incidents}\n\nACTIONS RECORDED:\n${shiftReport.actions}\n\nSUSTAINABILITY HIGHLIGHTS:\n${shiftReport.sustainability}`;
    navigator.clipboard.writeText(text);
    alert('Shift report copied to clipboard!');
  };

  const downloadReportText = () => {
    if (!shiftReport) return;
    const text = `STADIUMOS SHIFT OPERATIONS REPORT\n==================================\n\nOVERVIEW:\n${shiftReport.overview}\n\nINCIDENTS HANDLED:\n${shiftReport.incidents}\n\nACTIONS RECORDED:\n${shiftReport.actions}\n\nSUSTAINABILITY HIGHLIGHTS:\n${shiftReport.sustainability}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stadium_os_shift_report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
        ease: [0.16, 1, 0.3, 1]
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
                <span className="text-[9px] text-slate-400 font-bold tracking-[0.18em] block uppercase font-mono">
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

          {/* Main Container */}
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
                    pendingActions={pendingActions}
                    autoTimeout={autoTimeout}
                    onToggleAutoTimeout={handleToggleAutoTimeout}
                    onApproveAction={handleApproveAction}
                    onDismissAction={handleDismissAction}
                    simulationPaused={simulationPaused}
                    apiKeyConfigured={apiKeyConfigured}
                    selectedZone={selectedZone}
                    onSelectZone={setSelectedZone}
                    onToggleSimulation={toggleSimulation}
                    onInjectIncident={injectIncident}
                    onResetSimulation={resetSimulation}
                    onGenerateReport={handleGenerateReport}
                    onExportLogs={handleExportLogs}
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

          {/* AI SHIFT REPORT MODAL */}
          <AnimatePresence>
            {showReportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-[#0D0D18] border border-teal-500/20 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-[#0F5132]/30 to-[#14B8A6]/30 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-100 flex items-center gap-2 font-mono">
                      <span>📊</span> AI-Generated Operations Shift Report
                    </h2>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-5 max-h-[500px] overflow-y-auto font-sans">
                    {generatingReport ? (
                      <div className="py-16 text-center space-y-4 flex flex-col items-center">
                        <div className="relative w-12 h-12">
                          <span className="absolute inset-0 rounded-full border-2 border-teal-500/10"></span>
                          <span className="absolute inset-0 rounded-full border-2 border-t-teal-400 animate-spin"></span>
                        </div>
                        <p className="text-xs font-extrabold text-slate-350 tracking-wider uppercase font-mono animate-pulse">
                          Summarizing shift logs via Gemini...
                        </p>
                      </div>
                    ) : shiftReport ? (
                      <div className="space-y-4 text-xs">
                        {/* Overview Section */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                          <h3 className="font-extrabold text-[10px] text-teal-400 tracking-wider uppercase font-mono mb-1.5">
                            Overview
                          </h3>
                          <p className="text-slate-300 leading-relaxed font-medium">
                            {shiftReport.overview}
                          </p>
                        </div>

                        {/* Incidents Section */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                          <h3 className="font-extrabold text-[10px] text-orange-400 tracking-wider uppercase font-mono mb-1.5">
                            Incidents Handled
                          </h3>
                          <p className="text-slate-300 leading-relaxed font-medium">
                            {shiftReport.incidents}
                          </p>
                        </div>

                        {/* Actions Section */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                          <h3 className="font-extrabold text-[10px] text-slate-100 tracking-wider uppercase font-mono mb-1.5">
                            Actions Proportions & Log
                          </h3>
                          <p className="text-slate-300 leading-relaxed font-medium">
                            {shiftReport.actions}
                          </p>
                        </div>

                        {/* Sustainability Section */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                          <h3 className="font-extrabold text-[10px] text-green-400 tracking-wider uppercase font-mono mb-1.5">
                            Sustainability highlights
                          </h3>
                          <p className="text-slate-300 leading-relaxed font-medium">
                            {shiftReport.sustainability}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 py-10 text-center font-bold">No report generated.</p>
                    )}
                  </div>

                  {/* Modal Footer */}
                  {shiftReport && !generatingReport && (
                    <div className="bg-slate-950/40 px-6 py-4 border-t border-white/5 flex gap-2 justify-end">
                      <button
                        onClick={copyReportToClipboard}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-350 font-bold text-[9px] px-3.5 py-2.5 rounded-lg border border-white/5 uppercase tracking-wider transition-colors"
                      >
                        📋 Copy to Clipboard
                      </button>
                      <button
                        onClick={downloadReportText}
                        className="bg-teal-750 hover:bg-teal-650 text-white font-extrabold text-[9px] px-4 py-2.5 rounded-lg border border-teal-500/20 shadow-lg uppercase tracking-wider transition-colors"
                      >
                        📥 Download as Text
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <footer className="py-5 text-center border-t border-white/[0.03] text-[9px] text-slate-500 font-extrabold tracking-[0.2em] bg-slate-950/20 backdrop-blur-md relative z-10 uppercase mt-8 font-mono">
            STADIUMOS © 2026 • FIFA WORLD CUP stadium MANAGEMENT AI AGENT SYSTEM
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
