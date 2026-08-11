import { useState, useEffect } from 'react';
import { Menu, X, Bot, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [userEmail, setUserEmail] = useState('');

  const checkAuthStatus = () => {
    const authed = localStorage.getItem('audit-this-doc-cms-auth') === 'true';
    setIsLoggedIn(authed);
    setUserEmail(localStorage.getItem('audit-this-doc-user-email') || '');
  };

  useEffect(() => {
    checkAuthStatus();

    window.addEventListener('admin-auth-changed', checkAuthStatus);
    window.addEventListener('storage', checkAuthStatus);
    return () => {
      window.removeEventListener('admin-auth-changed', checkAuthStatus);
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('audit-this-doc-cms-auth');
    localStorage.removeItem('audit-this-doc-user-email');
    localStorage.removeItem('audit_this_doc_is_pro');
    setIsLoggedIn(false);
    setUserEmail('');
    window.dispatchEvent(new Event('admin-auth-changed'));
    window.dispatchEvent(new Event('pro-status-changed'));
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
  };

  const linksToShow = isLoggedIn 
    ? [...navLinks.slice(0, 2), { name: 'Dashboard', href: '#dashboard' }, ...navLinks.slice(2)]
    : navLinks;

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }))}
            >
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#1E293B]">
                Audit This Doc <span className="text-[#7C3AED]">AI</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <ul className="hidden lg:flex gap-6 text-sm font-semibold text-[#64748B]">
              {linksToShow.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (link.name === 'Dashboard') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
                      } else if (link.name === 'Bookkeeping') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'bookkeeping' } }));
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

          <div className="hidden lg:flex items-center gap-4">
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
                  className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <>
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
              </>
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
                    } else {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                    }
                    setMobileMenuOpen(false);
                  }}
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-[#E2E8F0] my-1" />
              {isLoggedIn ? (
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center font-bold text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out ({userEmail || 'Account'})
                </button>
              ) : (
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center font-bold text-white bg-[#7C3AED] px-4 py-3 rounded-xl shadow-md"
                >
                  Get Started / Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

