"use client";

import React, { useState, useEffect } from 'react';

// Mock data
const mockClient = {
  name: "Leo M.",
  dob: "04/12/2018",
  behaviors: [
    { id: 'b1', name: 'Tantrums', type: 'decrease', count: 0 },
    { id: 'b2', name: 'Elopement', type: 'decrease', count: 0 },
    { id: 'b3', name: 'Indep. Requests', type: 'increase', count: 0 },
    { id: 'b4', name: 'Transitions', type: 'increase', count: 0 },
  ]
};

export default function TechnicianPortal() {
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [behaviors, setBehaviors] = useState(mockClient.behaviors);

  // AI Note States
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftedNote, setDraftedNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCount = (id: string, delta: number) => {
    if (!sessionActive) return;
    setBehaviors(prev => prev.map(b => {
      if (b.id === id) {
        const newCount = Math.max(0, b.count + delta);
        return { ...b, count: newCount };
      }
      return b;
    }));
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: mockClient.name,
          duration: formatTime(timer),
          behaviors: behaviors,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate note");

      const data = await response.json();
      setDraftedNote(data.note);

    } catch (err) {
      console.error(err);
      setError("AI generation failed. Please try again or write manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitNote = async () => {
    if (!draftedNote) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: mockClient.name,
          duration: formatTime(timer),
          summary: draftedNote,
          behaviors: behaviors,
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      alert("Success! Note digitally signed and sent to your Clinical Director.");

      setDraftedNote(null);
      setTimer(0);
      setBehaviors(mockClient.behaviors);

    } catch (err) {
      console.error(err);
      setError("Failed to save note to database. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-full relative flex flex-col">

      {/* Frosted Glass Sticky Header */}
      <div className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50 py-4 mb-6 flex items-center justify-between mx-auto w-full px-2">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-brand-indigo to-swift-blue text-white flex items-center justify-center font-bold shadow-md text-lg">
            {mockClient.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-brand-dark leading-tight">{mockClient.name}</h2>
            <div className="flex items-center mt-0.5">
              <div className={`w-2 h-2 rounded-full mr-2 ${sessionActive ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-200' : 'bg-slate-300'}`}></div>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {sessionActive ? 'Session Live' : 'Standby'}
              </p>
            </div>
          </div>
        </div>

        {/* Modern Pill Timer */}
        <div className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-mono text-xl md:text-2xl font-black transition-all duration-300 shadow-sm border ${
          sessionActive
            ? 'bg-indigo-50 border-indigo-200 text-brand-indigo ring-4 ring-indigo-50/50'
            : 'bg-white border-slate-200 text-slate-400'
        }`}>
          {formatTime(timer)}
        </div>
      </div>

      {/* Main Data Collection Area */}
      {!draftedNote && !isGenerating && (
        <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2">

          {!sessionActive && timer === 0 && (
            <div className="bg-swift-blue/10 border border-swift-blue/20 rounded-2xl p-6 text-center shadow-inner">
              <h3 className="text-brand-dark font-bold mb-1 text-lg">Ready to begin?</h3>
              <p className="text-sm text-slate-600">Start the timer below to unlock the data counters.</p>
            </div>
          )}

          {/* Redesigned Behavior Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-300 pb-28 ${!sessionActive && timer === 0 ? 'opacity-40 pointer-events-none grayscale-[30%]' : 'opacity-100'}`}>
            {behaviors.map(behavior => {
              const isDecrease = behavior.type === 'decrease';
              return (
                <div
                  key={behavior.id}
                  className={`relative overflow-hidden bg-white rounded-3xl p-5 shadow-sm border-2 transition-all ${
                    sessionActive
                      ? isDecrease ? 'border-red-100 hover:border-red-200 hover:shadow-md' : 'border-emerald-100 hover:border-emerald-200 hover:shadow-md'
                      : 'border-slate-100'
                  }`}
                >
                  {/* Top row: Name, Icon, and Value */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center space-x-2 w-2/3">
                      <svg className={`w-5 h-5 shrink-0 ${isDecrease ? 'text-red-400' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isDecrease 
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        }
                      </svg>
                      <span className="font-bold text-slate-700 leading-tight">{behavior.name}</span>
                    </div>
                    <span className={`text-3xl font-black tabular-nums tracking-tight ${isDecrease ? 'text-red-500' : 'text-emerald-500'}`}>
                      {behavior.count}
                    </span>
                  </div>

                  {/* Asymmetric Touch Targets with SVGs */}
                  <div className="flex space-x-3 mt-auto">
                    <button
                      onClick={() => handleCount(behavior.id, -1)}
                      disabled={!sessionActive || behavior.count === 0}
                      className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center active:bg-slate-200 disabled:opacity-30 transition-colors border border-slate-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                    </button>
                    <button
                      onClick={() => handleCount(behavior.id, 1)}
                      disabled={!sessionActive}
                      className={`flex-1 h-14 rounded-2xl text-white flex items-center justify-center active:scale-[0.97] transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100 ${
                        isDecrease ? 'bg-red-500 hover:bg-red-600 shadow-red-200/50' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200/50'
                      }`}
                    >
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fluid Floating Action Bar (Sticky Bottom) */}
      {!draftedNote && !isGenerating && (
        <div className="sticky bottom-6 mt-auto px-2 z-50">
          {!sessionActive ? (
            <button
              onClick={() => setSessionActive(true)}
              className="w-full py-4 bg-brand-dark text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-300/50 hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              {timer === 0 ? 'Start Session' : 'Resume Session'}
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              className="w-full py-4 bg-gradient-to-r from-swift-blue to-brand-indigo text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200/50 hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center group"
            >
              <svg className="w-6 h-6 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              End & Generate Note
            </button>
          )}
        </div>
      )}

      {/* Generating State - Polished */}
      {isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-swift-blue rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-indigo animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
          </div>
          <h3 className="text-2xl font-black text-brand-dark mb-2">Analyzing Session</h3>
          <p className="text-slate-500 font-medium">Drafting clinical summary via Groq...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-2 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start animate-in fade-in slide-in-from-top-2">
          <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Drafted Note View - AI Editor Style */}
      {draftedNote && (
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-200 animate-in slide-in-from-bottom-8 duration-500 mx-2 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-swift-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <h3 className="text-xl font-black text-brand-dark">Clinical Note</h3>
            </div>
            <span className="bg-indigo-50 text-brand-indigo text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100">
              AI Drafted
            </span>
          </div>

          <textarea
            className="w-full h-80 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 leading-relaxed focus:ring-4 focus:ring-swift-blue/10 focus:border-swift-blue focus:bg-white resize-none mb-6 text-sm md:text-base transition-all shadow-inner font-medium"
            defaultValue={draftedNote}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:space-x-4 gap-3 sm:gap-0">
            <button
              onClick={() => { setDraftedNote(null); setTimer(0); setBehaviors(mockClient.behaviors); }}
              className="w-full sm:w-1/3 py-3.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Discard
            </button>
            <button
              onClick={handleSubmitNote}
              disabled={isSaving}
              className="w-full sm:w-2/3 py-3.5 bg-brand-dark text-white rounded-xl font-bold shadow-lg shadow-slate-300/50 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center"
            >
              {isSaving ? (
                <span className="flex items-center">
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 text-swift-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  Approve & Submit
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}