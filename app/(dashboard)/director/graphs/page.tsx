"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BehaviourGraphsPage() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const res = await fetch('/api/notes');
        if (res.ok) {
          const data = await res.json();
          
          // Aggregate behaviors across ALL clients by Date
          const aggregated = data.notes
            .filter((n: any) => n.status === "Approved" && n.behaviors)
            .reduce((acc: any, note: any) => {
              const date = new Date(note.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
              if (!acc[date]) acc[date] = { date, 'Decrease Behaviors': 0, 'Increase Behaviors': 0 };
              
              note.behaviors.forEach((b: any) => {
                if (b.type === 'decrease') acc[date]['Decrease Behaviors'] += b.count;
                if (b.type === 'increase') acc[date]['Increase Behaviors'] += b.count;
              });
              return acc;
            }, {});

          // Convert to array and take the last 7 days
          const finalData = Object.values(aggregated).reverse().slice(-7);
          setChartData(finalData);
        }
      } catch (error) {
        console.error("Failed to load chart data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClinicData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <svg className="w-10 h-10 text-brand-indigo animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-bold text-slate-500 tracking-wide uppercase text-sm">Loading Clinic Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark tracking-tight">Clinic Analytics</h1>
          <p className="text-slate-500 font-medium mt-1">Macro-level behavioral trends across all active clients.</p>
        </div>
        <button className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-brand-dark transition-all flex items-center justify-center active:scale-[0.98]">
          <svg className="w-5 h-5 mr-2 text-swift-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Export Report
        </button>
      </div>

      {/* Main Clinic Chart */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-brand-dark mb-1">Clinic-Wide Interventions</h3>
            <p className="text-sm text-slate-500 font-medium">Trailing 7 days of approved clinical session data</p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button className="px-3 py-1.5 text-xs font-bold bg-white text-brand-dark rounded-md shadow-sm">7 Days</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">30 Days</button>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <h4 className="text-lg font-bold text-brand-dark mb-1">No Clinic Data</h4>
              <p className="text-slate-500 font-medium text-sm text-center max-w-sm">No behavior data has been approved yet. Analytics will aggregate here automatically.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeWidth={2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} 
                  tickLine={false} 
                  tickMargin={12}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={12}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
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
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }} 
                  iconType="circle" 
                  iconSize={10} 
                />
                <Bar dataKey="Decrease Behaviors" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={45} />
                <Bar dataKey="Increase Behaviors" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Client Directory Quick Links */}
      <div>
        <div className="flex items-center mb-5">
          <svg className="w-6 h-6 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <h3 className="text-xl font-black text-brand-dark">Caseload Directory</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Active Client Card */}
          <Link href="/director/client/123" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-swift-blue/40 transition-all group flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-indigo to-swift-blue text-white flex items-center justify-center font-black text-lg shadow-inner ring-2 ring-white">
                LM
              </div>
              <div>
                <p className="font-black text-brand-dark group-hover:text-swift-blue transition-colors text-lg">Leo M.</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">12 Active Goals</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors border border-slate-100 group-hover:border-blue-100">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-swift-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </Link>
          
          {/* Empty Add Client Card */}
          <button className="bg-slate-50/50 p-5 rounded-2xl border-2 border-slate-200 border-dashed flex flex-col items-center justify-center hover:bg-slate-50 hover:border-swift-blue/40 transition-all group h-full min-h-[90px]">
            <div className="flex items-center text-slate-400 group-hover:text-swift-blue transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
              <span className="text-sm font-bold tracking-wide">Add New Patient</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}