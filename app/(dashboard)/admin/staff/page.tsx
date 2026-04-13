"use client";

import React from 'react';

// Mock data for the UI
const mockStaff = [
  { id: 1, name: "Dr. Sarah Jenkins", role: "BCBA", status: "Active", clients: 12, email: "sarah.j@swiftcare.com" },
  { id: 2, name: "Marcus Thorne", role: "RBT", status: "Active", clients: 4, email: "marcus.t@swiftcare.com" },
  { id: 3, name: "Elena Rodriguez", role: "BCBA", status: "On Leave", clients: 0, email: "elena.r@swiftcare.com" },
  { id: 4, name: "David Kim", role: "RBT", status: "Active", clients: 5, email: "david.k@swiftcare.com" },
  { id: 5, name: "Jessica Alba", role: "ADMIN", status: "Active", clients: 0, email: "jessica.a@swiftcare.com" },
];

export default function StaffPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark">Staff Management</h1>
          <p className="text-slate-500 font-medium">Manage credentials, roles, and clinic access.</p>
        </div>
        <button className="px-6 py-2.5 bg-brand-dark text-white font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Invite Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockStaff.map((staff) => (
          <div key={staff.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-lg">
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-lg">{staff.name}</h3>
                  <p className="text-xs text-slate-500">{staff.email}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${
                staff.role === 'BCBA' ? 'bg-indigo-50 text-indigo-600' : 
                staff.role === 'ADMIN' ? 'bg-amber-50 text-amber-600' : 
                'bg-blue-50 text-blue-600'
              }`}>
                {staff.role}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-100 mb-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Status</p>
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2 h-2 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                  <span className="font-medium text-slate-700 text-sm">{staff.status}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Assigned Clients</p>
                <span className="font-medium text-slate-700 text-sm">{staff.clients > 0 ? staff.clients : '--'}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
                Edit Profile
              </button>
              <button className="py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}