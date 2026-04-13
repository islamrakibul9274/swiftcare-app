"use client";

import React, { useState, useEffect } from 'react';

interface IClaim {
  _id: string;
  clientName: string;
  dateOfService: string;
  amount: number;
  status: "Pending Submission" | "Submitted" | "Paid" | "Denied";
  billingCode: string;
}

export default function BillingPage() {
  const [claims, setClaims] = useState<IClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
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
    fetchClaims();
  }, []);

  // Helper for status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Denied": return "bg-red-100 text-red-700 border-red-200";
      case "Submitted": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  if (isLoading) return <div className="p-8 font-bold text-slate-500">Loading Billing Ledger...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark">Billing & Claims</h1>
          <p className="text-slate-500 font-medium">Manage the clinic's revenue cycle and insurance submissions.</p>
        </div>
        <button className="px-6 py-2.5 bg-brand-indigo text-white font-bold rounded-lg shadow-sm hover:bg-brand-indigo-hover transition-colors">
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date of Service</th>
                <th className="px-6 py-4">Billing Code</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No billing claims found.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-brand-dark">{claim.clientName}</td>
                    <td className="px-6 py-4">{new Date(claim.dateOfService).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{claim.billingCode}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">${claim.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-swift-blue font-bold hover:text-blue-800 transition-colors">
                        View
                      </button>
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