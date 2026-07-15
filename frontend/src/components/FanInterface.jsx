import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FanInterface({ stadiumData, onRefresh, prefersReduced }) {
  const [selectedZoneId, setSelectedZoneId] = useState('zone_1');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your StadiumOS Fan Assistant. You can ask me questions in English, Spanish, French, or any other language about gates, queues, transport, or weather, and I will reply in your language. Please select your zone to see local alerts.',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const currentZone = stadiumData[selectedZoneId] || {};
  const activeAlerts = currentZone.alerts || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const query = question.trim();
    if (!query) return;

    setQuestion('');
    setChatHistory(prev => [...prev, { sender: 'user', text: query, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/fan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });
      if (!res.ok) throw new Error('API server returned an error');
      const data = await res.json();
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.reply, timestamp: new Date() }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: `Sorry, I am having trouble connecting to the network right now. Error: ${err.message}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageTranslation = (alert) => {
    if (alert.translations) {
      return (
        <div className="space-y-1.5 mt-2 text-[10px] text-slate-350 font-sans border-l border-white/5 pl-3">
          {Object.entries(alert.translations).map(([lang, text]) => (
            <p key={lang} className="italic leading-normal">
              <span className="font-extrabold uppercase text-[7px] bg-slate-900 border border-white/5 text-slate-500 px-1.5 py-0.25 rounded mr-1 inline-block">
                {lang}
              </span>
              {text}
            </p>
          ))}
        </div>
      );
    }
    return <p className="text-xs text-slate-300 mt-1">{alert.message || alert.original_message}</p>;
  };

  // Stagger configurations
  const alertContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.05
      }
    }
  };

  const alertItemVariants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { type: "tween", ease: "easeOut", duration: 0.22 } }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Zone Selector & Alerts Panel */}
      <div className="lg:col-span-1 flex flex-col h-full gap-4">
        {/* Zone Dropdown */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.04] shadow-xl flex flex-col bg-slate-950/20">
          <h2 className="text-xs font-black tracking-widest text-slate-400 mb-4 flex items-center gap-2 uppercase font-display">
            <span>📍</span> SELECT YOUR ZONE
          </h2>
          <label className="text-[9px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">STADIUM ZONE</label>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="shadcn-select"
          >
            {Object.values(stadiumData).map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Alerts Feed */}
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.04] shadow-xl flex-1 overflow-hidden flex flex-col bg-slate-950/20">
          <h2 className="text-xs font-black tracking-widest text-slate-400 mb-3.5 flex items-center gap-2 uppercase font-display">
            <span>📢</span> ZONE ALERTS
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {activeAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-650 py-16 text-center">
                <span className="text-2xl mb-1.5 opacity-60">🔔</span>
                <p className="text-xs font-bold text-slate-500">No active alerts for this zone</p>
                <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider font-semibold">Safety bulletins appear here</p>
              </div>
            ) : (
              <motion.div 
                variants={alertContainerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {activeAlerts.map((alert, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={alertItemVariants}
                    className="bg-amber-500/[0.02] border border-amber-500/15 rounded-xl p-3.5 shadow-inner"
                  >
                    <div className="flex justify-between items-center text-[7px] text-amber-500 font-black mb-2 uppercase tracking-widest border-b border-amber-500/5 pb-1 font-mono">
                      <span>⚠️ PUBLIC ADVISORY</span>
                      <span>
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {getLanguageTranslation(alert)}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Assistant Chat */}
      <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/[0.04] shadow-2xl overflow-hidden flex flex-col h-full bg-slate-950/20">
        {/* Chat Header */}
        <div className="bg-slate-950/60 px-5 py-4 border-b border-white/[0.03] flex justify-between items-center">
          <div>
            <h2 className="text-xs font-black text-slate-355 flex items-center gap-2 uppercase tracking-widest font-display">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              FAN ASSISTANT
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Instant context-aware answers translated in real-time</p>
          </div>
          <button
            onClick={() => {
              setChatHistory([
                {
                  sender: 'ai',
                  text: 'History cleared. How can I help you navigate the stadium today?',
                  timestamp: new Date()
                }
              ]);
            }}
            className="text-[10px] text-slate-550 hover:text-slate-450 font-bold underline transition-colors"
          >
            Clear History
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[500px]">
          <AnimatePresence initial={false}>
            {chatHistory.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-green-700 text-white rounded-br-none border border-green-600/30'
                      : 'bg-slate-900/60 border border-white/5 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[8px] text-slate-500 block mt-1.5 text-right font-bold font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-start"
            >
              <div className="bg-slate-900/60 border border-white/5 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot"></span>
                <span className="font-bold text-slate-550 italic ml-1 uppercase text-[8px] tracking-wider">Agent is typing</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-slate-950/40 border-t border-white/[0.03] flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Ask where the shuttles are, or request Gate queue status..."
            className="flex-1 shadcn-input"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-green-700 hover:bg-green-600 disabled:bg-slate-900 disabled:text-slate-600 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all duration-200 uppercase tracking-widest border border-green-600/20 focus-visible:ring-1 focus-visible:ring-green-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
