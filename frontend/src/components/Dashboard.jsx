import React, { useState } from 'react';
import Heatmap from './Heatmap';
import TransportPanel from './TransportPanel';
import DecisionFeed from './DecisionFeed';

export default function Dashboard({
  stadiumData,
  transportData,
  logs,
  simulationPaused,
  apiKeyConfigured,
  selectedZone,
  onSelectZone,
  onToggleSimulation,
  onInjectIncident,
  onResetSimulation
}) {
  const [incidentText, setIncidentText] = useState('');
  const [injecting, setInjecting] = useState(false);

  const handleInject = async (e) => {
    e.preventDefault();
    const desc = incidentText.trim();
    if (!desc) return;

    setInjecting(true);
    try {
      await onInjectIncident(desc);
      setIncidentText('');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Warning Banner if key not set */}
      {!apiKeyConfigured && (
        <div className="bg-amber-600/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="font-bold">MOCK AGENT FALLBACK MODE ACTIVE</span>
              <p className="text-[11px] text-amber-400 mt-0.5">
                The backend did not detect a valid <code>GEMINI_API_KEY</code>. The system is running on local heuristics to simulate tool actions. Copy <code>.env.example</code> to <code>.env</code> with your key to test real GenAI orchestration!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions & Simulation Status */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-slate-900/40">
        <div className="flex gap-4 items-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SIMULATION CONTROL</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${simulationPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`}></span>
              <span className="text-xs font-bold text-slate-200">
                Status: {simulationPaused ? 'PAUSED' : 'RUNNING (Ticks every 10s)'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleSimulation}
            className={`text-xs font-black px-4 py-2 rounded-lg border transition-all duration-200 uppercase tracking-wider ${
              simulationPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-950/20 shadow-md'
                : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30'
            }`}
          >
            {simulationPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onResetSimulation}
            className="text-xs font-black bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2 border border-slate-700 rounded-lg transition-all"
          >
            🔄 Reset Simulation
          </button>
        </div>
      </div>

      {/* Grid containing heatmap and sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Side: Heatmap (Grid span 3) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl flex-1">
            <Heatmap
              stadiumData={stadiumData}
              selectedZone={selectedZone}
              onSelectZone={onSelectZone}
            />
          </div>

          {/* Incident Injector Panel */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-1.5">
              <span>🚨</span> OPERATIONAL INCIDENT INJECTOR
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Type in a live emergency report (e.g. <i>"Crowd congestion bottleneck in Gate B entrance"</i> or <i>"Visitor in Zone 3 needs wheelchair support"</i>) to trigger the Commander AI Agent's real-time reasoning and tool response.
            </p>

            <form onSubmit={handleInject} className="flex gap-3">
              <input
                type="text"
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                disabled={injecting}
                placeholder="Describe the stadium incident..."
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={injecting || !incidentText.trim()}
                className="bg-rose-700 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 shrink-0 uppercase tracking-wider"
              >
                Inject Incident
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Sidebar containing Transport & Logs */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="h-[280px]">
            <TransportPanel transportData={transportData} />
          </div>
          <div className="flex-1 h-[420px] xl:h-auto">
            <DecisionFeed logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
