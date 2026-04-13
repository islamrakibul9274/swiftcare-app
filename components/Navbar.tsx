"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import Logo from './Logo';

const Navbar = () => {
  // Use the hook to listen to the live authentication status
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        isScrolled ? 'shadow-sm py-4' : 'py-6'
      }`}
    >
      <div className="max-w-[1140px] mx-auto px-8 flex items-center justify-between">
        
        {/* Left: Brand Logo & Stacked Name */}
        <Link href="/" className="flex items-center space-x-4 cursor-pointer">
          <Logo className="w-12 h-12" />
          <div className="flex flex-col justify-center">
            <span className="text-4xl font-black text-brand-dark leading-none lowercase tracking-tight">
              swift
            </span>
            <span className="text-[0.65rem] font-semibold text-slate-500 tracking-[0.4em] uppercase mt-1 pl-0.5">
              C a r e
            </span>
          </div>
        </Link>

        {/* Right side container for Links + CTA */}
        <div className="hidden lg:flex items-center space-x-10 text-[16px] font-medium text-brand-dark">
          
          <div className="flex items-center cursor-pointer hover:text-swift-blue transition group">
            About Us
            <svg className="w-4 h-4 ml-1.5 text-slate-800 group-hover:text-swift-blue mt-0.5 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
          
          {/* Features Dropdown */}
          <div className="relative group py-2">
            <div className="flex items-center cursor-pointer hover:text-swift-blue transition">
              Features
              <svg className="w-4 h-4 ml-1.5 text-slate-800 group-hover:text-swift-blue mt-0.5 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            
            <div className="absolute top-full left-0 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-64">
              <div className="bg-white shadow-xl border-t-[3px] border-swift-blue rounded-b-lg flex flex-col py-4">
                {[
                  "Data Collection", "Scheduling", "Practice Management", 
                  "Managed Billing Services", "Self-Billing", "AI Capabilities", "Credentialing"
                ].map((item, index) => (
                  <Link 
                    key={index} 
                    href={`/#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                    className="px-6 py-3 text-[15px] text-slate-700 hover:text-swift-blue hover:bg-slate-50 transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <Link href="/#pricing" className="cursor-pointer hover:text-swift-blue transition">Pricing</Link>
          
          <div className="flex items-center cursor-pointer hover:text-swift-blue transition group">
            Resources
            <svg className="w-4 h-4 ml-1.5 text-slate-800 group-hover:text-swift-blue mt-0.5 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>

          {/* Dynamic Auth & CTA Links */}
          {isLoggedIn ? (
            <div className="flex items-center space-x-6">
              {/* Pointing to /login triggers the Middleware's role-based redirect */}
              <Link href="/login" className="cursor-pointer font-bold text-swift-blue hover:text-blue-700 transition">
                Dashboard
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-7 rounded-md transition-colors shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <Link href="/login" className="cursor-pointer hover:text-swift-blue transition">
                Sign In
              </Link>
              <Link href="/register" className="bg-brand-indigo hover:bg-brand-indigo-hover text-white font-medium py-3 px-7 rounded-md transition-colors shadow-sm">
                Schedule a Demo
              </Link>
            </div>
          )}
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;