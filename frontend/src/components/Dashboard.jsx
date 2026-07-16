import React, { useState } from 'react';
import Heatmap from './Heatmap';
import TransportPanel from './TransportPanel';
import DecisionFeed from './DecisionFeed';

export default function Dashboard({
  stadiumData,
  transportData,
  logs,
  pendingActions,
  autoTimeout,
  onToggleAutoTimeout,
  onApproveAction,
  onDismissAction,
  simulationPaused,
  apiKeyConfigured,
  selectedZone,
  onSelectZone,
  onToggleSimulation,
  onInjectIncident,
  onResetSimulation,
  onGenerateReport,
  onExportLogs,
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
    <div className="space-y-4 relative">
      {/* API Warning Banner if key not set */}
      {!apiKeyConfigured && (
        <div className="bg-amber-500/[0.015] border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-200/90 shadow-inner z-10 relative">
          <div className="flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <div className="space-y-0.5">
              <span className="font-black uppercase tracking-wider block text-[9px] text-amber-400">MOCK AGENT FALLBACK ACTIVE</span>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                The backend did not detect a valid <code>GEMINI_API_KEY</code>. The system is running on local heuristics to simulate tool actions. Copy <code>.env.example</code> to <code>.env</code> with your key to test real GenAI orchestration!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions & Simulation Status - Merged compactly */}
      <div className="glass-panel px-5 py-3 rounded-2xl border border-white/[0.04] flex flex-wrap gap-4 justify-between items-center bg-slate-900/10 shadow-lg z-10 relative">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${simulationPaused ? 'bg-amber-500' : 'bg-teal-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${simulationPaused ? 'bg-amber-500' : 'bg-teal-500'}`}></span>
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                TELEMETRY FEED: {simulationPaused ? 'PAUSED' : 'LIVE (10s intervals)'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3.5 items-center">
            <button
              onClick={onToggleSimulation}
              className={`text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all duration-300 uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-teal-500/50 ${
                simulationPaused
                  ? 'bg-teal-700 hover:bg-teal-600 text-white border-teal-600/30 shadow-lg'
                  : 'bg-white/5 hover:bg-white/10 text-slate-350 border-white/5'
              }`}
            >
              {simulationPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            
            <button
              onClick={onResetSimulation}
              className="text-[9px] font-black bg-slate-950/60 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 px-3 py-1.5 border border-white/5 rounded-lg transition-all tracking-widest uppercase focus-visible:ring-1 focus-visible:ring-teal-500/50"
            >
              🔄 Reset DB
            </button>

            {/* AI-GENERATED OPERATIONS SHIFT REPORT BUTTON */}
            <button
              onClick={onGenerateReport}
              className="text-[9px] font-black bg-gradient-to-r from-teal-750 to-emerald-750 hover:from-teal-650 hover:to-emerald-650 text-white px-3.5 py-1.5 border border-teal-600/20 rounded-lg transition-all tracking-widest uppercase shadow-md shadow-teal-950/20 focus-visible:ring-1 focus-visible:ring-teal-500/50"
            >
              📊 Generate Shift Report
            </button>

            {/* HUMAN-IN-THE-LOOP AUTO TIMEOUT APPROVAL TOGGLE */}
            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
            
            <label className="text-[10px] text-slate-350 hover:text-slate-250 transition-colors font-bold font-mono cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoTimeout}
                onChange={onToggleAutoTimeout}
                className="rounded border-white/10 bg-slate-950 text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0"
              />
              Auto-Approve (30s)
            </label>
          </div>
        </div>

        {/* Selected Zone quick status overlay */}
        {selectedZone && (
          <div className="text-[10px] bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-1 text-slate-400 flex items-center gap-1.5 font-sans">
            <span className="font-bold text-slate-300">ACTIVE DETECTOR:</span> {selectedZone.name} ({selectedZone.crowd_density}% cap)
          </div>
        )}
      </div>

      {/* Grid containing heatmap and sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 z-10 relative">
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
            <h3 className="text-[10px] font-black text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-widest font-mono">
              <span>🚨</span> OPERATIONAL INCIDENT INJECTOR
            </h3>
            <p className="text-[11px] text-slate-450 mb-3.5 leading-normal font-sans">
              Type in a live emergency report (e.g., <i>"Bottleneck forming at Gate B entrance"</i> or <i>"visitor needs wheelchair dispatch in Grandstand North"</i>) to trigger the Commander AI Agent's real-time reasoning and tool response.
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
                className="bg-red-750 hover:bg-red-650 disabled:bg-slate-900/60 disabled:text-slate-600 text-white font-extrabold text-[10px] px-5 py-3.5 rounded-xl transition-all duration-200 shrink-0 uppercase tracking-widest border border-red-650/20 focus-visible:ring-1 focus-visible:ring-red-600"
              >
                Inject Incident
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Sidebar containing Transport & Logs unified in one card */}
        <div className="xl:col-span-1 glass-panel p-5 rounded-2xl border border-white/[0.04] shadow-2xl flex flex-col justify-between min-h-[580px] xl:h-[720px] bg-slate-950/15 overflow-hidden">
          <div className="h-[210px] shrink-0 overflow-hidden">
            <TransportPanel transportData={transportData} prefersReduced={prefersReduced} />
          </div>
          
          {/* Subtle gradient hairline divider */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-3.5 shrink-0"></div>
          
          <div className="flex-1 overflow-hidden">
            <DecisionFeed 
              logs={logs} 
              pendingActions={pendingActions}
              onApprove={onApproveAction}
              onDismiss={onDismissAction}
              onExportLogs={onExportLogs}
              prefersReduced={prefersReduced} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
