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
        // Ensure path shows control-tower if blank
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
      
      // Keep selected zone selection in sync
      if (data.stadium && selectedZone) {
        setSelectedZone(data.stadium[selectedZone.id]);
      }
    } catch (err) {
      console.error('Error fetching stadium status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll status every 2 seconds
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
        console.log('WebSocket closed, attempting reconnect in 3s...');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
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
        // Refresh immediately to show queued incident
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-cyan-400">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Initializing StadiumOS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navigation Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-950">
            🏟️
          </div>
          <div>
            <h1 className="text-lg font-black tracking-widest text-slate-100 uppercase">
              Stadium<span className="text-cyan-400">OS</span>
            </h1>
            <span className="text-[9px] text-slate-400 font-bold tracking-widest block -mt-1 uppercase">
              FIFA World Cup 2026 Operations Control
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <nav className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleTabChange('control-tower')}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'control-tower'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎛️ Control Tower
          </button>
          <button
            onClick={() => handleTabChange('fan')}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'fan'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🙋 Fan Portal
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 overflow-hidden">
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
      <footer className="py-4 text-center border-t border-slate-900/60 text-[10px] text-slate-500 font-semibold tracking-wider bg-slate-950">
        STADIUMOS © 2026 • FIFA WORLD CUP stadium MANAGEMENT AI AGENT SYSTEM
      </footer>
    </div>
  );
}
