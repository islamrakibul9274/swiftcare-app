"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RBT', 
    clinicName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser page reload!
    
    if (!formData.name || !formData.email || !formData.password || !formData.clinicName) {
      setError("Please fill out all required fields.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const data = await res.json();
        setError(data.message || 'Registration failed.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Name & Clinic Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400 group-focus-within:text-swift-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <input
              name="name" type="text" required
              value={formData.name} onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-swift-blue/10 focus:border-swift-blue transition-all sm:text-sm font-medium"
              placeholder="Jane Doe"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Clinic Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400 group-focus-within:text-swift-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <input
              name="clinicName" type="text" required
              value={formData.clinicName} onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-swift-blue/10 focus:border-swift-blue transition-all sm:text-sm font-medium"
              placeholder="Hope Therapy Center"
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-swift-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <input
            name="email" type="email" required
            value={formData.email} onChange={handleChange}
            className="block w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-swift-blue/10 focus:border-swift-blue transition-all sm:text-sm font-medium"
            placeholder="jane@clinic.com"
          />
        </div>
      </div>

      {/* Password & Role Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400 group-focus-within:text-swift-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <input
              name="password" type="password" required
              value={formData.password} onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-swift-blue/10 focus:border-swift-blue transition-all sm:text-sm font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">System Role</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <svg className="h-5 w-5 text-slate-400 group-focus-within:text-swift-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <select
              name="role"
              value={formData.role} onChange={handleChange}
              className="block w-full pl-11 pr-10 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-swift-blue/10 focus:border-swift-blue transition-all sm:text-sm font-medium appearance-none"
            >
              <option value="RBT">Technician (RBT)</option>
              <option value="BCBA">Clinical Director (BCBA)</option>
              <option value="ADMIN">Clinic Admin</option>
            </select>
            {/* Custom dropdown arrow to replace native appearance */}
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-indigo hover:bg-brand-indigo-hover focus:outline-none focus:ring-4 focus:ring-brand-indigo/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          ) : (
            'Register Securely'
          )}
        </button>
      </div>
    </form>
  );
}