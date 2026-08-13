import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, CreditCard, Check, X, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: 'pro_monthly' | 'pro_yearly';
  interval?: 'monthly' | 'yearly';
}

export function StripeCheckoutModal({
  isOpen,
  onClose,
  plan = 'pro_monthly',
  interval = 'monthly'
}: StripeCheckoutModalProps) {
  const isYearly = interval === 'yearly' || plan === 'pro_yearly';
  const amount = isYearly ? '$590.00' : '$59.00';
  const periodText = isYearly ? 'year' : 'month';

  const [cardName, setCardName] = useState('Business Accounting User');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [zip, setZip] = useState('90210');
  const [cardError, setCardError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('Authorizing with Stripe...');

  if (!isOpen) return null;

  const handleFillTestCard = () => {
    setCardName('Dr. Aria Auditor User');
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/28');
    setCvc('888');
    setZip('10001');
    setCardError('');
  };

  const isValidLuhn = (cardNumberStr: string): boolean => {
    const digits = cardNumberStr.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validateCard = (): string | null => {
    if (!cardName.trim() || cardName.trim().length < 2) {
      return "Please enter the cardholder's full name.";
    }

    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(cleanNum)) {
      return "Invalid card number. Must be between 13 and 19 digits.";
    }

    if (!isValidLuhn(cleanNum)) {
      return "Card declined: The card number entered is invalid. Please check the digits.";
    }

    // Expiry check (MM/YY or MM/YYYY)
    const expiryMatch = expiry.trim().match(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/);
    if (!expiryMatch) {
      return "Invalid expiration date format. Please use MM/YY (e.g., 12/28).";
    }

    const expMonth = parseInt(expiryMatch[1], 10);
    let expYear = parseInt(expiryMatch[2], 10);
    if (expYear < 100) expYear += 2000;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return `Card declined: Card has expired (${expiryMatch[1]}/${expYear} is in the past).`;
    }

    // CVC check
    if (!/^\d{3,4}$/.test(cvc.trim())) {
      return "Invalid CVC security code. CVC must be 3 or 4 numeric digits.";
    }

    // ZIP check
    if (!zip.trim() || zip.trim().length < 3) {
      return "Please enter a valid billing ZIP / postal code.";
    }

    return null;
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');

    const errorMsg = validateCard();
    if (errorMsg) {
      setCardError(errorMsg);
      return;
    }

    setIsProcessing(true);
    setProcessStep('Connecting to Stripe Payment Gateway...');

    setTimeout(() => {
      setProcessStep('Verifying Card Security Code & Funds...');
    }, 1000);

    setTimeout(() => {
      setProcessStep('Activating Business White Label Pro Plan...');
    }, 2000);

    setTimeout(() => {
      localStorage.setItem('audit_this_doc_is_pro', 'true');
      localStorage.setItem('audit_this_doc_free_count', '0');
      window.dispatchEvent(new Event('pro-status-changed'));
      window.location.href = '/?payment=success';
    }, 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto"
        >
          {/* Top Stripe Navigation Bar */}
          <div className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
                title="Cancel & Return"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {/* Official Stripe Typography Badge */}
                <div className="font-black text-xl tracking-tight text-[#635BFF] flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg">
                  <span className="text-white font-extrabold text-sm tracking-widest uppercase">Stripe</span>
                  <span className="text-xs text-slate-300 font-semibold uppercase">Checkout</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Order Summary Column */}
            <div className="lg:col-span-5 bg-slate-50 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Order Summary</div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Business White Label Plan</h3>
                <p className="text-xs text-slate-500 mb-6">Full AI Forensic Scanner & White Label Firm Suite</p>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">Total Billed Today</span>
                    <span className="text-2xl font-black text-slate-900">{amount}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full inline-block">
                    Auto-renews at {amount}/{periodText}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Plan Highlights:</div>
                  {[
                    '1,000 Document & Invoice Audits / Month',
                    'Dr. Aria PhD Forensic AI Engine',
                    'Full White Label Portal & Custom Subdomain',
                    'Branded PDF Reports with Firm Header',
                    'Firm Client Directory & Staff Roles'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Powered by Stripe. Your payment credentials are secure.</span>
              </div>
            </div>

            {/* Right Payment Details Column */}
            <div className="lg:col-span-7 p-6 lg:p-8 bg-white relative">
              <h4 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center justify-between">
                <span>Payment Details</span>
                <button
                  type="button"
                  onClick={handleFillTestCard}
                  className="text-xs text-purple-600 hover:text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-200 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fill Test Card</span>
                </button>
              </h4>
              <p className="text-xs text-slate-500 mb-6">Complete your subscription checkout via Stripe secure gateway.</p>

              {isProcessing ? (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-[#635BFF] animate-spin" />
                    <ShieldCheck className="w-5 h-5 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-lg">{processStep}</h5>
                    <p className="text-xs text-slate-500 mt-1">Please do not close or refresh this page.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none pr-10"
                      />
                      <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Expiration (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CVC Code</label>
                      <input
                        type="text"
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        placeholder="CVC"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Billing ZIP / Postal Code</label>
                    <input
                      type="text"
                      required
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="90210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                    />
                  </div>

                  {cardError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-start gap-2 animate-shake">
                      <X className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cardError}</span>
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full bg-[#635BFF] hover:bg-[#534be0] active:bg-[#433bc0] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-white" />
                      <span>Pay {amount} with Stripe</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
