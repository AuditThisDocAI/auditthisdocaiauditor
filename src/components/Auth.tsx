import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

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

  const handleAuth = async (e: React.FormEvent) => {
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

    try {
      const cleanEmail = email.trim().toLowerCase();
      const savedPasswordsJson = localStorage.getItem('audit_user_passwords') || '{}';
      let savedPasswords: Record<string, string> = {};
      try {
        savedPasswords = JSON.parse(savedPasswordsJson);
      } catch (e) {}

      if (isSignUp) {
        // Record password locally upon sign up
        savedPasswords[cleanEmail] = password;
        localStorage.setItem('audit_user_passwords', JSON.stringify(savedPasswords));

        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        // Verify local sign up record if present
        if (savedPasswords[cleanEmail] && savedPasswords[cleanEmail] !== password) {
          setAuthError('Invalid password. The password entered does not match the password created upon sign up.');
          return;
        }

        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (fbErr: any) {
          // If account exists locally, update local password record if Firebase succeeded in past
          if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
            setAuthError('Invalid password. The password entered does not match the password created upon sign up.');
            return;
          } else if (fbErr.code === 'auth/user-not-found') {
            setAuthError('No registered account found with this email. Please switch to Sign Up.');
            return;
          } else {
            throw fbErr;
          }
        }
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
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
         setAuthError('Invalid user credentials. Please check your password or go to sign up.');
      } else if (error.code === 'auth/email-already-in-use') {
         setAuthError('Email already in use. Please sign in instead.');
      } else {
         setAuthError(error.message || 'Authentication failed.');
      }
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmailStr = user.email || 'Google User';

      const isSuperAdmin = userEmailStr.trim().toLowerCase() === 'brigittalombard09@gmail.com';
      localStorage.setItem('audit-this-doc-cms-auth', 'true');
      localStorage.setItem('audit-this-doc-user-email', userEmailStr);
      if (isSuperAdmin) {
        localStorage.setItem('audit_this_doc_is_pro', 'true');
      }
      setUserEmail(userEmailStr);
      setIsAuthenticated(true);
      window.dispatchEvent(new Event('admin-auth-changed'));
      window.dispatchEvent(new Event('pro-status-changed'));
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
    } catch (error: any) {
      console.error("Google Auth error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in popup was closed before completing.');
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError('Google sign-in popup was blocked by browser. Please allow popups.');
      } else {
        setAuthError(error.message || 'Google authentication failed.');
      }
    }
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
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-[#64748B] text-sm mb-6">
          {isSignUp ? 'Sign up to get started' : 'Sign in to access your portal'}
        </p>

        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-200 shadow-xs transition-all hover:border-slate-300 hover:shadow-md cursor-pointer mb-5"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isSignUp ? 'Instant Sign Up with Google' : 'Sign In with Google'}</span>
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-semibold">Or with email & password</span>
          </div>
        </div>

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
