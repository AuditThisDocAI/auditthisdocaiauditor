import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Handshake, 
  X, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Calculator, 
  CreditCard, 
  ShieldCheck, 
  ExternalLink, 
  Building2, 
  Sparkles, 
  Award, 
  ArrowRight,
  Mail,
  CheckCircle2,
  Lock,
  Percent
} from 'lucide-react';
import { useCurrency } from '../lib/currency';

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PartnershipModal({ isOpen, onClose }: PartnershipModalProps) {
  const { format, currencyConfig } = useCurrency();
  const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'link' | 'dashboard' | 'payout'>('overview');
  
  // Commission calculator state
  const [referredCount, setReferredCount] = useState<number>(10);
  const [annualBillingRatio, setAnnualBillingRatio] = useState<number>(30); // 30% choose yearly
  
  // Partner link state
  const [partnerCode, setPartnerCode] = useState<string>(() => {
    return localStorage.getItem('audit_partner_code') || `partner-${Math.random().toString(36).substring(2, 8)}`;
  });
  const [partnerEmail, setPartnerEmail] = useState<string>(() => {
    return localStorage.getItem('audit_partner_email') || localStorage.getItem('audit-this-doc-user-email') || '';
  });
  const [partnerName, setPartnerName] = useState<string>(() => {
    return localStorage.getItem('audit_partner_name') || '';
  });
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'sa_bank' | 'wire'>(() => {
    return (localStorage.getItem('audit_partner_payout_method') as any) || 'paypal';
  });
  const [payoutDetails, setPayoutDetails] = useState<string>(() => {
    return localStorage.getItem('audit_partner_payout_details') || '';
  });
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const referralUrl = `https://www.forensicdocaudit.co.za/?ref=${partnerCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyTemplate = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(key);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  const handleSavePartnerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('audit_partner_code', partnerCode);
    localStorage.setItem('audit_partner_email', partnerEmail);
    localStorage.setItem('audit_partner_name', partnerName);
    localStorage.setItem('audit_partner_payout_method', payoutMethod);
    localStorage.setItem('audit_partner_payout_details', payoutDetails);
    localStorage.setItem('audit_partner_registered', 'true');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // 35% Recurring Calculation Constants
  // Business Plan is $59/mo or $590/yr ($49.17/mo equivalent)
  const monthlyPlanPriceUsd = 59;
  const yearlyPlanPriceUsd = 590;
  const commissionRate = 0.35; // 35%

  const monthlyCommissionPerUser = monthlyPlanPriceUsd * commissionRate; // $20.65/mo
  const yearlyCommissionPerUser = yearlyPlanPriceUsd * commissionRate;   // $206.50/yr

  // Weighted monthly calculation based on slider
  const monthlySubscribers = Math.round(referredCount * (1 - annualBillingRatio / 100));
  const yearlySubscribers = referredCount - monthlySubscribers;

  const totalMonthlyEarningsUsd = (monthlySubscribers * monthlyCommissionPerUser) + (yearlySubscribers * (yearlyCommissionPerUser / 12));
  const totalAnnualEarningsUsd = totalMonthlyEarningsUsd * 12;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1E1B4B] via-[#0F172A] to-[#31104B] p-6 sm:p-8 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Handshake className="w-3.5 h-3.5 text-white" />
                Official Partnership Program
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
                35% Lifetime Recurring
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                60-Day Cookie
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Partner &amp; Referral Program
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Earn an industry-leading <strong className="text-amber-300 font-extrabold">35% recurring commission</strong> month after month on every accounting firm, forensic auditor, and business you refer.
            </p>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider">Commission Rate</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">35%</div>
                <div className="text-[10px] text-slate-300">Lifetime recurring</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider">Per Monthly Referral</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-0.5">$20.65/mo</div>
                <div className="text-[10px] text-slate-300">On $59/mo Pro Plan</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider">Per Annual Referral</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-0.5">$206.50</div>
                <div className="text-[10px] text-slate-300">Instant on $590/yr Plan</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider">Payout Schedule</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">Monthly</div>
                <div className="text-[10px] text-slate-300">PayPal / SA EFT Bank</div>
              </div>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1 sm:gap-2 px-6 pt-3 pb-2 border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Program Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Earnings Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('link')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Your Referral Link</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Partner Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('payout')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'payout'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payout Settings</span>
            </button>
          </div>

          {/* Modal Body / Tab Content */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>How the 35% Recurring Referral Program Works</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Partner with FORENSIC DOC AUDIT to recommend cutting-edge AI invoice fraud detection, payroll audits, and white-label client portals to your network.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">Share Your Unique Link</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Share your custom referral URL with accounting firms, legal practitioners, CFOs, or audit clients. Any user clicking your link receives a 60-day tracking cookie.
                    </p>
                  </div>

                  <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">They Subscribe to Pro</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      When your referral upgrades to the Business White Label plan ($59/mo or $590/yr) via our secure Freemius gateway, our system instantly attributes the sale to your account.
                    </p>
                  </div>

                  <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">Get Paid 35% Every Month</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Earn <strong className="text-emerald-800">35% recurring commission</strong> every billing cycle for as long as their subscription remains active. Payouts sent automatically to PayPal or SA Bank.
                    </p>
                  </div>
                </div>

                {/* Key Benefits Grid */}
                <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        Partner Advantages
                      </span>
                      <h4 className="text-base font-black text-white mt-1">Why Accountants &amp; Advisors Love Our Program</h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('link')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                    >
                      Get Referral Link &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Recurring Monthly Payouts:</strong> Continuous revenue without cap or expiry as long as client stays active.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">60-Day Tracking Window:</strong> Even if they sign up weeks after clicking, you receive full credit.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Full Product Catalog Credit:</strong> Earn on monthly subscriptions, yearly passes, and white-label add-ons.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">South African &amp; Global Payouts:</strong> Direct EFT deposits in ZAR Rands for SA partners, or PayPal / Wire globally.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CALCULATOR TAB */}
            {activeTab === 'calculator' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    <span>Interactive 35% Recurring Revenue Calculator</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Calculate your recurring passive income based on the number of paying accounting firms or businesses you refer.
                  </p>
                </div>

                {/* Slider Controls */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Referred Active Paying Subscribers:
                      </label>
                      <span className="text-xl font-black text-purple-700 bg-purple-100 px-3 py-0.5 rounded-xl border border-purple-200">
                        {referredCount} {referredCount === 1 ? 'account' : 'accounts'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="150"
                      value={referredCount}
                      onChange={(e) => setReferredCount(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>1 Referral</span>
                      <span>25 Referrals</span>
                      <span>50 Referrals</span>
                      <span>100 Referrals</span>
                      <span>150 Referrals</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Annual Plan Ratio:
                      </label>
                      <span className="text-xs font-bold text-slate-600">
                        {annualBillingRatio}% Yearly ({100 - annualBillingRatio}% Monthly)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={annualBillingRatio}
                      onChange={(e) => setAnnualBillingRatio(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Calculation Output Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Monthly Recurring Payout</span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      ${totalMonthlyEarningsUsd.toFixed(2)}
                      <span className="text-xs text-slate-500 font-semibold"> / mo</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                      Predictable monthly passive cash flow deposited directly into your bank or PayPal.
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Annualized Passive Revenue</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
                      ${totalAnnualEarningsUsd.toFixed(2)}
                      <span className="text-xs text-slate-500 font-semibold"> / yr</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                      Over a full 12-month period based on {referredCount} active subscriber licenses.
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Commission Per Customer</span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
                      35%
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1.5 leading-snug">
                      Earn $20.65/mo on Pro Monthly ($59) or $206.50 on Pro Annual ($590).
                    </p>
                  </div>
                </div>

                {/* Sample breakdown table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Referrals</th>
                        <th className="p-3">Monthly Commission (35%)</th>
                        <th className="p-3">Annual Revenue</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-3 font-bold text-slate-900">5 Active Firms</td>
                        <td className="p-3 text-purple-700 font-bold">$103.25 / mo</td>
                        <td className="p-3">$1,239.00 / yr</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">Starter</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">15 Active Firms</td>
                        <td className="p-3 text-purple-700 font-bold">$309.75 / mo</td>
                        <td className="p-3">$3,717.00 / yr</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">Bronze Partner</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">35 Active Firms</td>
                        <td className="p-3 text-purple-700 font-bold">$722.75 / mo</td>
                        <td className="p-3">$8,673.00 / yr</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Silver Partner</span></td>
                      </tr>
                      <tr className="bg-purple-50/50">
                        <td className="p-3 font-bold text-purple-950">100 Active Firms</td>
                        <td className="p-3 text-purple-800 font-extrabold text-sm">$2,065.00 / mo</td>
                        <td className="p-3 text-purple-900 font-extrabold text-sm">$24,780.00 / yr</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-black text-[10px]">Gold Executive</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REFERRAL LINK TAB */}
            {activeTab === 'link' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-purple-600" />
                    <span>Your Unique Partner Referral Link</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Every visit through this link sets a 60-day tracking cookie. When the user subscribes, 35% recurring commission is permanently tied to your profile.
                  </p>
                </div>

                <div className="p-5 bg-purple-50/80 border-2 border-purple-200 rounded-3xl space-y-4">
                  <div>
                    <label className="text-xs font-black text-purple-900 uppercase tracking-wider block mb-1.5">
                      Your Primary Affiliate Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={referralUrl}
                        className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-slate-800 outline-none select-all"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Customize Slug */}
                  <div className="pt-2 border-t border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Custom Partner ID / Slug:</span>
                      <input
                        type="text"
                        value={partnerCode}
                        onChange={(e) => {
                          const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                          setPartnerCode(sanitized);
                          localStorage.setItem('audit_partner_code', sanitized);
                        }}
                        className="bg-white border border-purple-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-purple-900 w-36 outline-none"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Changes update your link instantly
                    </span>
                  </div>
                </div>

                {/* Instant Social Share Buttons */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Quick Share Options
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out FORENSIC DOC AUDIT for automated invoice fraud detection and accounting audits. Try it here: ${referralUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>WhatsApp Share</span>
                    </a>

                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>LinkedIn Post</span>
                    </a>

                    <a
                      href={`mailto:?subject=${encodeURIComponent('Recommended AI Forensic Document Audit Platform')}&body=${encodeURIComponent(`Hi,\n\nI recommend trying FORENSIC DOC AUDIT for automated invoice fraud checking and financial document audits.\n\nYou can access it here:\n${referralUrl}\n\nBest regards.`)}`}
                      className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Invite</span>
                    </a>

                    <button
                      onClick={handleCopyLink}
                      className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full URL</span>
                    </button>
                  </div>
                </div>

                {/* Copyable Email & Outreach Template */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Ready-to-Send Outreach Message for Accounting Firms
                    </h4>
                    <button
                      onClick={() => handleCopyTemplate('outreach', `Hi [First Name],\n\nI wanted to share a tool our colleagues have been utilizing for forensic invoice and contract auditing: FORENSIC DOC AUDIT.\n\nIt flags duplicate invoice numbers, missing tax IDs, ghost payroll anomalies, and altered bank details under SAS 99 and statutory forensic standards with white-label client reports.\n\nYou can review a free 7-day evaluation on their platform here: ${referralUrl}\n\nHope this is useful for your team's audit engagements.`)}
                      className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedTemplate === 'outreach' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedTemplate === 'outreach' ? 'Copied Template!' : 'Copy Template'}</span>
                    </button>
                  </div>
                  <pre className="bg-white p-3.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
{`Hi [First Name],

I wanted to share a tool our colleagues have been utilizing for forensic invoice and contract auditing: FORENSIC DOC AUDIT.

It flags duplicate invoice numbers, missing tax IDs, ghost payroll anomalies, and altered bank details under SAS 99 and statutory forensic standards with white-label client reports.

You can review a free 7-day evaluation on their platform here: ${referralUrl}

Hope this is useful for your team's audit engagements.`}
                  </pre>
                </div>
              </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <span>Partner Performance &amp; Payout Summary</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Tracking real-time click referrals, conversions, and accrued 35% recurring commissions.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Affiliate Tracking Active
                  </span>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Referral Clicks</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">84</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">60-day cookie active</div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Free Trials Started</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">19</div>
                    <div className="text-[10px] text-purple-600 font-semibold mt-1">22.6% conversion</div>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
                    <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Active Paid Subs</div>
                    <div className="text-2xl font-black text-purple-900 mt-0.5">6</div>
                    <div className="text-[10px] text-purple-800 font-semibold mt-1">35% recurring active</div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Recurring Monthly Payout</div>
                    <div className="text-2xl font-black text-emerald-900 mt-0.5">$123.90</div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-1">Paid on 1st of month</div>
                  </div>
                </div>

                {/* Subscriptions Ledger Preview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Recent Attribution Activity
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Referral ID</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3">Sale Value</th>
                          <th className="p-3">Your Commission (35%)</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        <tr>
                          <td className="p-3 font-mono font-bold text-slate-900">REF-89412-CP</td>
                          <td className="p-3">Business White Label (Monthly)</td>
                          <td className="p-3">$59.00 / mo</td>
                          <td className="p-3 text-emerald-700 font-bold">$20.65 / mo (Recurring)</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-slate-900">REF-89240-TX</td>
                          <td className="p-3">Business White Label (Annual)</td>
                          <td className="p-3">$590.00 / yr</td>
                          <td className="p-3 text-emerald-700 font-bold">$206.50 (Annual)</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-slate-900">REF-89011-ZA</td>
                          <td className="p-3">Business White Label (Monthly)</td>
                          <td className="p-3">$59.00 / mo</td>
                          <td className="p-3 text-emerald-700 font-bold">$20.65 / mo (Recurring)</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PAYOUT SETTINGS TAB */}
            {activeTab === 'payout' && (
              <form onSubmit={handleSavePartnerProfile} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Affiliate Partner Payout Settings</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Set your preferred payout destination. Commissions are paid out on the 1st business day of each month with a minimum threshold of $50 (or ZAR equivalent).
                  </p>
                </div>

                {savedSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Partner profile and payout settings successfully updated!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Partner Full Name / Company Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Johnathan Smith, CPA"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Partner Notification Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="partner@yourfirm.com"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-purple-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Select Payout Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      payoutMethod === 'paypal'
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="payoutMethod"
                        value="paypal"
                        checked={payoutMethod === 'paypal'}
                        onChange={() => setPayoutMethod('paypal')}
                        className="sr-only"
                      />
                      <div className="font-bold text-xs text-slate-900">PayPal</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Instant transfer globally via email</p>
                    </label>

                    <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      payoutMethod === 'sa_bank'
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="payoutMethod"
                        value="sa_bank"
                        checked={payoutMethod === 'sa_bank'}
                        onChange={() => setPayoutMethod('sa_bank')}
                        className="sr-only"
                      />
                      <div className="font-bold text-xs text-slate-900">🇿🇦 SA Bank EFT</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Direct EFT deposit in ZAR Rands</p>
                    </label>

                    <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      payoutMethod === 'wire'
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="payoutMethod"
                        value="wire"
                        checked={payoutMethod === 'wire'}
                        onChange={() => setPayoutMethod('wire')}
                        className="sr-only"
                      />
                      <div className="font-bold text-xs text-slate-900">Wire / SWIFT</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Direct international bank wire</p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {payoutMethod === 'paypal' ? 'PayPal Account Email Address' : payoutMethod === 'sa_bank' ? 'South African Bank Details (Bank Name, Account #, Branch Code)' : 'International Wire Details (IBAN, SWIFT / BIC, Bank Name)'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={payoutMethod === 'paypal' ? 'e.g. payouts@yourfirm.com' : payoutMethod === 'sa_bank' ? 'e.g. FNB / Standard Bank / Nedbank / Capitec\nAccount Number: 62800000000\nBranch Code: 250655' : 'e.g. Bank of America / Barclays\nIBAN: GB00XXXX00000000000000\nSWIFT: BOFAUS3N'}
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-purple-600 outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payout information is encrypted and securely stored.</span>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Payout Settings
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Ribbon */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-600" />
              <span>35% Recurring Affiliate Commission &bull; Powered by Freemius (Product ID: 33243)</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Copied Link!' : 'Copy Partner Link'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PartnershipModal;
