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

export default function NoteApprovalsPage() {
  const [notes, setNotes] = useState<INote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
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
    fetchNotes();
  }, []);

  const handleApprove = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'PATCH' });
      if (res.ok) {
        setNotes(prev => prev.map(note => 
          note._id === noteId ? { ...note, status: "Approved" } : note
        ));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredNotes = notes.filter(note => 
    filter === "All" ? true : note.status === filter
  );

  if (isLoading) return <div className="p-8 font-bold text-slate-500">Loading Clinical Ledger...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark">Clinical Notes Ledger</h1>
          <p className="text-slate-500 font-medium">Review, approve, and audit all RBT session documentation.</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["All", "Pending Review", "Approved"].map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                filter === status ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Therapist (RBT)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No notes found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => (
                  <tr key={note._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(note.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-brand-dark">
                      <Link href="/director/client/123" className="hover:text-swift-blue transition-colors">
                        {note.clientName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{note.rbtName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        note.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {note.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {note.status === "Pending Review" ? (
                        <button 
                          onClick={() => handleApprove(note._id)}
                          className="text-white bg-swift-green hover:bg-green-600 px-4 py-1.5 rounded-lg font-bold shadow-sm transition-colors"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium px-4 py-1.5">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}