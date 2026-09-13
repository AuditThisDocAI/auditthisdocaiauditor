import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Lock, Check, ArrowLeft, Loader2, 
  Key, ExternalLink, CheckCircle2, AlertCircle, ArrowRight,
  CreditCard
} from 'lucide-react';
import { useCurrency } from '../lib/currency';
import { isSuperAdminEmail } from '../lib/authUtils';
import { appendAuditTrailEvent } from '../lib/auditTrailService';

interface FreemiusCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: 'pro_monthly' | 'pro_yearly';
  interval?: 'monthly' | 'yearly';
}

export function FreemiusCheckoutModal({
  isOpen,
  onClose,
  plan = 'pro_monthly',
  interval = 'monthly'
}: FreemiusCheckoutModalProps) {
  const { format, currencyConfig } = useCurrency();
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>(
    interval === 'yearly' || plan === 'pro_yearly' ? 'yearly' : 'monthly'
  );

  const isYearly = selectedInterval === 'yearly';
  const rawAmount = isYearly ? 590 : 59;
  const formattedPrice = format(rawAmount);

  const [activeTab, setActiveTab] = useState<'checkout' | 'license'>('checkout');
  const [userEmail, setUserEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  
  // Direct Payment Success State
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    transactionId: string;
    licenseKey: string;
    amount: number;
    plan: string;
    timestamp: string;
  } | null>(null);

  // Check if current user is admin
  const currentLoggedInEmail = localStorage.getItem('audit-this-doc-user-email') || userEmail || '';
  const isAdmin = isSuperAdminEmail(currentLoggedInEmail);

  // License Key State (Admin only)
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [licenseSuccess, setLicenseSuccess] = useState('');

  // Fetch Freemius config from backend
  const [fsConfig, setFsConfig] = useState<{ productId: string, planMonthlyId: string, planYearlyId: string, customCheckoutUrl?: string } | null>(null);

  useEffect(() => {
    fetch('/api/freemius/config')
      .then(res => res.json())
      .then(data => setFsConfig(data))
      .catch(err => console.error("Failed to load Freemius config", err));
  }, []);

  // Default Freemius URL
  const productId = fsConfig?.productId || '33243';
  const planId = isYearly ? (fsConfig?.planYearlyId || '61464') : (fsConfig?.planMonthlyId || '61454');
  
  // Use custom checkout URL if provided, otherwise build the standard Freemius URL using /product/
  let defaultFreemiusUrl = '';
  if (fsConfig?.customCheckoutUrl) {
    const separator = fsConfig.customCheckoutUrl.includes('?') ? '&' : '?';
    defaultFreemiusUrl = `${fsConfig.customCheckoutUrl}${separator}user_email=${encodeURIComponent(userEmail || '')}&billing_cycle=${isYearly ? 'annual' : 'monthly'}`;
  } else {
    defaultFreemiusUrl = `https://checkout.freemius.com/product/${productId}/plan/${planId}/?user_email=${encodeURIComponent(userEmail || '')}&billing_cycle=${isYearly ? 'annual' : 'monthly'}`;
  }

  useEffect(() => {
    if (isOpen) {
      const storedEmail = localStorage.getItem('audit-this-doc-user-email') || '';
      if (storedEmail) setUserEmail(storedEmail);
      setSelectedInterval(interval === 'yearly' || plan === 'pro_yearly' ? 'yearly' : 'monthly');
      setCheckoutError('');
      setPaymentSuccessData(null);
    }
  }, [isOpen, interval, plan]);

  if (!isOpen) return null;

  const handleVerifyLicenseKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseError('');
    setLicenseSuccess('');
    setLicenseLoading(true);

    try {
      const res = await fetch('/api/freemius/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, userEmail })
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setLicenseSuccess(data.message || 'License verified successfully! Activating Pro...');
        localStorage.setItem('audit_this_doc_is_pro', 'true');
        localStorage.setItem('audit_this_doc_free_count', '0');
        localStorage.setItem('freemius_license_key', licenseKey);
        
        appendAuditTrailEvent({
          category: 'SECURITY_AUTH',
          action: 'License Key Verified & Bound',
          severity: 'VERIFIED',
          actor: userEmail || 'Administrator',
          details: `Freemius License (${licenseKey.slice(0, 8)}...) successfully validated. Pro features enabled.`
        });

        window.dispatchEvent(new Event('pro-status-changed'));
        setTimeout(() => {
          onClose();
          window.location.href = '/?payment=success';
        }, 1500);
      } else {
        setLicenseError(data.message || 'License verification failed. Please check your key.');
      }
    } catch (err: any) {
      setLicenseError('Failed to connect to license server. Please try again.');
    } finally {
      setLicenseLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto"
        >
          {/* Top Header */}
          <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Cancel & Return"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700/60 px-3.5 py-1.5 rounded-xl">
                  <div className="w-5 h-5 bg-[#7C3AED] text-white rounded-md flex items-center justify-center font-black text-xs">
                    F
                  </div>
                  <span className="text-white font-extrabold text-sm tracking-tight">ForensicDocAudit</span>
                  <span className="text-xs text-[#10B981] font-bold uppercase tracking-wider">Payment Plan Options</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

          {/* Subheader: Mode Switcher */}
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('checkout')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'checkout'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Instant Payment Plan Option</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('license')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'license'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  <span>Activate License Key (Admin)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {isYearly ? 'Annual Billing' : 'Monthly Billing'}
              </span>
            </div>
          </div>

          {/* If Payment Successful, Show Celebratory Confirmation */}
          {paymentSuccessData ? (
            <div className="p-8 sm:p-12 text-center bg-white space-y-6">
              <div className="w-20 h-20 bg-[#10B981]/15 text-[#10B981] rounded-3xl mx-auto flex items-center justify-center border-2 border-[#10B981]/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  Subscription Active
                </span>
                <h3 className="text-3xl font-black text-slate-900 mt-2">
                  Payment Complete & Pro Unlocked!
                </h3>
                <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                  Your payment was confirmed. You now have full unrestricted access to 1,000 monthly document audits and the Audit Trail.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-lg mx-auto text-left space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Plan Activated:</span>
                  <span className="font-bold text-slate-900">{paymentSuccessData.plan}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Total Paid:</span>
                  <span className="font-bold text-[#10B981] text-base">{format(paymentSuccessData.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800">{paymentSuccessData.transactionId}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">License Key:</span>
                  <span className="font-mono font-bold text-purple-700">{paymentSuccessData.licenseKey}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Audit Trail Event:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Recorded with SHA-256
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'audittrail' } }));
                  }}
                  className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Unlocked Audit Trail</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                    setTimeout(() => {
                      document.getElementById('document-auditor')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Launch FOR-AI Auditor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Column: Plan Selection & Summary */}
              <div className="lg:col-span-5 bg-slate-50 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] mb-2">Selected Plan Option</div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">Business White Label</h3>
                  <p className="text-xs text-slate-500 mb-5">AI Forensic Scanner & Firm White Label Suite</p>

                  {/* Plan Toggle Selector */}
                  <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-200/80 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setSelectedInterval('monthly')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedInterval === 'monthly'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Monthly {format(59, { hideDecimals: true })}/mo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInterval('yearly')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                        selectedInterval === 'yearly'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Yearly (Save 20%)</span>
                      <span className="absolute -top-2 right-1 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                        SAVE 20%
                      </span>
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600">Total Due Today</span>
                      <span className="text-2xl font-black text-slate-900">{formattedPrice}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full inline-block border border-purple-200">
                      {isYearly ? 'Billed Annually ($590/year)' : 'Billed Monthly ($59/month)'}
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Plan Entitlements:</div>
                    {[
                      '1,000 Document & Invoice Audits / Month',
                      'Full Access to Audit Trail with SHA-256 Logs',
                      'FOR-AI PhD Forensic AI Engine',
                      'Full White Label Portal & Custom Subdomain',
                      'Branded PDF Reports with Firm Header',
                      'Firm Client Directory & Staff Roles',
                      'Automatic Freemius License Key Delivery'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Protected by Freemius secure payment infrastructure.</span>
                </div>
              </div>

              {/* Right Column: Checkout Portal */}
              <div className="lg:col-span-7 p-6 lg:p-8 bg-white flex flex-col justify-center">
                {activeTab === 'checkout' ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-extrabold text-slate-900">Checkout with Freemius</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Secure Checkout</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-5">
                      You will be redirected to the secure Freemius checkout gateway to complete your payment. After payment, you will receive a license key to activate your Pro features.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Account / Billing Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="billing@yourfirm.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Primary Direct Payment Button */}
                      <div className="pt-4">
                        <a
                          href={userEmail ? defaultFreemiusUrl : '#'}
                          target={userEmail ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!userEmail) {
                              e.preventDefault();
                              alert('Please enter your billing email first.');
                            }
                          }}
                          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-500/25 transition-all text-sm flex items-center justify-center gap-2.5 cursor-pointer"
                        >
                          <Lock className="w-4 h-4 text-white" />
                          <span>Proceed to Freemius Secure Checkout</span>
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                      </div>

                      <div className="text-center space-y-1.5 pt-4">
                        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>14-Day 100% Money-Back Guarantee &bull; Cancel Anytime</span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-2">
                          By proceeding, you agree to our{' '}
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab: 'terms' } }));
                            }}
                            className="text-[#7C3AED] underline hover:text-[#5B21B6] font-medium cursor-pointer"
                          >
                            Terms & Conditions
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab: 'refund' } }));
                            }}
                            className="text-[#7C3AED] underline hover:text-[#5B21B6] font-medium cursor-pointer"
                          >
                            Refund Policy
                          </button>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Admin License Key Tab */
                  <div className="py-2">
                    <h4 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                      <Key className="w-5 h-5 text-purple-600" />
                      <span>Activate Freemius License (Admin)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mb-6">
                      Enter an official Freemius license key to manually verify and bind Pro access.
                    </p>

                    <form onSubmit={handleVerifyLicenseKey} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Freemius License Key</label>
                        <input
                          type="text"
                          required
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                          placeholder="e.g. FS-8A7B-9C0D-1E2F or 32-char key"
                          className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Registered Account Email</label>
                        <input
                          type="email"
                          required
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="billing@yourfirm.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                        />
                      </div>

                      {licenseError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{licenseError}</span>
                        </div>
                      )}

                      {licenseSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{licenseSuccess}</span>
                        </div>
                      )}

                      <div className="pt-3">
                        <button
                          type="submit"
                          disabled={licenseLoading}
                          className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-500/25 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {licenseLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Validating License...</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4 text-white" />
                              <span>Verify & Activate License</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
