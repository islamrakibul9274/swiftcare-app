"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IClaim {
  _id: string;
  clientName: string;
  dateOfService: string;
  amount: number;
  status: "Pending Submission" | "Submitted" | "Paid" | "Denied";
  billingCode: string;
}

export default function AdminPortal() {
  const [claims, setClaims] = useState<IClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const res = await fetch('/api/claims');
        if (res.ok) {
          const data = await res.json();
          setClaims(data.claims);
        }
      } catch (error) {
        console.error("Failed to load claims", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancials();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <svg className="w-10 h-10 text-brand-indigo animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-bold text-slate-500 tracking-wide uppercase text-sm">Loading Financial Engine...</p>
      </div>
    );
  }

  // --- Calculate Real Metrics ---
  const pendingClaims = claims.filter(c => c.status === "Pending Submission" || c.status === "Submitted");
  const deniedClaims = claims.filter(c => c.status === "Denied");
  
  const pendingValue = pendingClaims.reduce((sum, claim) => sum + claim.amount, 0);
  const totalPipelineValue = claims.reduce((sum, claim) => sum + claim.amount, 0);

  // --- Build Chart Data ---
  const groupedByDate = claims.reduce((acc: any, claim) => {
    const date = new Date(claim.dateOfService).toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = 0;
    acc[date] += claim.amount;
    return acc;
  }, {});

  const chartData = Object.keys(groupedByDate).reverse().map(date => ({
    date,
    Revenue: groupedByDate[date]
  }));

  // Helper for dynamic status badges
  const getStatusStyles = (status: string) => {
    switch(status) {
      case "Paid": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Denied": return "bg-red-50 text-red-600 border-red-100";
      case "Submitted": return "bg-blue-50 text-blue-600 border-blue-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      
      {/* Top Financial & Operational Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-swift-green relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-green-50 opacity-60 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pipeline Volume</p>
            <p className="text-3xl font-black text-brand-dark">${totalPipelineValue.toLocaleString()}</p>
            <p className="text-xs text-swift-green mt-2 font-bold flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              Lifetime generated
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-amber-400 relative overflow-hidden group hover:-translate-y-1 transition-transform">
           <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-50 opacity-60 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Claims Pending</p>
            <p className="text-3xl font-black text-brand-dark">{pendingClaims.length}</p>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Est. value: <span className="text-slate-700 font-bold">${pendingValue.toLocaleString()}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-red-400 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-red-50 opacity-60 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Denied Claims</p>
            <p className="text-3xl font-black text-brand-dark">{deniedClaims.length}</p>
            <p className={`text-xs mt-2 font-bold flex items-center ${deniedClaims.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
               {deniedClaims.length > 0 ? (
                 <><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Action required</>
               ) : (
                 <><svg className="w-3 h-3 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> All clear!</>
               )}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-swift-blue relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-50 opacity-60 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Staff</p>
            <p className="text-3xl font-black text-brand-dark">12</p>
            <p className="text-xs text-slate-400 mt-2 font-semibold">Systems operational</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-brand-dark tracking-tight">Revenue Generation</h3>
              <p className="text-sm text-slate-500 font-medium">Value of claims generated over time</p>
            </div>
            <button className="text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-5 py-2.5 rounded-xl transition-all flex items-center active:scale-[0.98]">
              <svg className="w-4 h-4 mr-2 text-swift-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export CSV
            </button>
          </div>

          <div className="flex-1 min-h-[350px] w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h4 className="text-lg font-bold text-brand-dark mb-1">No Revenue Data</h4>
                <p className="text-slate-500 font-medium text-sm text-center max-w-sm">Approved claims will appear here automatically.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeWidth={2} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    tickMargin={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      backdropFilter: 'blur(8px)',
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '12px 16px',
                      fontWeight: 'bold',
                      color: '#0f172a'
                    }}
                    itemStyle={{ fontWeight: 600, padding: '4px 0', color: '#4f46e5' }}
                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: Claim Ledger */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-[500px] flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-brand-dark flex items-center">
              <svg className="w-5 h-5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              Recent Claims
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{claims.length} Total</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {claims.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-slate-400 italic font-medium">No claims generated yet.</p>
              </div>
            ) : (
              claims.map(claim => (
                <div key={claim._id} className="p-4 bg-white border-2 border-slate-100 hover:border-swift-blue/30 rounded-xl transition-all group cursor-pointer shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-brand-dark group-hover:text-swift-blue transition-colors">{claim.clientName}</p>
                    <p className="text-sm font-black text-emerald-600">${claim.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-bold text-slate-400 font-mono">CPT: {claim.billingCode}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${getStatusStyles(claim.status)}`}>
                      {claim.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Subtle bottom fade to indicate scrolling */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-3xl"></div>
        </div>

      </div>
    </div>
  );
}