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
  onResetSimulation,
  prefersReduced
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
    <div className="space-y-4">
      {/* API Warning Banner if key not set */}
      {!apiKeyConfigured && (
        <div className="bg-amber-500/[0.02] border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-200/90 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <div className="space-y-0.5">
              <span className="font-black uppercase tracking-wider block text-[9px] text-amber-400">MOCK AGENT FALLBACK ACTIVE</span>
              <p className="text-[11px] text-slate-400 leading-normal font-medium font-sans">
                The backend did not detect a valid <code>GEMINI_API_KEY</code>. The system is running on local heuristics to simulate tool actions. Copy <code>.env.example</code> to <code>.env</code> with your key to test real GenAI orchestration!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions & Simulation Status - Merged compactly */}
      <div className="glass-panel px-5 py-3 rounded-2xl border border-white/[0.04] flex flex-wrap gap-4 justify-between items-center bg-slate-900/10 shadow-lg">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${simulationPaused ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${simulationPaused ? 'bg-amber-500' : 'bg-green-550'}`}></span>
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                TELEMETRY FEED: {simulationPaused ? 'PAUSED' : 'LIVE (10s intervals)'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onToggleSimulation}
              className={`text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all duration-300 uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-green-600 ${
                simulationPaused
                  ? 'bg-green-700 hover:bg-green-600 text-white border-green-600/30 shadow-lg'
                  : 'bg-white/5 hover:bg-white/10 text-slate-350 border-white/5'
              }`}
            >
              {simulationPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            
            <button
              onClick={onResetSimulation}
              className="text-[9px] font-black bg-slate-950/60 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 px-3 py-1.5 border border-white/5 rounded-lg transition-all tracking-widest uppercase focus-visible:ring-1 focus-visible:ring-green-650"
            >
              🔄 Reset DB
            </button>
          </div>
        </div>

        {/* Selected Zone quick status overlay */}
        {selectedZone && (
          <div className="text-[10px] bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-1 text-slate-450 flex items-center gap-1.5">
            <span className="font-bold text-slate-300">ACTIVE DETECTOR:</span> {selectedZone.name} ({selectedZone.crowd_density}% cap)
          </div>
        )}
      </div>

      {/* Grid containing heatmap and sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left Side: Heatmap (Grid span 3) */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.04] shadow-2xl flex-1 bg-slate-950/15">
            <Heatmap
              stadiumData={stadiumData}
              selectedZone={selectedZone}
              onSelectZone={onSelectZone}
              prefersReduced={prefersReduced}
            />
          </div>

          {/* Incident Injector Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.04] shadow-2xl bg-slate-950/15">
            <h3 className="text-[10px] font-black text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-widest font-display">
              <span>🚨</span> OPERATIONAL INCIDENT INJECTOR
            </h3>
            <p className="text-[11px] text-slate-400 mb-3.5 leading-normal">
              Type in a live emergency report (e.g., <i>"Crowd congestion bottleneck in Gate B"</i> or <i>"assistance needed in zone_5"</i>) to trigger the Commander AI Agent's real-time reasoning and tool response.
            </p>

            <form onSubmit={handleInject} className="flex gap-3">
              <input
                type="text"
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                disabled={injecting}
                placeholder="Describe the stadium incident..."
                className="flex-1 shadcn-input"
              />
              <button
                type="submit"
                disabled={injecting || !incidentText.trim()}
                className="bg-red-700 hover:bg-red-650 disabled:bg-slate-900/60 disabled:text-slate-600 text-white font-extrabold text-[10px] px-5 py-3.5 rounded-xl transition-all duration-200 shrink-0 uppercase tracking-widest border border-red-650/20 focus-visible:ring-1 focus-visible:ring-red-600"
              >
                Inject Incident
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Sidebar containing Transport & Logs */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="h-[285px]">
            <TransportPanel transportData={transportData} prefersReduced={prefersReduced} />
          </div>
          <div className="flex-1 h-[420px] xl:h-[350px]">
            <DecisionFeed logs={logs} prefersReduced={prefersReduced} />
          </div>
        </div>
      </div>
    </div>
  );
}
