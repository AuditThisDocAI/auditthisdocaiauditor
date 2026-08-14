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
import { Bookkeeping } from './components/Bookkeeping';
import { FirmBrandingSettings } from './components/FirmBrandingSettings';
import { StaffManagement } from './components/StaffManagement';
import { ClientManagement } from './components/ClientManagement';
import { FreemiusCheckoutModal } from './components/FreemiusCheckoutModal';
import { LegalModal, LegalPolicyTab } from './components/LegalModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'bookkeeping' | 'whitelabel' | 'staff' | 'clients'>('landing');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [freemiusCheckoutOpen, setFreemiusCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro_monthly' | 'pro_yearly'>('pro_monthly');
  const [checkoutInterval, setCheckoutInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalPolicyTab>('terms');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      localStorage.setItem('audit_this_doc_is_pro', 'true');
      localStorage.setItem('audit_this_doc_free_count', '0');
      setShowPaymentSuccess(true);
      window.dispatchEvent(new Event('pro-status-changed'));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('freemius_checkout') === 'true' || urlParams.get('stripe_checkout') === 'true') {
      const plan = urlParams.get('plan') === 'pro_yearly' ? 'pro_yearly' : 'pro_monthly';
      const interval = urlParams.get('interval') === 'yearly' ? 'yearly' : 'monthly';
      setCheckoutPlan(plan);
      setCheckoutInterval(interval);
      setFreemiusCheckoutOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ view: any; plan?: any; interval?: any }>;
      if (customEvent.detail && customEvent.detail.view === 'pricing') {
        setCurrentView('landing');
        setTimeout(() => {
          const pricingEl = document.getElementById('pricing');
          if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (customEvent.detail && customEvent.detail.view) {
        setCurrentView(customEvent.detail.view);
        window.scrollTo(0, 0);
      }
    };
    const handleOpenFreemiusCheckout = (e: Event) => {
      const customEvent = e as CustomEvent<{ plan?: any; interval?: any }>;
      if (customEvent.detail) {
        setCheckoutPlan(customEvent.detail.plan === 'pro_yearly' ? 'pro_yearly' : 'pro_monthly');
        setCheckoutInterval(customEvent.detail.interval === 'yearly' ? 'yearly' : 'monthly');
      }
      setFreemiusCheckoutOpen(true);
    };

    const handleOpenLegal = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: LegalPolicyTab }>;
      if (customEvent.detail && customEvent.detail.tab) {
        setLegalModalTab(customEvent.detail.tab);
      } else {
        setLegalModalTab('terms');
      }
      setLegalModalOpen(true);
    };

    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('open-freemius-checkout', handleOpenFreemiusCheckout);
    window.addEventListener('open-stripe-checkout', handleOpenFreemiusCheckout);
    window.addEventListener('open-legal-modal', handleOpenLegal);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('open-freemius-checkout', handleOpenFreemiusCheckout);
      window.removeEventListener('open-stripe-checkout', handleOpenFreemiusCheckout);
      window.removeEventListener('open-legal-modal', handleOpenLegal);
    };
  }, []);

  const openLegalTab = (tab: LegalPolicyTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-[#1E293B]">
      <Navbar />

      <FreemiusCheckoutModal
        isOpen={freemiusCheckoutOpen}
        onClose={() => setFreemiusCheckoutOpen(false)}
        plan={checkoutPlan}
        interval={checkoutInterval}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {showPaymentSuccess && (
        <div className="bg-[#10B981] text-white px-4 py-3 text-center font-bold text-sm flex items-center justify-center gap-3 shadow-md relative z-50">
          <span>🎉 Payment Successful! Pro Plan activated with 1,000 monthly document audits.</span>
          <button 
            onClick={() => setShowPaymentSuccess(false)}
            className="ml-2 bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="py-6 px-4 lg:px-8">
        {currentView === 'landing' && (
          <>
            <Hero />
            <TrustedBy />
            <DocumentAuditor />
            <Bookkeeping />
            <Features />
            <Pricing />
            <FAQ />
            <Contact />
          </>
        )}
        {currentView === 'auth' && <Auth />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'bookkeeping' && <Bookkeeping />}
        {currentView === 'whitelabel' && <FirmBrandingSettings />}
        {currentView === 'staff' && <StaffManagement />}
        {currentView === 'clients' && <ClientManagement />}
      </main>
      
      {/* Footer */}
      <footer className="bg-white text-[#1E293B] pt-12 pb-8 border-t border-[#E2E8F0]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-bold">
                  F
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-[#1E293B]">
                    FORENSICDOC<span className="text-[#7C3AED]">AUDIT</span>
                  </span>
                  <span className="text-[10px] text-[#64748B] tracking-widest font-semibold uppercase">
                    Accounting & AI Forensic Engine
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-md">
                AI-powered document fraud detection, automated financial discrepancy auditing, and white-label client portal for modern accounting firms.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] pt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Authorized Freemius Merchant &bull; Product ID: 33243</span>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="text-xs font-extrabold text-[#1E293B] uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li>
                  <a href="#document-auditor" className="hover:text-[#7C3AED] transition-colors">Dr. Aria Forensic Scanner</a>
                </li>
                <li>
                  <a href="#bookkeeping" className="hover:text-[#7C3AED] transition-colors">Ledger & Bookkeeping</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[#7C3AED] transition-colors">Subscription Pricing</a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#7C3AED] transition-colors">Frequently Asked Questions</a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-[#7C3AED] transition-colors">Contact & Support</a>
                </li>
              </ul>
            </div>

            {/* Legal & Policies column */}
            <div>
              <h4 className="text-xs font-extrabold text-[#1E293B] uppercase tracking-wider mb-3">
                Legal & Policies
              </h4>
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li>
                  <button 
                    onClick={() => openLegalTab('terms')}
                    className="text-left hover:text-[#7C3AED] transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Terms & Conditions (T&Cs)</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openLegalTab('refund')}
                    className="text-left hover:text-[#10B981] transition-colors font-semibold text-emerald-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>14-Day Refund Policy</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">Guarantee</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openLegalTab('privacy')}
                    className="text-left hover:text-[#7C3AED] transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Privacy & Data Security</span>
                  </button>
                </li>
                <li>
                  <a 
                    href="https://freemius.com/terms/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#7C3AED] transition-colors inline-block"
                  >
                    Freemius Merchant Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E2E8F0] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#64748B]">
            <div>
              &copy; {new Date().getFullYear()} FORENSICDOCAUDIT. All rights reserved. Subscriptions powered by Freemius (Product 33243).
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => openLegalTab('terms')} className="hover:text-[#1E293B] underline cursor-pointer">
                Terms of Service
              </button>
              <button onClick={() => openLegalTab('refund')} className="hover:text-[#1E293B] underline cursor-pointer">
                Refund Policy
              </button>
              <button onClick={() => openLegalTab('privacy')} className="hover:text-[#1E293B] underline cursor-pointer">
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

