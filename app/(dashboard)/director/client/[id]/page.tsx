"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ClientProfile() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const res = await fetch('/api/notes');
        if (res.ok) {
          const data = await res.json();
          
          // Filter only APPROVED notes for this specific client
          const approvedNotes = data.notes.filter((n: any) => n.status === "Approved" && n.clientName === "Leo M.");
          
          // Transform the raw database notes into a format Recharts understands
          const formattedData = approvedNotes.reverse().map((note: any) => {
            const dataPoint: any = { 
              date: new Date(note.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) 
            };
            
            if (note.behaviors) {
              note.behaviors.forEach((b: any) => {
                dataPoint[b.name] = b.count;
              });
            }
            return dataPoint;
          });

          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Failed to load chart data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <svg className="w-10 h-10 text-brand-indigo animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-bold text-slate-500 tracking-wide uppercase text-sm">Loading Patient File...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      
      {/* Breadcrumb */}
      <div className="flex items-center text-sm font-bold text-slate-400 mb-2">
        <Link href="/director" className="hover:text-swift-blue transition-colors flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          Caseload Inbox
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-600">Patient Profile</span>
      </div>

      {/* Patient Header Container */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden">
        {/* Decorative Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-swift-blue/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="flex items-center space-x-5 z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-indigo to-swift-blue text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-200/50">
            LM
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-3xl font-black text-brand-dark tracking-tight">Leo M.</h1>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-100">Active</span>
            </div>
            <p className="text-slate-500 font-medium">Early Intervention Program • Dr. Sarah Jenkins (BCBA)</p>
          </div>
        </div>

        <button className="w-full md:w-auto px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-brand-dark transition-all flex items-center justify-center z-10 active:scale-[0.98]">
          <svg className="w-5 h-5 mr-2 text-swift-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          Edit Treatment Plan
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-swift-blue rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date of Birth</p>
            <p className="text-lg font-black text-brand-dark">04/12/2018</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-brand-indigo rounded-xl">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active Goals</p>
            <p className="text-lg font-black text-brand-dark">4 Targets</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sessions Logged</p>
            <p className="text-lg font-black text-brand-dark">{chartData.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Hours</p>
            <p className="text-lg font-black text-brand-dark">{chartData.length * 1.5} hrs</p>
          </div>
        </div>
      </div>

      {/* The Interactive Chart Container */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-brand-dark mb-1">Behavioral Trajectory</h3>
            <p className="text-sm text-slate-500 font-medium">Trailing session data (Approved medical records only)</p>
          </div>
          <select className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-swift-blue/20 focus:border-swift-blue cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>Year to Date</option>
          </select>
        </div>

        {chartData.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            </div>
            <h4 className="text-lg font-bold text-brand-dark mb-1">No Data Available</h4>
            <p className="text-slate-500 font-medium text-sm text-center max-w-sm">There are currently no approved clinical notes for this patient. Chart will populate automatically once RBTs submit data.</p>
          </div>
        ) : (
          <div className="h-[450px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeWidth={2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  tickMargin={12}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px',
                    fontWeight: 'bold',
                    color: '#0f172a'
                  }}
                  itemStyle={{ fontWeight: 600, padding: '4px 0' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '30px' }} 
                  iconType="circle" 
                  iconSize={10} 
                />
                
                {/* Decrease Behaviors (Red/Orange) */}
                <Line type="monotone" dataKey="Tantrums" stroke="#ef4444" strokeWidth={3.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="Elopement" stroke="#f97316" strokeWidth={3.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} />
                
                {/* Increase Behaviors (Green/Blue) */}
                <Line type="monotone" dataKey="Indep. Requests" stroke="#10b981" strokeWidth={3.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                <Line type="monotone" dataKey="Transitions" stroke="#3b82f6" strokeWidth={3.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}