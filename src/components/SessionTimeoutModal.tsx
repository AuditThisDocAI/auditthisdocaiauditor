import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  LogOut, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Lock,
  Timer
} from 'lucide-react';
import { 
  getRemainingSessionSeconds, 
  extendSession, 
  performLogout, 
  recordUserActivity, 
  isUserAuthenticated,
  WARNING_THRESHOLD_SECONDS,
  getSessionTimeoutSeconds
} from '../lib/sessionManager';

export function SessionTimeoutModal() {
  const [isAuth, setIsAuth] = useState<boolean>(isUserAuthenticated());
  const [remainingSec, setRemainingSec] = useState<number>(() => getRemainingSessionSeconds());
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [isExtending, setIsExtending] = useState<boolean>(false);
  const lastInteractionThrottleRef = useRef<number>(0);

  // Check auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      const authStatus = isUserAuthenticated();
      setIsAuth(authStatus);
      if (authStatus) {
        recordUserActivity();
        setRemainingSec(getRemainingSessionSeconds());
      } else {
        setShowWarningModal(false);
      }
    };

    window.addEventListener('admin-auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('admin-auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Track user activity when warning modal is NOT open
  useEffect(() => {
    if (!isAuth) return;

    const handleUserActivity = () => {
      // If modal is showing, do not auto-dismiss without explicit user action on "Stay Logged In"
      if (showWarningModal) return;

      const now = Date.now();
      // Throttle recording to at most once every 3 seconds
      if (now - lastInteractionThrottleRef.current > 3000) {
        lastInteractionThrottleRef.current = now;
        recordUserActivity();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isAuth, showWarningModal]);

  // Main countdown & timeout watcher
  useEffect(() => {
    if (!isAuth) {
      setShowWarningModal(false);
      return;
    }

    const interval = setInterval(() => {
      const remaining = getRemainingSessionSeconds();
      setRemainingSec(remaining);

      // Trigger warning dialog when remaining seconds is <= 60 and > 0
      if (remaining <= WARNING_THRESHOLD_SECONDS && remaining > 0) {
        setShowWarningModal(true);
      } else if (remaining > WARNING_THRESHOLD_SECONDS) {
        setShowWarningModal(false);
      } else if (remaining <= 0) {
        // Session expired
        setShowWarningModal(false);
        performLogout('Your authentication session has expired due to inactivity (financial compliance policy).');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuth]);

  const handleExtend = () => {
    setIsExtending(true);
    setTimeout(() => {
      extendSession();
      setShowWarningModal(false);
      setIsExtending(false);
      setRemainingSec(getSessionTimeoutSeconds());
    }, 250);
  };

  const handleManualLogout = () => {
    setShowWarningModal(false);
    performLogout('Session closed by user.');
  };

  if (!isAuth || !showWarningModal) {
    return null;
  }

  // Calculate percentage of 60s remaining
  const progressPercent = Math.max(0, Math.min(100, (remainingSec / WARNING_THRESHOLD_SECONDS) * 100));
  const isUrgent = remainingSec <= 20;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Warning Banner */}
        <div className={`p-6 border-b text-center transition-colors ${
          isUrgent 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center mb-3">
            {/* Pulsing ring */}
            <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
              isUrgent ? 'bg-rose-500' : 'bg-amber-500'
            }`} />
            
            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>

          <h2 id="session-warning-title" className="text-xl font-extrabold tracking-tight">
            Session Expiring Soon
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            You have been inactive. For financial data compliance, your authentication session will automatically terminate.
          </p>
        </div>

        {/* Countdown Center Display */}
        <div className="p-6 text-center">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Automatic Logout In
            </span>
            <div className="flex items-center justify-center gap-1.5 font-mono">
              <Timer className={`w-6 h-6 ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`} />
              <span className={`text-4xl font-extrabold ${isUrgent ? 'text-rose-600' : 'text-slate-900'}`}>
                {remainingSec < 10 ? `0${remainingSec}` : remainingSec}
              </span>
              <span className="text-sm font-bold text-slate-500 ml-1">seconds</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className={`h-full transition-all duration-1000 ${
                  isUrgent ? 'bg-rose-600' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Click <strong>Stay Logged In</strong> to refresh your forensic session and continue working without losing unsaved calculations.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExtend}
              disabled={isExtending}
              className="flex-1 py-3 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm rounded-xl shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isExtending ? 'animate-spin' : ''}`} />
              <span>{isExtending ? 'Extending...' : 'Stay Logged In'}</span>
            </button>

            <button
              onClick={handleManualLogout}
              className="py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Now</span>
            </button>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
          <Lock className="w-3.5 h-3.5 text-purple-600" />
          <span>Protected by FORENSICDOC Inactivity Auto-Lock</span>
        </div>
      </div>
    </div>
  );
}
