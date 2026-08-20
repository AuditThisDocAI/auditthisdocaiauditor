import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  Timer, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  getRemainingSessionSeconds, 
  getSessionTimeoutSeconds, 
  setSessionTimeoutSeconds, 
  extendSession,
  WARNING_THRESHOLD_SECONDS,
  recordUserActivity
} from '../lib/sessionManager';

export function SessionSecurityWidget() {
  const [remainingSec, setRemainingSec] = useState<number>(() => getRemainingSessionSeconds());
  const [timeoutSec, setTimeoutSec] = useState<number>(() => getSessionTimeoutSeconds());
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [extendedSuccess, setExtendedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      setRemainingSec(getRemainingSessionSeconds());
      setTimeoutSec(getSessionTimeoutSeconds());
    };

    const interval = setInterval(update, 1000);
    window.addEventListener('session-config-changed', update);
    window.addEventListener('session-activity-recorded', update);
    return () => {
      clearInterval(interval);
      window.removeEventListener('session-config-changed', update);
      window.removeEventListener('session-activity-recorded', update);
    };
  }, []);

  const formatMinutesSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleTimeoutChange = (newSec: number) => {
    setSessionTimeoutSeconds(newSec);
    setTimeoutSec(newSec);
    extendSession();
  };

  const handleManualExtend = () => {
    extendSession();
    setExtendedSuccess(true);
    setTimeout(() => setExtendedSuccess(false), 2500);
  };

  const triggerTestWarning = () => {
    // Set last activity timestamp so that exactly 59 seconds remain
    const targetTimeout = getSessionTimeoutSeconds();
    const mockLastActivity = Date.now() - ((targetTimeout - 59) * 1000);
    localStorage.setItem('audit_session_last_activity', mockLastActivity.toString());
    setRemainingSec(59);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-[#7C3AED] shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-[#1E293B]">Compliance Session Security</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Active Auto-Lock
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Automatic 60-second warning before session expiration for forensic data protection.
            </p>
          </div>
        </div>

        {/* Status + Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Idle Expiration In
            </span>
            <span className="font-mono text-sm font-extrabold text-[#1E293B]">
              {formatMinutesSeconds(remainingSec)}
            </span>
          </div>

          <button
            onClick={handleManualExtend}
            className="py-2.5 px-3.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Extend current session activity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${extendedSuccess ? 'text-emerald-600 animate-spin' : ''}`} />
            <span>{extendedSuccess ? 'Extended!' : 'Extend Session'}</span>
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Settings
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Inactivity Timeout Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '5 Minutes', sec: 300 },
                { label: '15 Minutes (Default)', sec: 900 },
                { label: '30 Minutes', sec: 1800 },
                { label: '60 Minutes', sec: 3600 }
              ].map((opt) => (
                <button
                  key={opt.sec}
                  onClick={() => handleTimeoutChange(opt.sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeoutSec === opt.sec
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              The user warning dialog will automatically trigger exactly <strong>60 seconds</strong> before this timeout is reached.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-purple-600" />
                Compliance Warning Verification
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Preview the 60-second warning countdown modal in real-time to inspect audit behavior.
              </p>
            </div>
            <button
              onClick={triggerTestWarning}
              className="mt-3 py-2 px-3 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate 60s Expiration Warning</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
