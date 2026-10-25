import React, { useState, useEffect } from 'react';
import { 
  ScanSearch, 
  Bot, 
  LayoutDashboard, 
  Crown, 
  Building2, 
  Palette, 
  Globe, 
  FileCheck, 
  ArrowRight 
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { Contact } from './components/Contact';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { AuditDashboard } from './components/AuditDashboard';
import { Bookkeeping } from './components/Bookkeeping';
import { FirmBrandingSettings } from './components/FirmBrandingSettings';
import { StaffManagement } from './components/StaffManagement';
import { ClientManagement } from './components/ClientManagement';
import { FreemiusCheckoutModal } from './components/FreemiusCheckoutModal';
import { LegalModal, LegalPolicyTab } from './components/LegalModal';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { AuditTrail } from './components/AuditTrail';
import AuditScanner from './components/AuditScanner';
import { DrAriaChatPopup } from './components/DrAriaChatPopup';
import { FinancialTools } from './components/FinancialTools';
import { TrialExpiredModal } from './components/TrialExpiredModal';
import { PopiaConsentBanner } from './components/PopiaConsentBanner';
import { PayrollAudit } from './components/PayrollAudit';
import { VATAudit } from './components/VATAudit';
import { isUserPro } from './lib/authUtils';
import { useTrial } from './lib/trialManager';

export default function App() {
  const { isTrialExpired, remainingFormatted } = useTrial();
  const [currentView, setCurrentView] = useState<'landing' | 'auditor' | 'auth' | 'dashboard' | 'bookkeeping' | 'whitelabel' | 'staff' | 'clients' | 'forms' | 'contacts' | 'tasks' | 'audittrail' | 'currency' | 'payroll' | 'vat'>('landing');
  const [isPro, setIsPro] = useState(isUserPro());
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

    const checkPro = () => setIsPro(isUserPro());
    checkPro();

    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('open-freemius-checkout', handleOpenFreemiusCheckout);
    window.addEventListener('open-stripe-checkout', handleOpenFreemiusCheckout);
    window.addEventListener('open-legal-modal', handleOpenLegal);
    window.addEventListener('pro-status-changed', checkPro);
    window.addEventListener('admin-auth-changed', checkPro);
    window.addEventListener('storage', checkPro);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('open-freemius-checkout', handleOpenFreemiusCheckout);
      window.removeEventListener('open-stripe-checkout', handleOpenFreemiusCheckout);
      window.removeEventListener('open-legal-modal', handleOpenLegal);
      window.removeEventListener('pro-status-changed', checkPro);
      window.removeEventListener('admin-auth-changed', checkPro);
      window.removeEventListener('storage', checkPro);
    };
  }, []);

  const openLegalTab = (tab: LegalPolicyTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <div className={`min-h-screen bg-[#F8F9FC] font-sans text-[#1E293B] flex flex-col ${currentView === 'chat' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : ''}`}>
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

      <SessionTimeoutModal />
      <TrialExpiredModal />
      <PopiaConsentBanner />
      <DrAriaChatPopup />

      {/* Trial Expired Warning Banner */}
      {isTrialExpired && !isPro && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white px-4 py-2.5 text-center font-bold text-xs sm:text-sm flex flex-wrap items-center justify-center gap-3 shadow-md relative z-40">
          <span className="flex items-center gap-1.5">
            <span>⏳</span>
            <span>Your 7-day free trial has concluded. Document audits require an active subscription.</span>
          </span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-trial-expired-modal'))}
            className="bg-white text-rose-700 hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-black shadow-xs transition-colors cursor-pointer"
          >
            Upgrade to Pro Plan
          </button>
        </div>
      )}

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
            <div className="bg-[#1E293B] rounded-3xl p-8 md:p-16 text-center text-white shadow-2xl mb-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ScanSearch className="w-48 h-48" />
              </div>
              <div className="max-w-3xl mx-auto relative z-10">
                <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Advanced Forensic Document Auditing</h1>
                <p className="text-slate-300 text-lg md:text-xl mb-10">
                  Scan invoices, contracts, and receipts instantly. Detect fraud, missing tax IDs, and anomalies with PhD-level AI forensic analysis.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => {
                      document.getElementById('document-auditor')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/20 w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ScanSearch className="w-5 h-5" />
                    <span>Scan Document Now</span>
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentView('whitelabel');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-7 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-amber-500/25 w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 border border-amber-400/40"
                    title="Configure White Label Branding, Firm Logo, and Client Portals"
                  >
                    <Crown className="w-5 h-5 text-amber-200" />
                    <span>Business White Label</span>
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentView('dashboard');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all border border-white/20 w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-5 h-5 text-purple-300" />
                    <span>Audit Dashboard</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (isTrialExpired && !isPro) {
                        window.dispatchEvent(new CustomEvent('open-trial-expired-modal'));
                      } else {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`${
                      isTrialExpired && !isPro
                        ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-400/40'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    } px-7 py-4 rounded-xl font-bold text-lg transition-all w-full sm:w-auto cursor-pointer`}
                  >
                    {isTrialExpired && !isPro ? '7-Day Trial Expired' : 'Start 7-Day Free Trial'}
                  </button>
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-slate-300 hover:text-white px-4 py-4 font-bold text-base transition-colors cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              </div>
            </div>

            {/* Live Interactive AI Forensic Document Auditor */}
            <div id="document-auditor" className="mb-14 scroll-mt-24 max-w-7xl mx-auto">
              <AuditScanner />
            </div>

            {/* Business White Label & Client Portals Showcase Banner */}
            <div id="whitelabel-showcase" className="mb-14 max-w-7xl mx-auto scroll-mt-24">
              <div className="bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-amber-500/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black tracking-wider uppercase">
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      White Label Option for Businesses &amp; Accounting Firms
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Included with Business Plan ($59/mo) &bull; Live Interactive Studio
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-4">
                      <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                        Brand This Entire Platform As Your Own Firm
                      </h2>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Eliminate third-party branding. Deliver forensic document audits, invoice fraud reports, and client portals completely branded with your company's logo, colors, custom domain, and letterhead.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <Palette className="w-4 h-4 text-amber-400" />
                            <span>Custom Logo &amp; Palettes</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Upload your firm's SVG/PNG logo and choose from 5 preset corporate themes or custom hex codes.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <Globe className="w-4 h-4 text-amber-400" />
                            <span>Custom Subdomain &amp; CNAME</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Map your audits to your firm's domain (e.g. <code>audit.yourfirm.co.za</code> or <code>portal.yourfirm.com</code>).
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <FileCheck className="w-4 h-4 text-amber-400" />
                            <span>Unbranded PDF Certificates</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Export court-admissible forensic certificates with your firm letterhead and cryptographic SHA-256 seal.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <Building2 className="w-4 h-4 text-amber-400" />
                            <span>Client Portals &amp; Staff Roles</span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Invite staff auditors and give clients isolated access to their historical audit ledgers.
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => {
                            setCurrentView('whitelabel');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-sm shadow-xl transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                        >
                          <Crown className="w-4 h-4 text-slate-950" />
                          <span>Open White Label Studio</span>
                          <ArrowRight className="w-4 h-4 text-slate-950" />
                        </button>

                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
                          }}
                          className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm border border-white/20 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span>Get Business Plan ($59/mo)</span>
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <div className="bg-slate-950/80 rounded-2xl p-5 border border-amber-500/20 shadow-xl space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                              WL
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">Interactive Firm Preview</div>
                              <div className="text-[10px] text-amber-400 font-mono">audit.yourfirm.co.za</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                            Live Sandbox
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                            <div className="text-[11px] text-slate-400">Firm Display Name</div>
                            <div className="text-white font-bold mt-0.5">Apex Forensic Accounting &amp; Advisory LLP</div>
                          </div>
                          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="text-[11px] text-slate-400">PDF Report Header</div>
                              <div className="text-white font-semibold mt-0.5">Certified Forensic Audit Examination</div>
                            </div>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">No FDA Badge</span>
                          </div>
                          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="text-[11px] text-slate-400">Client Portal Status</div>
                              <div className="text-white font-semibold mt-0.5">Isolated Multi-Tenant Access</div>
                            </div>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">Active</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setCurrentView('whitelabel');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold text-center transition-colors cursor-pointer"
                        >
                          Customize Your Logo &amp; Colors in Studio &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Features />

            {/* Currency Converter & Global Financial Tools Section */}
            <div id="currency-tools" className="mb-14 scroll-mt-24 max-w-7xl mx-auto">
              <FinancialTools />
            </div>

            <Pricing />
            <FAQ />
            <Contact />
          </>
        )}
        {currentView === 'auditor' && (
          <div className="max-w-7xl mx-auto py-4">
            <AuditScanner />
          </div>
        )}
        {currentView === 'auth' && <Auth />}
        {currentView === 'dashboard' && <AuditDashboard />}
        {currentView === 'bookkeeping' && <Bookkeeping />}
        {currentView === 'whitelabel' && <FirmBrandingSettings />}
        {currentView === 'staff' && <StaffManagement />}
        {currentView === 'clients' && <ClientManagement />}
        {currentView === 'audittrail' && (
          <div className="py-4">
            <AuditTrail />
          </div>
        )}
        {currentView === 'currency' && (
          <div className="max-w-7xl mx-auto py-6">
            <FinancialTools />
          </div>
        )}
        {currentView === 'payroll' && <PayrollAudit />}
        {currentView === 'vat' && <VATAudit />}
      </main>
      
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
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B] pt-1">
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  POPIA (Act 4/2013) &bull; Information Regulator IRSA
                </span>
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  LSSA Legal Practice Standards &bull; ECTA § 15
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Freemius Merchant ID: 33243
                </span>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="text-xs font-extrabold text-[#1E293B] uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li>
                  <a 
                    href="#audittrail"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isPro) {
                        const el = document.getElementById('audittrail');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                          return;
                        }
                      }
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'audittrail' } }));
                    }}
                    className="text-left hover:text-[#7C3AED] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <span>Forensic Audit Trail</span>
                    {isPro ? (
                      <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.2 rounded font-bold">SHA-256</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">PRO</span>
                    )}
                  </a>
                </li>
                <li>
                  <a href="#bookkeeping" className="hover:text-[#7C3AED] transition-colors">Ledger & Bookkeeping</a>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setCurrentView('whitelabel');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#7C3AED] transition-colors cursor-pointer text-left flex items-center gap-1.5 font-bold text-amber-900"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Business White Label &amp; Branding</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">PRO</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'payroll' } }))}
                    className="hover:text-[#7C3AED] transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Payroll & Compensation Audit</span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.2 rounded font-bold">PRO</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'vat' } }))}
                    className="hover:text-[#7C3AED] transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>VAT & Sales Tax Reconciliation</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-bold">PRO</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'pricing' } }));
                      window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
                    }}
                    className="hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
                  >
                    Subscription Pricing & Plans
                  </button>
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
                Compliance &amp; Legal
              </h4>
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li>
                  <button 
                    onClick={() => openLegalTab('popia')}
                    className="text-left hover:text-[#7C3AED] transition-colors font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🇿🇦 POPIA (Act 4/2013) &amp; PAIA</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-extrabold">IRSA</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openLegalTab('lssa')}
                    className="text-left hover:text-[#7C3AED] transition-colors font-bold text-indigo-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>⚖️ LSSA Legal Practice Standards</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded font-extrabold">ECTA §15</span>
                  </button>
                </li>
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
              &copy; {new Date().getFullYear()} FORENSICDOCAUDIT. Compliant with POPIA (Act 4 of 2013) &amp; LSSA Practice Guidelines.
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => openLegalTab('popia')} className="hover:text-[#1E293B] underline cursor-pointer font-bold text-amber-900">
                POPIA Compliance
              </button>
              <button onClick={() => openLegalTab('lssa')} className="hover:text-[#1E293B] underline cursor-pointer font-bold text-indigo-900">
                LSSA Standards
              </button>
              <button onClick={() => openLegalTab('terms')} className="hover:text-[#1E293B] underline cursor-pointer">
                Terms
              </button>
              <button onClick={() => openLegalTab('refund')} className="hover:text-[#1E293B] underline cursor-pointer">
                Refund Policy
              </button>
              <button onClick={() => openLegalTab('privacy')} className="hover:text-[#1E293B] underline cursor-pointer">
                Privacy
              </button>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="hover:text-[#1E293B] cursor-pointer opacity-30 hover:opacity-100 transition-opacity text-[11px]"
                title="Firm & Staff Portal"
              >
                Portal
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

