import { useState, useEffect } from 'react';
import { Menu, X, Bot, LogOut, User, Crown, Building2, ShieldCheck, Clock, Hourglass, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getWhiteLabelConfig, WhiteLabelConfig } from '../lib/whitelabel';
import { WhiteLabelModal } from './WhiteLabelModal';
import { CurrencySelector } from './CurrencySelector';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { performLogout } from '../lib/sessionManager';
import { isSuperAdminEmail, getSafeUserDisplayName } from '../lib/authUtils';
import { useTrial } from '../lib/trialManager';

export function Navbar() {
  const { isTrialExpired, isTrialActive, remainingFormatted } = useTrial();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(getWhiteLabelConfig());
  const [showWhiteLabelModal, setShowWhiteLabelModal] = useState(false);

  const checkAuthStatus = () => {
    const authed = localStorage.getItem('audit-this-doc-cms-auth') === 'true' || !!auth.currentUser;
    const email = (localStorage.getItem('audit-this-doc-user-email') || auth.currentUser?.email || '').toLowerCase().trim();
    const isAdmin = isSuperAdminEmail(email);
    const pro = localStorage.getItem('audit_this_doc_is_pro') === 'true' || isAdmin;

    setIsLoggedIn(authed);
    setIsPro(pro);
    setUserEmail(email);
    setWhiteLabelConfig(getWhiteLabelConfig());
  };

  useEffect(() => {
    checkAuthStatus();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || '').toLowerCase().trim();
        const isAdmin = isSuperAdminEmail(email);
        const pro = localStorage.getItem('audit_this_doc_is_pro') === 'true' || isAdmin;
        localStorage.setItem('audit-this-doc-cms-auth', 'true');
        localStorage.setItem('audit-this-doc-user-email', email);
        if (isAdmin) {
          localStorage.setItem('audit_this_doc_is_pro', 'true');
        }
        setIsLoggedIn(true);
        setUserEmail(email);
        setIsPro(pro);
      } else {
        checkAuthStatus();
      }
    });

    const handleNavClose = () => setMobileMenuOpen(false);

    window.addEventListener('admin-auth-changed', checkAuthStatus);
    window.addEventListener('pro-status-changed', checkAuthStatus);
    window.addEventListener('whitelabel-updated', checkAuthStatus);
    window.addEventListener('storage', checkAuthStatus);
    window.addEventListener('navigate', handleNavClose);
    return () => {
      unsubscribe();
      window.removeEventListener('admin-auth-changed', checkAuthStatus);
      window.removeEventListener('pro-status-changed', checkAuthStatus);
      window.removeEventListener('whitelabel-updated', checkAuthStatus);
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('navigate', handleNavClose);
    };
  }, []);

  const handleLogout = async () => {
    await performLogout('User logged out from navigation.');
    setIsLoggedIn(false);
    setIsPro(false);
    setUserEmail('');
  };

  // White label settings are strictly reserved for paid subscribers who have signed up
  const isPaidAndSignedUp = isLoggedIn && isPro;

  const linksToShow = [
    { name: 'Dashboard', href: '#dashboard' },
    { name: 'AI Auditor', href: '#document-auditor' },
    { name: 'Payroll', href: '#payroll', badge: isPro ? undefined : 'PRO' },
    { name: 'VAT & Tax', href: '#vat', badge: isPro ? undefined : 'PRO' },
    { name: 'Currency & Forex', href: '#currency-tools' },
    ...(isPro ? [{ name: 'Audit Trail', href: '#audittrail' }] : []), // Audit Trail - strictly visible to paying subscribers
    { name: 'White Label', href: '#whitelabel', badge: isPro ? undefined : 'PRO' },
    { name: 'Bookkeeping', href: '#bookkeeping' },
    { name: 'Features', href: '#features' },
    ...(isLoggedIn ? [{ name: 'Staff Team', href: '#staff' }, { name: 'Firm Clients', href: '#clients' }] : []),
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-8 py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }))}
              >
                {whiteLabelConfig.enabled && whiteLabelConfig.logoUrl ? (
                  <img src={whiteLabelConfig.logoUrl} alt={whiteLabelConfig.businessName} className="h-9 object-contain" />
                ) : (
                  <div 
                    className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-extrabold shadow-md shadow-purple-500/20"
                    style={{ backgroundColor: whiteLabelConfig.enabled ? whiteLabelConfig.primaryColor : '#7C3AED' }}
                  >
                    {whiteLabelConfig.enabled ? (whiteLabelConfig.businessName || 'F').charAt(0) : <Bot className="w-5 h-5" />}
                  </div>
                )}
                
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg tracking-tight text-[#1E293B] flex items-center gap-1.5">
                    {whiteLabelConfig.enabled && whiteLabelConfig.businessName ? (
                      <span>{whiteLabelConfig.businessName}</span>
                    ) : (
                      <>FORENSICDOC<span className="text-[#7C3AED]">AUDIT</span></>
                    )}
                  </span>
                  {whiteLabelConfig.enabled ? (
                    <span className="text-[10px] text-[#64748B] font-mono tracking-wide flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-purple-600" />
                      White Label Verified Portal
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#64748B] tracking-widest font-semibold uppercase">
                      Accounting System
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop Nav */}
              <ul className="hidden lg:flex gap-6 text-sm font-semibold text-[#64748B]">
                {linksToShow.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        if (link.name === 'Dashboard') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
                        } else if (link.name === 'AI Auditor') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                          setTimeout(() => {
                            document.getElementById('document-auditor')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        } else if (link.name === 'Audit Trail') {
                          const el = document.getElementById('audittrail');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                            setTimeout(() => {
                              document.getElementById('audittrail')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }
                        } else if (link.name === 'Payroll') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'payroll' } }));
                        } else if (link.name === 'VAT & Tax' || link.name === 'VAT') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'vat' } }));
                        } else if (link.name === 'Bookkeeping') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'bookkeeping' } }));
                        } else if (link.name === 'Branding' || link.name === 'White Label') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }));
                        } else if (link.name === 'Staff Team') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'staff' } }));
                        } else if (link.name === 'Currency & Forex' || link.name === 'Currency Tools') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'currency' } }));
                          setTimeout(() => {
                            document.getElementById('currency-tools')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        } else if (link.name === 'Firm Clients') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'clients' } }));
                        } else if (link.name === 'Pricing') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'pricing' } }));
                          window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
                        } else {
                          const targetId = link.href.startsWith('#') ? link.href.substring(1) : null;
                          if (targetId) {
                            const el = document.getElementById(targetId);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                              setTimeout(() => {
                                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }
                          } else {
                            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                          }
                        }
                      }}
                      className="hover:text-[#7C3AED] transition-colors inline-flex items-center gap-1"
                    >
                      <span>{link.name}</span>
                      {link.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 tracking-wider">
                          {link.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {/* Dr. Aria AI Chat Quick Launcher */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-dr-aria-chat'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C3AED] text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-xs"
                title="Chat with Dr. Aria (AI Forensic Auditor)"
              >
                <Bot className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Dr. Aria AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* POPIA & LSSA Statutory Compliance Badge */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab: 'popia' } }))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-2xs"
                title="POPIA (Act 4/2013) & LSSA Legal Practice Standards Compliance"
              >
                <span className="text-xs">🇿🇦</span>
                <span>POPIA &bull; LSSA</span>
              </button>

              {/* Global Currency Selector - ALWAYS visible for document auditing & entire site */}
              <div className="flex items-center" title="Global Currency Selector - choose currency for document auditing, invoices, and reports">
                <CurrencySelector />
              </div>

              {/* White Label Button */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }))}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black transition-all hover:scale-[1.02] cursor-pointer shadow-sm shadow-amber-500/20"
                title="Business White Label Branding & Client Portal Studio"
              >
                <Crown className="w-3.5 h-3.5 text-slate-950" />
                <span>White Label</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-950 text-amber-300">
                  {isPro ? 'PRO' : 'BUSINESS'}
                </span>
              </button>

              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Account Portal"
                  >
                    <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="max-w-[140px] truncate">{getSafeUserDisplayName(userEmail)}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {!isPro && (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-trial-expired-modal'))}
                      className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isTrialExpired
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                          : 'bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200'
                      }`}
                      title={isTrialExpired ? '7-Day Free Trial has ended. Click to view subscription options.' : `7-Day Free Trial active (${remainingFormatted})`}
                    >
                      {isTrialExpired ? (
                        <>
                          <Hourglass className="w-3.5 h-3.5 text-rose-600" />
                          <span>7-Day Trial Expired</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>7-Day Trial ({remainingFormatted})</span>
                        </>
                      )}
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#64748B] hover:text-[#1E293B] font-bold text-sm px-2 cursor-pointer transition-colors"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => {
                      if (isTrialExpired) {
                        window.dispatchEvent(new CustomEvent('open-trial-expired-modal'));
                      } else {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`${
                      isTrialExpired
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                        : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-purple-500/20'
                    } px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5`}
                  >
                    {isTrialExpired ? (
                      <>
                        <Hourglass className="w-4 h-4 text-white" />
                        <span>Trial Expired — Upgrade</span>
                      </>
                    ) : (
                      <span>Get Started - 7-Day Free Trial</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Actions: Quick White Label + Hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-xs cursor-pointer hover:from-amber-400 hover:to-amber-500"
                title="Business White Label Branding"
              >
                <Crown className="w-3.5 h-3.5 text-slate-950" />
                <span className="text-[11px]">White Label</span>
              </button>
              <button
                className="p-2 text-[#1E293B]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-white border-t border-[#E2E8F0] p-4 lg:hidden shadow-2xl"
            >
              <div className="flex flex-col gap-2.5">
                {/* Dr. Aria AI Launcher Mobile */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-dr-aria-chat'));
                  }}
                  className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C3AED] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#7C3AED]" />
                    <span>Chat with Dr. Aria AI</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded-full border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </button>

                {/* Global Page Currency Selector - ALWAYS visible on mobile */}
                <div className="flex items-center justify-between p-2.5 my-1 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-800">Global Currency:</span>
                    <span className="text-[10px] text-slate-500">Document auditing & reports</span>
                  </div>
                  <CurrencySelector compact />
                </div>

                {/* Prominent Business White Label Studio card */}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left font-black text-amber-950 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border-2 border-amber-300 px-4 py-3 rounded-2xl text-xs flex items-center justify-between cursor-pointer shadow-xs my-1"
                >
                  <span className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                      <Crown className="w-4 h-4 text-slate-950" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-950 text-xs">🏢 Business White Label Studio</div>
                      <div className="text-[10px] text-amber-900 font-semibold">Custom Logo, Palettes &amp; Client Portals</div>
                    </div>
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-300 text-amber-950 border border-amber-400">
                    OPEN &rarr;
                  </span>
                </button>

                {linksToShow.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-[#1E293B] font-bold px-4 py-2.5 hover:bg-purple-50 hover:text-[#7C3AED] rounded-xl transition-colors flex items-center justify-between"
                    onClick={(e) => {
                      if (link.name === 'Dashboard') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
                      } else if (link.name === 'AI Auditor') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                        setTimeout(() => {
                          document.getElementById('document-auditor')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else if (link.name === 'Currency & Forex' || link.name === 'Currency Tools') {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'currency' } }));
                        setTimeout(() => {
                          document.getElementById('currency-tools')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else if (link.name === 'Audit Trail') {
                        e.preventDefault();
                        const el = document.getElementById('audittrail');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                          setTimeout(() => {
                            document.getElementById('audittrail')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }
                      } else if (link.name === 'Payroll') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'payroll' } }));
                      } else if (link.name === 'VAT & Tax' || link.name === 'VAT') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'vat' } }));
                      } else if (link.name === 'Bookkeeping') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'bookkeeping' } }));
                      } else if (link.name === 'Branding' || link.name === 'White Label') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }));
                      } else if (link.name === 'Staff Team') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'staff' } }));
                      } else if (link.name === 'Firm Clients') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'clients' } }));
                      } else if (link.name === 'Pricing') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'pricing' } }));
                        window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
                      } else {
                        e.preventDefault();
                        const targetId = link.href.startsWith('#') ? link.href.substring(1) : null;
                        if (targetId) {
                          const el = document.getElementById(targetId);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                            setTimeout(() => {
                              document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }
                        } else {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                        }
                      }
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{link.name}</span>
                      {link.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 tracking-wider">
                          {link.badge}
                        </span>
                      )}
                    </span>
                  </a>
                ))}
                
                {/* POPIA & LSSA Statutory Standards in Mobile Menu */}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab: 'popia' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer my-1"
                >
                  <span className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-700" />
                    <span>🇿🇦 POPIA (Act 4/2013) &amp; LSSA Compliance</span>
                  </span>
                  <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </button>

                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left font-bold text-amber-900 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer my-1"
                >
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Configure White Label Branding</span>
                  </span>
                  {!isPro && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      PRO
                    </span>
                  )}
                </button>

                <div className="h-px bg-[#E2E8F0] my-1" />

                {/* RED LOGOUT BUTTON FOR SIGNED IN USERS */}
                {isLoggedIn ? (
                  <div className="pt-1">
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-center font-extrabold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
                    >
                      <LogOut className="w-5 h-5 text-white shrink-0" />
                      <span>SIGN OUT / LOG OUT {isSuperAdminEmail(userEmail) ? '(Administrator)' : userEmail ? `(${userEmail})` : ''}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 space-y-2">
                    {!isPro && (
                      <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                        isTrialExpired ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-purple-50 border-purple-200 text-purple-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          {isTrialExpired ? <Hourglass className="w-4 h-4 text-rose-600" /> : <Clock className="w-4 h-4 text-purple-600" />}
                          <span>{isTrialExpired ? '7-Day Free Trial Expired' : '7-Day Free Trial Active'}</span>
                        </div>
                        <span className="font-mono text-[11px]">{remainingFormatted}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-center font-bold text-[#64748B] hover:text-[#1E293B] bg-slate-50 hover:bg-slate-100 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                    >
                      Log In
                    </button>
                    <button 
                      onClick={() => {
                        if (isTrialExpired) {
                          window.dispatchEvent(new CustomEvent('open-trial-expired-modal'));
                        } else {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-center font-bold text-white ${
                        isTrialExpired ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                      } px-4 py-3 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2`}
                    >
                      {isTrialExpired ? (
                        <>
                          <Hourglass className="w-4 h-4" />
                          <span>Trial Expired — Upgrade to Pro</span>
                        </>
                      ) : (
                        <span>Get Started - 7-Day Free Trial</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* White Label Settings Modal */}
      <WhiteLabelModal
        isOpen={showWhiteLabelModal}
        onClose={() => setShowWhiteLabelModal(false)}
      />
    </>
  );
}


