import React, { useState, useEffect } from 'react';
import { 
  Hourglass, 
  Crown, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { useTrial } from '../lib/trialManager';
import { useCurrency } from '../lib/currency';

interface TrialExpiredModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TrialExpiredModal({ isOpen: manualOpen, onClose: manualClose }: TrialExpiredModalProps) {
  const { isPro, isTrialExpired, remainingFormatted, resetTrial, simulateExpired } = useTrial();
  const { format } = useCurrency();
  const [internalOpen, setInternalOpen] = useState(false);
  const [showTesterTools, setShowTesterTools] = useState(false);

  useEffect(() => {
    const handleOpen = () => setInternalOpen(true);
    window.addEventListener('open-trial-expired-modal', handleOpen);
    return () => window.removeEventListener('open-trial-expired-modal', handleOpen);
  }, []);

  const isVisible = (manualOpen !== undefined ? manualOpen : internalOpen) || (isTrialExpired && !isPro && internalOpen);

  const handleClose = () => {
    if (manualClose) manualClose();
    setInternalOpen(false);
  };

  const handleUpgrade = () => {
    handleClose();
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'pricing' } }));
    window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
  };

  if (!isVisible && !manualOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Hourglass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Time Expired
              </span>
              <h3 className="text-xl font-black text-white mt-0.5 tracking-tight">
                7-Day Free Trial Concluded
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            Your 7-day evaluation period for Forensic Document Auditor has ended.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Trial Expiration Notice (7 Days Completed)</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              To keep inspecting invoices, detecting anomalies, verifying tax IDs, and generating certified audit reports, upgrade to the Business White Label Plan.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              What Pro Unlocks:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1,000 Document Audits/mo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom Firm White Label</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Grok AI Forensic Workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SHA-256 Immutable Ledger</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={handleUpgrade}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 px-5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-purple-500/20 hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Upgrade to Pro Plan ({format(59, { hideDecimals: true })}/month)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                handleClose();
                window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'pricing' } }));
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Compare All Subscription Details
            </button>
          </div>

          {/* Interactive Tester & Developer Controls */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowTesterTools(!showTesterTools)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              {showTesterTools ? 'Hide Trial Testing Tools' : '🛠️ Trial Test Controls (Simulate 7-Day Expiry)'}
            </button>

            {showTesterTools && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">7-Day Free Trial State:</span>
                <p className="text-slate-500 text-[11px]">
                  Current status: <span className="font-mono font-bold text-purple-700">{remainingFormatted}</span>
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      resetTrial();
                      handleClose();
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset to 7 Days Fresh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      simulateExpired();
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Hourglass className="w-3 h-3" />
                    Simulate Time Is Up
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
