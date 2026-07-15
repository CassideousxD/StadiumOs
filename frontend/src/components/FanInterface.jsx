import React, { useState, useEffect, useRef } from 'react';

export default function FanInterface({ stadiumData, onRefresh }) {
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
    const query = question.strip ? question.strip() : question.trim();
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
    // If the alert contains translations, return a nicely formatted list or the most common ones
    if (alert.translations) {
      return (
        <div className="space-y-1.5 mt-1 text-[11px] text-slate-300 font-sans border-l-2 border-slate-700 pl-2">
          {Object.entries(alert.translations).map(([lang, text]) => (
            <p key={lang} className="italic">
              <span className="font-bold uppercase text-[9px] bg-slate-800 text-slate-400 px-1 rounded mr-1">
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Zone Alerts Panel */}
      <div className="lg:col-span-1 flex flex-col h-full gap-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col">
          <h2 className="text-lg font-bold tracking-wider text-slate-100 mb-4 flex items-center gap-2">
            <span>📍</span> SELECT YOUR ZONE
          </h2>
          <label className="text-xs font-bold text-slate-400 mb-1.5 block">STADIUM ZONE</label>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {Object.values(stadiumData).map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Alerts Feed */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl flex-1 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold tracking-wider text-slate-100 mb-3 flex items-center gap-2">
            <span>📢</span> ZONE ALERTS
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {activeAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                <span className="text-3xl mb-1">🔔</span>
                <p className="text-xs font-semibold">No active alerts for this zone</p>
                <p className="text-[10px] text-slate-650 mt-0.5">Safety advisories will appear here if issued</p>
              </div>
            ) : (
              activeAlerts.map((alert, idx) => (
                <div key={idx} className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold mb-1.5 uppercase tracking-wider">
                    <span>⚠️ ZONE ALERT</span>
                    <span>
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {getLanguageTranslation(alert)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Multilingual Assistant Chat */}
      <div className="lg:col-span-2 glass-panel rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
        {/* Chat Header */}
        <div className="bg-slate-900/80 px-5 py-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              FAN ASSISTANT
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Ask questions about crowd, gates, shuttles in any language</p>
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
            className="text-xs text-slate-400 hover:text-slate-300 underline font-bold"
          >
            Clear Chat
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[500px]">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none glow-border-blue'
                    : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[9px] text-slate-400 block mt-1.5 text-right font-medium">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800/80 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-2 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                <span className="font-semibold text-slate-500 italic ml-1">AI Assistant is typing...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900/60 border-t border-slate-800/80 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Ask where the shuttles are, or request Gate queue status..."
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
