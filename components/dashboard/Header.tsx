"use client";

import React, { useTransition } from 'react';
import { logoutAction } from '@/app/actions/auth';

interface HeaderProps {
  userName: string;
  role: string;
}

const Header = ({ userName, role }: HeaderProps) => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      logoutAction();
    });
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm sticky top-0 z-40">
      
      {/* Left side: Mobile Menu Toggle (Visible only on mobile) & Title */}
      <div className="flex items-center space-x-4">
        {/* Placeholder for a mobile hamburger menu button if you implement a sliding drawer later */}
        <button className="md:hidden p-2 text-slate-500 hover:text-brand-dark transition-colors rounded-lg hover:bg-slate-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-xl font-black text-brand-dark hidden sm:block">Dashboard</h2>
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        
        {/* Notification Bell */}
        <button className="relative p-2 text-slate-400 hover:text-swift-blue transition-colors rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-swift-blue/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Animated red dot indicator */}
          <span className="absolute top-1.5 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center space-x-3 md:border-l md:border-slate-200 md:pl-6">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-bold text-brand-dark leading-tight">{userName}</span>
            <span className="text-[11px] font-black tracking-wider uppercase text-swift-blue">{role}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-indigo to-swift-blue text-white flex items-center justify-center font-bold shadow-sm uppercase ring-2 ring-white hover:ring-blue-100 transition-all cursor-default">
            {userName.charAt(0)}
          </div>
        </div>

        {/* Sign Out Button */}
        <button 
          onClick={handleLogout}
          disabled={isPending}
          className="group cursor-pointer flex items-center justify-center h-10 w-10 md:w-auto md:px-4 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Sign Out"
        >
          {isPending ? (
            <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <span className="hidden md:block mr-2">Sign Out</span>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </>
          )}
        </button>

      </div>
    </header>
  );
};

export default Header;