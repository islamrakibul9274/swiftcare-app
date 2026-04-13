"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface INote {
  _id: string;
  clientName: string;
  duration: string;
  summary: string;
  status: "Pending Review" | "Approved";
  date: string;
}

export default function TechNotesPage() {
  const [notes, setNotes] = useState<INote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyNotes = async () => {
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

    fetchMyNotes();
  }, []);

  if (isLoading) return <div className="p-8 font-bold text-slate-500">Loading your clinical records...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark">My Drafted Notes</h1>
          <p className="text-slate-500 font-medium">History of your submitted AI session summaries.</p>
        </div>
        <Link 
          href="/tech" 
          className="px-6 py-2.5 bg-brand-dark text-white font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors inline-flex items-center justify-center w-fit"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          New Session
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {notes.length === 0 ? (
          <div className="p-16 text-center border-dashed border-2 border-slate-100 m-8 rounded-xl bg-slate-50">
            <p className="text-slate-500 font-medium mb-4">You haven't submitted any session notes yet.</p>
            <Link href="/tech" className="text-swift-blue font-bold hover:underline">
              Start your first session &rarr;
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notes.map((note) => (
              <div key={note._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-brand-dark">{note.clientName}</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Duration: {note.duration} • Submitted: {new Date(note.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border w-fit ${
                    note.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {note.status === 'Approved' ? '✓ Approved' : 'Pending Review'}
                  </span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-100">
                  {note.summary}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}