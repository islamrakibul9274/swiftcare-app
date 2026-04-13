"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface INote {
  _id: string;
  clientName: string;
  rbtName: string;
  duration: string;
  summary: string;
  status: "Pending Review" | "Approved";
  date: string;
}

export default function DirectorPortal() {
  const [notes, setNotes] = useState<INote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error("Failed to load notes", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleApprove = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'PATCH' });
      if (res.ok) {
        setNotes(prev => prev.map(note => 
          note._id === noteId ? { ...note, status: "Approved" } : note
        ));
      } else {
        alert("Failed to approve note. Check permissions.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <svg className="w-10 h-10 text-brand-indigo animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-bold text-slate-500 tracking-wide uppercase text-sm">Loading Clinical Inbox...</p>
      </div>
    );
  }

  const pendingNotes = notes.filter(n => n.status === "Pending Review");
  const approvedNotes = notes.filter(n => n.status === "Approved");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Dashboard Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-amber-400 hover:-translate-y-1 transition-transform relative overflow-hidden group">
          <svg className="absolute -right-6 -top-6 w-24 h-24 text-amber-50 opacity-50 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Sign-off</p>
            <p className="text-4xl font-black text-brand-dark">{pendingNotes.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-swift-green hover:-translate-y-1 transition-transform relative overflow-hidden group">
          <svg className="absolute -right-6 -top-6 w-24 h-24 text-green-50 opacity-50 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Approved This Week</p>
            <p className="text-4xl font-black text-brand-dark">{approvedNotes.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-swift-blue hover:-translate-y-1 transition-transform relative overflow-hidden group">
          <svg className="absolute -right-4 -top-4 w-24 h-24 text-blue-50 opacity-50 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active RBTs</p>
            <p className="text-4xl font-black text-brand-dark">12</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: The Inbox */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center border-b border-slate-200 pb-3">
            <svg className="w-6 h-6 text-brand-dark mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <h3 className="text-xl font-black text-brand-dark">Action Required</h3>
          </div>
          
          {pendingNotes.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h4 className="text-lg font-bold text-brand-dark mb-1">Inbox Zero</h4>
              <p className="text-slate-500 font-medium text-sm">No pending notes. You are all caught up!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {pendingNotes.map(note => (
                <div key={note._id} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm shadow-slate-200/50 border border-amber-200/60 relative overflow-hidden group transition-all hover:shadow-md">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-3">
                    <div>
                      <div className="flex items-center space-x-3 mb-1.5">
                        <h4 className="font-black text-xl text-brand-dark">{note.clientName}</h4>
                        <Link href="/director/client/123" className="inline-flex items-center text-[10px] uppercase tracking-widest font-bold text-swift-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors">
                          View Profile <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </Link>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">Session with <span className="text-slate-700 font-bold">{note.rbtName}</span> • {note.duration}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(note.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <span className="inline-flex items-center bg-amber-50 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-2"></span>
                      Pending Review
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 md:p-5 rounded-xl text-sm text-slate-700 leading-relaxed mb-5 border border-slate-100 shadow-inner">
                    {note.summary}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button className="flex items-center justify-center px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      Request Revision
                    </button>
                    <button 
                      onClick={() => handleApprove(note._id)}
                      className="flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-swift-green hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200/50 active:scale-[0.98] transition-all"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      Approve & Lock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Approved History */}
        <div className="w-full lg:w-1/3 space-y-6">
           <div className="flex items-center border-b border-slate-200 pb-3">
            <svg className="w-6 h-6 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-xl font-bold text-brand-dark">Recently Approved</h3>
          </div>
          
          <div className="space-y-3">
            {approvedNotes.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 italic">No approved notes yet.</p>
              </div>
            ) : (
              approvedNotes.map(note => (
                <Link 
                  key={note._id} 
                  href="/director/client/123"
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between opacity-90 hover:opacity-100 hover:shadow-md hover:border-swift-blue/30 hover:-translate-y-0.5 transition-all group block cursor-pointer"
                >
                  <div>
                    <h5 className="font-bold text-sm text-brand-dark group-hover:text-swift-blue transition-colors">{note.clientName}</h5>
                    <p className="text-xs text-slate-500 font-medium">{new Date(note.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <svg className="w-3.5 h-3.5 text-swift-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}