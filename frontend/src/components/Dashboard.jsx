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
    <div className="space-y-6 animate-fade-in">
      {/* API Warning Banner if key not set */}
      {!apiKeyConfigured && (
        <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-250 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-0.5">
              <span className="font-extrabold uppercase tracking-wider block text-[10px] text-amber-400">MOCK AGENT FALLBACK MODE ACTIVE</span>
              <p className="text-[11px] text-slate-350 leading-normal font-medium">
                The backend did not detect a valid <code>GEMINI_API_KEY</code>. The system is running on local heuristics to simulate tool actions. Copy <code>.env.example</code> to <code>.env</code> with your key to test real GenAI orchestration!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions & Simulation Status */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-wrap gap-4 justify-between items-center bg-slate-900/15 shadow-xl">
        <div className="flex gap-4 items-center">
          <div>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">TELEMETRY SIMULATOR</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${simulationPaused ? 'bg-amber-400' : 'bg-emerald-450'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${simulationPaused ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              </span>
              <span className="text-xs font-bold text-slate-300">
                Status: {simulationPaused ? 'PAUSED' : 'LIVE FEEDING (Ticks every 10s)'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleSimulation}
            className={`text-[10px] font-black px-4.5 py-2.5 rounded-xl border transition-all duration-300 uppercase tracking-widest ${
              simulationPaused
                ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                : 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border-amber-500/25'
            }`}
          >
            {simulationPaused ? '▶️ Resume telemetry' : '⏸️ Pause telemetry'}
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onResetSimulation}
            className="text-[10px] font-black bg-slate-950/80 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 px-4 py-2.5 border border-slate-900 rounded-xl transition-all tracking-widest uppercase"
          >
            🔄 Reset telemetry
          </button>
        </div>
      </div>

      {/* Grid containing heatmap and sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Side: Heatmap (Grid span 3) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-2xl flex-1">
            <Heatmap
              stadiumData={stadiumData}
              selectedZone={selectedZone}
              onSelectZone={onSelectZone}
            />
          </div>

          {/* Incident Injector Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-2xl">
            <h3 className="text-sm font-extrabold text-slate-100 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <span>🚨</span> OPERATIONAL INCIDENT INJECTOR
            </h3>
            <p className="text-xs text-slate-400 mb-3.5 leading-normal font-medium">
              Describe an emergency report (e.g. <i>"Crowd congestion bottleneck in Gate B entrance"</i> or <i>"Visitor in zone_3 needs wheelchair support"</i>) to trigger the Commander AI Agent's real-time reasoning and tool response.
            </p>

            <form onSubmit={handleInject} className="flex gap-3">
              <input
                type="text"
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                disabled={injecting}
                placeholder="Describe the stadium incident..."
                className="flex-1 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 shadow-inner"
              />
              <button
                type="submit"
                disabled={injecting || !incidentText.trim()}
                className="bg-rose-700 hover:bg-rose-600 disabled:bg-slate-900 disabled:text-slate-650 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all duration-200 shrink-0 uppercase tracking-widest border border-rose-600/35"
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
