import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (localStorage.getItem('audit-this-doc-cms-auth') === 'true') {
      setIsAuthenticated(true);
      setUserEmail(localStorage.getItem('audit-this-doc-user-email') || 'Member');
    }
  }, []);

  const [dataOwnershipAgreed, setDataOwnershipAgreed] = useState(true);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!email.trim() || !password.trim()) {
      setAuthError('Please fill in all fields.');
      return;
    }

    if (password.length < 8 || password.length > 16) {
      setAuthError('Password must be between 8 and 16 characters.');
      return;
    }

    if (isSignUp && !dataOwnershipAgreed) {
      setAuthError('You must confirm that all uploaded client data belongs exclusively to your accounting firm.');
      return;
    }

    // Authenticate user directly into site with no pending approval delays
    const isSuperAdmin = email.trim().toLowerCase() === 'brigittalombard09@gmail.com';
    localStorage.setItem('audit-this-doc-cms-auth', 'true');
    localStorage.setItem('audit-this-doc-user-email', email.trim());
    if (isSuperAdmin) {
      localStorage.setItem('audit_this_doc_is_pro', 'true');
    }
    setUserEmail(email.trim());
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('admin-auth-changed'));
    window.dispatchEvent(new Event('pro-status-changed'));
    
    // Navigate directly into site dashboard
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
  };

  const handleQuickAdminLogin = () => {
    const adminEmail = 'brigittalombard09@gmail.com';
    localStorage.setItem('audit-this-doc-cms-auth', 'true');
    localStorage.setItem('audit-this-doc-user-email', adminEmail);
    localStorage.setItem('audit_this_doc_is_pro', 'true');
    setUserEmail(adminEmail);
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('admin-auth-changed'));
    window.dispatchEvent(new Event('pro-status-changed'));
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
  };

  if (isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-[80vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-center text-[#1E293B] mb-2">
          Welcome, {userEmail || 'Member'}!
        </h2>
        <p className="text-[#64748B] text-center mb-12 max-w-lg">
          Your account is active with full access. Select a portal to get started.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }))}
            className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-[#7C3AED] transition-all group"
          >
            <div className="w-16 h-16 bg-[#F8F9FC] group-hover:bg-[#7C3AED]/10 text-[#64748B] group-hover:text-[#7C3AED] rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-2">App Dashboard</h3>
            <p className="text-sm text-[#64748B] text-center">Access the main application dashboard and metrics.</p>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'bookkeeping' } }))}
            className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-[#7C3AED] transition-all group"
          >
            <div className="w-16 h-16 bg-[#F8F9FC] group-hover:bg-[#7C3AED]/10 text-[#64748B] group-hover:text-[#7C3AED] rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-2">Bookkeeping Suite</h3>
            <p className="text-sm text-[#64748B] text-center">Manage general ledger entries, P&L statements, and tax audits.</p>
          </button>
        </div>

        <button
          onClick={() => {
            setIsAuthenticated(false);
            localStorage.removeItem('audit-this-doc-cms-auth');
            localStorage.removeItem('audit-this-doc-user-email');
            localStorage.removeItem('audit_this_doc_is_pro');
            window.dispatchEvent(new Event('admin-auth-changed'));
            window.dispatchEvent(new Event('pro-status-changed'));
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
          }}
          className="mt-10 inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Log Out of Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#E2E8F0] w-full">
        <div className="w-12 h-12 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl flex items-center justify-center mb-6 mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-center text-[#1E293B] mb-2">
          {isSignUp ? 'Create Instant Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-[#64748B] text-sm mb-4">
          {isSignUp ? 'Sign up for immediate access — no admin approval required' : 'Sign in to access your portal'}
        </p>

        {isSignUp && (
          <div className="mb-6 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold w-fit mx-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Instant Sign Up • No Admin Approval Needed
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-[#1E293B]">Password</label>
              <span className="text-[11px] font-semibold text-[#64748B]">8–16 characters</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={16}
              className="w-full px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
              placeholder="••••••••"
              required
            />
            <p className="text-[11px] text-[#64748B] mt-1">Must be between 8 and 16 characters long.</p>
          </div>

          {isSignUp && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dataOwnershipAgreed}
                  onChange={(e) => setDataOwnershipAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs text-slate-700 font-medium leading-tight">
                  <strong>Data Ownership Agreement:</strong> I confirm that all uploaded client financial ledgers and document audit data belong exclusively to our accounting firm and remain strictly confidential.
                </span>
              </label>
            </div>
          )}

          {authError && (
            <div className="text-red-500 text-sm font-medium text-center p-3 bg-red-50 rounded-lg">
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="text-green-600 text-sm font-medium text-center p-3 bg-green-50 rounded-lg">
              {authSuccess}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError('');
              setAuthSuccess('');
            }}
            className="text-sm font-medium text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
