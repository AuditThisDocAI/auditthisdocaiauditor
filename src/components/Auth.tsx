import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('audit-this-doc-cms-auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    const isAdmin = email.toLowerCase() === 'brigittalombard09@gmail.com' && password === '123';

    if (isSignUp) {
      if (isAdmin) {
        setIsAuthenticated(true);
        localStorage.setItem('audit-this-doc-cms-auth', 'true');
        window.dispatchEvent(new Event('admin-auth-changed'));
      } else {
        setAuthSuccess('Sign up successful! Your account is pending admin approval.');
        setEmail('');
        setPassword('');
      }
    } else {
      if (isAdmin) {
        setIsAuthenticated(true);
        localStorage.setItem('audit-this-doc-cms-auth', 'true');
        window.dispatchEvent(new Event('admin-auth-changed'));
      } else {
        setAuthError('Access denied. Invalid credentials.');
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-[80vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-center text-[#1E293B] mb-8">
          Welcome, Admin!
        </h2>
        <p className="text-[#64748B] text-center mb-12 max-w-lg">
          Please select which portal you would like to access.
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
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'cms' } }))}
            className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-[#7C3AED] transition-all group"
          >
            <div className="w-16 h-16 bg-[#F8F9FC] group-hover:bg-[#7C3AED]/10 text-[#64748B] group-hover:text-[#7C3AED] rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-2">CMS System</h3>
            <p className="text-sm text-[#64748B] text-center">Manage articles, resources, and public content.</p>
          </button>
        </div>

        <button
          onClick={() => {
            setIsAuthenticated(false);
            localStorage.removeItem('audit-this-doc-cms-auth');
            window.dispatchEvent(new Event('admin-auth-changed'));
          }}
          className="mt-12 text-[#64748B] hover:text-[#1E293B] font-medium transition-colors"
        >
          Logout
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
        <p className="text-center text-[#64748B] text-sm mb-8">
          {isSignUp ? 'Sign up to get started' : 'Sign in to access your portal'}
        </p>

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
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
              placeholder="••••••••"
              required
            />
          </div>

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
