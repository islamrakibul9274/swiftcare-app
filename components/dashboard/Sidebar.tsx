"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../Logo';

interface SidebarProps {
  role: string;
}

const Sidebar = ({ role }: SidebarProps) => {
  const pathname = usePathname();

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Overview', href: '/admin', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { name: 'Billing & Claims', href: '/admin/billing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { name: 'Staff Management', href: '/admin/staff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        ];
      case 'BCBA':
        return [
          { name: 'My Caseload', href: '/director', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { name: 'Behavior Graphs', href: '/director/graphs', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
          { name: 'Note Approvals', href: '/director/notes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        ];
      case 'RBT':
        return [
          { name: 'Today\'s Sessions', href: '/tech', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { name: 'Drafted Notes', href: '/tech/notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0B1121] text-slate-300 transition-all duration-300 border-r border-slate-800/50 shadow-xl z-20">
      
      {/* Brand Header */}
      <Link href="/" className="h-20 flex items-center px-6 border-b border-slate-800/80 hover:bg-white/5 transition-colors group">
        <Logo className="w-8 h-8 mr-3 text-white" />
        <div className="flex flex-col justify-center">
          <span className="text-xl font-black text-white tracking-tight lowercase leading-none">swift</span>
          <span className="text-[0.55rem] font-bold text-slate-400 tracking-[0.3em] uppercase mt-0.5">Care</span>
        </div>
      </Link>

      <div className="flex-1 py-8 px-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          {role} Portal
        </p>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {links.map((link) => {
            // Check if exact match OR starts with path (for nested sub-pages)
            const isActive = pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== '/admin');
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-swift-blue/15 text-swift-blue border border-swift-blue/20 shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
                }`}
              >
                <svg 
                  className={`w-5 h-5 mr-3 shrink-0 transition-colors ${isActive ? 'text-swift-blue' : 'text-slate-500 group-hover:text-white'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? "2.5" : "2"} d={link.icon} />
                </svg>
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Escape Hatch */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <Link
          href="/"
          className="flex items-center px-3 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group"
        >
          <svg className="w-5 h-5 mr-3 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Website
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;