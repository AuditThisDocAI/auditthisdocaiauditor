import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldAlert, Check, Sparkles, X, ArrowRight, CreditCard, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useCurrency } from '../lib/currency';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditCount?: number;
}

export function PaywallModal({ isOpen, onClose, auditCount = 10 }: PaywallModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);
  const { format } = useCurrency();

  if (!isOpen) return null;

  const handleStripeCheckout = (interval: 'monthly' | 'yearly') => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-stripe-checkout', { detail: { plan: interval === 'yearly' ? 'pro_yearly' : 'pro_monthly', interval } }));
  };

  const handleNavigateAuth = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] max-w-xl w-full overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1E293B] via-[#7C3AED] to-[#6D28D9] p-7 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Lock className="w-3.5 h-3.5" />
              10/10 Free Audits Completed
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Unlock Unlimited Dr. Aria Audits
            </h2>
            <p className="text-purple-100 text-sm mt-2 leading-relaxed">
              You've completed your 10 free audits. Please sign up, log in, or subscribe to continue scanning invoices & documents.
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-7 space-y-5 bg-white">
            <div className="bg-[#F8F9FC] border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider">Free Limit Status</div>
                <div className="text-base font-extrabold text-[#1E293B] flex items-center gap-2 mt-0.5">
                  <span className="text-red-500">{auditCount} / 10 Free Audits Completed</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">
                  Limit Reached
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-[#1E293B] tracking-wider">Pro Tier Highlights:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-[#1E293B]">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>1,000 Audits / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Dr. Aria AI Forensic Auditor</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Fraud & Wire Risk Score</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Export PDF Audit Certificates</span>
                </li>
              </ul>
            </div>

            {/* Pricing Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Monthly Plan */}
              <div className="p-4 rounded-2xl border-2 border-[#7C3AED] bg-[#7C3AED]/5 relative flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-[#7C3AED]/30">
                    Monthly Option
                  </span>
                  <div className="text-2xl font-black text-[#1E293B] mt-2">
                    {format(59, { hideDecimals: true })} <span className="text-xs font-normal text-[#64748B]">/ month</span>
                  </div>
                  <div className="text-xs font-bold text-[#1E293B] mt-0.5">1,000 Audits / Mo</div>
                </div>

                <button
                  onClick={() => handleStripeCheckout('monthly')}
                  disabled={loadingPlan === 'monthly'}
                  className="mt-4 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {loadingPlan === 'monthly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {format(59, { hideDecimals: true })} / Month</span>
                    </>
                  )}
                </button>
              </div>

              {/* Yearly Plan */}
              <div className="p-4 rounded-2xl border-2 border-[#10B981] bg-white relative flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
                    Best Value (Save 20%)
                  </span>
                  <div className="text-2xl font-black text-[#1E293B] mt-2">
                    {format(590, { hideDecimals: true })} <span className="text-xs font-normal text-[#64748B]">/ year</span>
                  </div>
                  <div className="text-xs font-bold text-[#1E293B] mt-0.5">12,000 Audits / Yr ({format(49, { hideDecimals: true })}/mo)</div>
                </div>

                <button
                  onClick={() => handleStripeCheckout('yearly')}
                  disabled={loadingPlan === 'yearly'}
                  className="mt-4 w-full bg-[#10B981] hover:bg-[#059669] text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {loadingPlan === 'yearly' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {format(590, { hideDecimals: true })} / Year</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account Sign Up or Login Required CTA */}
            <div className="pt-2 border-t border-[#E2E8F0] text-center space-y-2">
              <div className="text-xs text-[#64748B] font-medium">Already have an account or need to create one?</div>
              <div className="flex gap-3">
                <button
                  onClick={handleNavigateAuth}
                  className="flex-1 bg-white border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up / Create Account</span>
                </button>
                <button
                  onClick={handleNavigateAuth}
                  className="flex-1 bg-[#F8F9FC] border border-[#E2E8F0] text-[#1E293B] hover:bg-gray-100 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-[#7C3AED]" />
                  <span>Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

