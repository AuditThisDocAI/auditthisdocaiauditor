import { useState, useEffect } from 'react';
import { Menu, X, Bot, LogOut, User, Crown, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getWhiteLabelConfig, WhiteLabelConfig } from '../lib/whitelabel';
import { WhiteLabelModal } from './WhiteLabelModal';
import { CurrencySelector } from './CurrencySelector';

const navLinks = [
  { name: 'Dr. Aria Auditor', href: '#document-auditor' },
  { name: 'Bookkeeping', href: '#bookkeeping' },
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Contact', href: '#contact' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(getWhiteLabelConfig());
  const [showWhiteLabelModal, setShowWhiteLabelModal] = useState(false);

  const checkAuthStatus = () => {
    const authed = localStorage.getItem('audit-this-doc-cms-auth') === 'true';
    const email = (localStorage.getItem('audit-this-doc-user-email') || '').toLowerCase().trim();
    const isAdmin = email === 'brigittalombard09@gmail.com';
    const pro = localStorage.getItem('audit_this_doc_is_pro') === 'true' || isAdmin;

    setIsLoggedIn(authed);
    setIsPro(pro);
    setUserEmail(email);
    setWhiteLabelConfig(getWhiteLabelConfig());
  };

  useEffect(() => {
    checkAuthStatus();

    window.addEventListener('admin-auth-changed', checkAuthStatus);
    window.addEventListener('pro-status-changed', checkAuthStatus);
    window.addEventListener('whitelabel-updated', checkAuthStatus);
    window.addEventListener('storage', checkAuthStatus);
    return () => {
      window.removeEventListener('admin-auth-changed', checkAuthStatus);
      window.removeEventListener('pro-status-changed', checkAuthStatus);
      window.removeEventListener('whitelabel-updated', checkAuthStatus);
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('audit-this-doc-cms-auth');
    localStorage.removeItem('audit-this-doc-user-email');
    localStorage.removeItem('audit_this_doc_is_pro');
    setIsLoggedIn(false);
    setIsPro(false);
    setUserEmail('');
    window.dispatchEvent(new Event('admin-auth-changed'));
    window.dispatchEvent(new Event('pro-status-changed'));
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
  };

  // White label settings are strictly reserved for paid subscribers who have signed up
  const isPaidAndSignedUp = isLoggedIn && isPro;

  const linksToShow = [
    navLinks[0], // Dr. Aria Auditor
    navLinks[1], // Bookkeeping
    ...(isLoggedIn ? [{ name: 'Dashboard', href: '#dashboard' }] : []),
    ...(isPaidAndSignedUp ? [{ name: 'Branding', href: '#whitelabel' }] : []),
    ...(isLoggedIn ? [{ name: 'Staff Team', href: '#staff' }, { name: 'Firm Clients', href: '#clients' }] : []),
    ...navLinks.slice(2) // Features, Pricing, FAQ, Contact
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
                  {whiteLabelConfig.enabled && (
                    <span className="text-[10px] text-[#64748B] font-mono tracking-wide flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-purple-600" />
                      White Label Verified Portal
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
                        } else if (link.name === 'Bookkeeping') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'bookkeeping' } }));
                        } else if (link.name === 'Branding') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }));
                        } else if (link.name === 'Staff Team') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'staff' } }));
                        } else if (link.name === 'Firm Clients') {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'clients' } }));
                        } else {
                          window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                        }
                      }}
                      className="hover:text-[#7C3AED] transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {/* Currency Converter Toggle */}
              <CurrencySelector />

              {/* White Label Button - ONLY shown after user paid and signed up */}
              {isPaidAndSignedUp && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
                  title="Business White Label Branding"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>White Label Settings</span>
                </button>
              )}

              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Account Portal"
                  >
                    <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="max-w-[140px] truncate">{userEmail || 'Account'}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
                    className="text-sm font-bold text-[#1E293B] hover:text-[#7C3AED] transition-colors px-3 py-2"
                  >
                    Sign In / Portal
                  </button>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-[#1E293B]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-2">
                  <span className="text-xs font-bold text-slate-500">Currency Preference:</span>
                  <CurrencySelector compact />
                </div>
                {linksToShow.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-[#1E293B] font-semibold px-4 py-2 hover:bg-[#F8F9FC] rounded-lg"
                    onClick={(e) => {
                      if (link.name === 'Dashboard') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
                      } else if (link.name === 'Bookkeeping') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'bookkeeping' } }));
                      } else if (link.name === 'Branding') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }));
                      } else if (link.name === 'Staff Team') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'staff' } }));
                      } else if (link.name === 'Firm Clients') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'clients' } }));
                      } else {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                      }
                      setMobileMenuOpen(false);
                    }}
                  >
                    {link.name}
                  </a>
                ))}
                
                {isPaidAndSignedUp && (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }));
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left font-bold text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-600" />
                    Configure Business White Label
                  </button>
                )}

                <div className="h-px bg-[#E2E8F0] my-2" />

                {!isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-center font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-3 rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Get Started / Sign In
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-center font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Log Out / Reset Session</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center font-extrabold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Log Out {userEmail ? `(${userEmail})` : ''}</span>
                  </button>
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


