import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import FanInterface from './components/FanInterface';

export default function App() {
  const [activeTab, setActiveTab] = useState('control-tower'); // 'control-tower' | 'fan'
  const [stadiumData, setStadiumData] = useState({});
  const [transportData, setTransportData] = useState({});
  const [logs, setLogs] = useState([]);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Path-based routing sync
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

  // 2. Fetch active telemetry status
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  // 3. WebSocket listener for live AI reasoning
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

  // 4. API mutation triggers
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

  if (loading && Object.keys(stadiumData).length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-cyan-400 font-mono">
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="font-extrabold tracking-[0.2em] text-xs uppercase animate-pulse">Initializing StadiumOS</p>
        <span className="text-[10px] text-slate-500 mt-2">Connecting to local telemetry node...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col ambient-bg relative overflow-x-hidden">
      {/* Glow Orbs in Background */}
      <div className="glow-orb glow-orb-blue"></div>
      <div className="glow-orb glow-orb-cyan"></div>
      <div className="glow-orb glow-orb-purple"></div>

      {/* Floating Glass Navigation Header */}
      <header className="sticky top-0 z-50 px-6 py-4 mx-4 my-3 rounded-2xl glass-panel-heavy border-slate-800/80 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-950/50">
            🏟️
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider text-slate-100 flex items-center gap-1.5">
              Stadium<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">OS</span>
            </h1>
            <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] block uppercase">
              FIFA World Cup 2026 AI Control Tower
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <nav className="flex gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/60 shadow-inner">
          <button
            onClick={() => handleTabChange('control-tower')}
            className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
              activeTab === 'control-tower'
                ? 'bg-slate-900 text-cyan-400 shadow-md shadow-slate-950 border border-slate-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎛️</span> Control Tower
          </button>
          <button
            onClick={() => handleTabChange('fan')}
            className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
              activeTab === 'fan'
                ? 'bg-slate-900 text-cyan-400 shadow-md shadow-slate-950 border border-slate-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🙋</span> Fan Portal
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-2 relative z-10">
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
          />
        ) : (
          <FanInterface
            stadiumData={stadiumData}
            onRefresh={fetchStatus}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-900/60 text-[10px] text-slate-500 font-bold tracking-[0.2em] bg-slate-950/40 backdrop-blur-md relative z-10 uppercase mt-8">
        STADIUMOS © 2026 • FIFA WORLD CUP stadium MANAGEMENT AI AGENT SYSTEM
      </footer>
    </div>
  );
}
