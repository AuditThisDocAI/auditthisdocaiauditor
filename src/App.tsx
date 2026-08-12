import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustedBy } from './components/TrustedBy';
import { DocumentAuditor } from './components/DocumentAuditor';
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { Contact } from './components/Contact';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('landing');

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ view: 'landing' | 'auth' | 'dashboard' }>;
      if (customEvent.detail && customEvent.detail.view) {
        setCurrentView(customEvent.detail.view);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-[#1E293B]">
      <Navbar />
      <main>
        {currentView === 'landing' && (
          <>
            <Hero />
            <TrustedBy />
            <DocumentAuditor />
            <Features />
            <Pricing />
            <FAQ />
            <Contact />
          </>
        )}
        {currentView === 'auth' && <Auth />}
        {currentView === 'dashboard' && <Dashboard />}
      </main>
      
      {/* Footer */}
      <footer className="bg-white text-[#1E293B] py-12 border-t border-[#E2E8F0]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#1E293B]">
                Audit This Doc <span className="text-[#7C3AED]">AI</span>
              </span>
            </div>
            <div className="text-[#64748B] text-sm font-medium">
              &copy; {new Date().getFullYear()} Audit This Doc AI. Forensic Document Auditor. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


