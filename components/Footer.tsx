import React from 'react';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="w-full bg-slate-50 pt-20 pb-8 border-t border-slate-200 mt-20">
      <div className="max-w-[1140px] mx-auto px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <div className="flex items-center space-x-3 mb-6">
              <Logo className="w-10 h-10" />
              <span className="text-2xl font-black text-brand-dark tracking-tight lowercase">
                swift<span className="text-swift-blue">care</span>
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xs mb-6">
              SwiftCare is the all-in-one practice management system that's redefining ABA—AI-driven, built for clinicians, and powered for real-time results.
            </p>
            {/* Social Icons Placeholder */}
            <div className="flex space-x-4 text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-swift-blue hover:text-white transition-colors cursor-pointer flex items-center justify-center">In</div>
              <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-swift-blue hover:text-white transition-colors cursor-pointer flex items-center justify-center">X</div>
            </div>
          </div>

          {/* Links Column 1: Pages */}
          <div>
            <h4 className="font-bold text-brand-dark mb-5">Pages</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-swift-blue transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-swift-blue transition-colors">Case Studies</a></li>
              <li><a href="#" className="hover:text-swift-blue transition-colors">Frequently Asked Questions</a></li>
              <li><a href="#" className="hover:text-swift-blue transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Links Column 2: Contact & Legal */}
          <div>
            <h4 className="font-bold text-brand-dark mb-5">Let's Chat</h4>
            <ul className="space-y-3 text-sm text-slate-600 mb-8">
              <li>Sales: <span className="font-medium text-brand-dark">929-955-1323</span></li>
              <li>Support: <span className="font-medium text-brand-dark">845‑581‑2650</span></li>
            </ul>
            <h4 className="font-bold text-brand-dark mb-5">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-swift-blue transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-swift-blue transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-swift-blue transition-colors">BAA (HIPAA)</a></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-1">
            <h4 className="font-bold text-brand-dark mb-5">Newsletter Signup</h4>
            <p className="text-xs text-slate-500 mb-4">
              Subscribe to get the latest insights, trends, and resources delivered to your inbox.
            </p>
            <form className="flex flex-col space-y-3">
              <input 
                type="email" 
                placeholder="Email Address *" 
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-swift-blue focus:ring-1 focus:ring-swift-blue"
              />
              <button 
                type="submit"
                className="w-full bg-brand-dark hover:bg-swift-blue text-white font-medium py-2.5 rounded-md transition-colors text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SwiftCare, Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span>HIPAA Compliant Platform</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;