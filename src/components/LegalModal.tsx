import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, FileText, RotateCcw, Lock, X, 
  CheckCircle2, AlertTriangle, Scale, Mail, HelpCircle, 
  Calendar, Building2, CreditCard, ChevronRight, Download
} from 'lucide-react';

export type LegalPolicyTab = 'terms' | 'refund' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalPolicyTab;
}

export function LegalModal({
  isOpen,
  onClose,
  initialTab = 'terms'
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalPolicyTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-[#0F172A] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-black text-lg shadow-md shadow-purple-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                  <span>Legal & Compliance Policies</span>
                  <span className="text-[11px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-md uppercase">
                    Official
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  ForensicDocAudit &bull; Powered by Freemius (Product ID: 33243)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Print or Save as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Policy</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 text-xs font-bold">
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'terms'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 text-purple-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Terms & Conditions (T&Cs)</span>
            </button>

            <button
              onClick={() => setActiveTab('refund')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'refund'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Refund & Cancellation Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'privacy'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Privacy & Security</span>
            </button>
          </div>

          {/* Policy Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed max-w-none">
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Effective Date: August 14, 2026 &bull; Version 2.4</span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">Terms and Conditions of Service</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Please read these terms carefully before accessing or using ForensicDocAudit and related services.
                  </p>
                </div>

                {/* Section 1 */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">1</span>
                    <span>Acceptance of Terms</span>
                  </h5>
                  <p>
                    By accessing, subscribing to, or using the <strong>ForensicDocAudit</strong> software, AI document analyzer, bookkeeping system, or firm client management tools, you agree to be bound by these Terms and Conditions ("Terms") and our Privacy and Refund Policies. If you do not agree to all terms, you may not access or use the platform.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">2</span>
                    <span>Scope of Forensic AI & Professional Disclaimer</span>
                  </h5>
                  <p>
                    ForensicDocAudit utilizes advanced machine learning, optical character recognition (OCR), and statistical anomaly algorithms (including the Dr. Aria AI Engine) to inspect documents, invoices, receipts, and ledger files.
                  </p>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Professional Judgment Notice ("Human-in-the-Loop"):</span>
                    </div>
                    <p>
                      ForensicDocAudit provides analytical tools and discrepancy flagging to assist qualified CPAs, forensic accountants, auditors, and business operators. The platform <strong>does not replace formal legal counsel, statutory audits, or certified forensic testimony</strong>. Users retain final responsibility for validating all flagged discrepancies and financial reporting before filing tax or court submissions.
                    </p>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">3</span>
                    <span>Subscriptions, Billing, & Freemius Merchant Gateway</span>
                  </h5>
                  <p>
                    Subscriptions are billed through our authorized global merchant of record, <strong>Freemius Inc.</strong> (Freemius Product ID: <code className="bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded font-mono text-xs">33243</code>).
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                    <li>
                      <strong>Monthly Subscription (Plan ID 61454)</strong>: Billed monthly at $59.00 USD (or local currency equivalent). Includes 1,000 document audits/month, AI engine, and white label portal.
                    </li>
                    <li>
                      <strong>Annual Subscription (Plan ID 61464)</strong>: Billed annually at $590.00 USD (saving 20%). Includes all Business White Label capabilities.
                    </li>
                    <li>
                      <strong>Automatic Renewal</strong>: Subscriptions renew automatically at the end of each billing cycle unless cancelled prior to the renewal date via the dashboard or Freemius receipt portal.
                    </li>
                  </ul>
                </div>

                {/* Section 4 */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">4</span>
                    <span>White Label & Intellectual Property Rights</span>
                  </h5>
                  <p>
                    Active subscribers to the Business White Label plan are granted a non-exclusive, worldwide license to customize client-facing portals, brand headers, color schemes, and export reports under their firm's registered trade name and logo. Users retain 100% full ownership over their proprietary client lists, bookkeeping records, and audit reports generated on the platform.
                  </p>
                </div>

                {/* Section 5 */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">5</span>
                    <span>Account Security & Fair Use</span>
                  </h5>
                  <p>
                    You are responsible for maintaining the confidentiality of your login credentials and license keys. You agree not to reverse-engineer, decompile, or misuse the AI API or exceed the monthly quota through unauthorized automated scripting.
                  </p>
                </div>

                {/* Section 6 */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">6</span>
                    <span>Limitation of Liability</span>
                  </h5>
                  <p className="text-xs text-slate-600">
                    To the maximum extent permitted by applicable law, ForensicDocAudit and its affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from third-party vendor errors, altered source documents, or missed anomalies in corrupted document files.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'refund' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Customer Protection &bull; 14-Day Money-Back Guarantee</span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">Refund & Cancellation Policy</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    We stand behind the quality of our forensic audit engine with clear, hassle-free refund and cancellation terms.
                  </p>
                </div>

                {/* Guarantee Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-sm">14-Day 100% Money-Back Guarantee</h5>
                    <p className="text-xs text-emerald-800 mt-1">
                      If ForensicDocAudit does not meet your firm's forensic accounting or invoice verification standards, you may request a full refund within 14 days of your initial subscription payment — no complicated questions asked.
                    </p>
                  </div>
                </div>

                {/* Refund Terms */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-900 text-base">Refund Eligibility & Terms</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="font-bold text-xs text-slate-900 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Eligible for Refund</span>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc">
                        <li>New monthly or annual subscriptions within 14 days of initial charge</li>
                        <li>Technical incompatibility or service unavailability</li>
                        <li>Accidental duplicate payments</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="font-bold text-xs text-slate-900 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Non-Refundable Circumstances</span>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc">
                        <li>Refund requests submitted after the 14-day guarantee period</li>
                        <li>Accounts terminated due to fraud or violation of Terms</li>
                        <li>Subsequent renewal periods where cancellation was not requested prior to billing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* How to Request a Refund */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-900 text-base">How to Request a Refund</h5>
                  <p className="text-xs text-slate-600">
                    To request a refund, follow any of these simple methods:
                  </p>
                  <ol className="space-y-2 text-xs text-slate-700 pl-5 list-decimal">
                    <li>
                      <strong>Direct Email</strong>: Send an email to <a href="mailto:support@forensicdocaudit.com" className="text-purple-600 font-bold underline">support@forensicdocaudit.com</a> or <a href="mailto:brigittalombard09@gmail.com" className="text-purple-600 font-bold underline">brigittalombard09@gmail.com</a> with your purchase email address or Freemius Order ID.
                    </li>
                    <li>
                      <strong>Freemius Portal</strong>: Click "Manage Subscription" directly from your email receipt issued by Freemius to submit a refund inquiry.
                    </li>
                    <li>
                      <strong>In-App Contact</strong>: Use the Contact Form on this site selecting "Billing / Refund Request".
                    </li>
                  </ol>
                </div>

                {/* Processing Timeline */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base">Processing & Payout Timeline</h5>
                  <p className="text-xs text-slate-600">
                    Once approved, refunds are initiated immediately through Freemius and typically appear on your credit card, debit card, or PayPal statement within <strong>3 to 5 business days</strong> depending on your banking institution.
                  </p>
                </div>

                {/* Cancellation Policy */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base">Cancellation Policy</h5>
                  <p className="text-xs text-slate-600">
                    You can cancel your subscription at any time with zero cancellation fees. When you cancel, your account will remain active with full Pro audit entitlements until the end of your current paid billing period, after which no further charges will occur.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Security First &bull; ISO & GDPR Standards</span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">Privacy & Data Security Policy</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    How we safeguard your firm's sensitive audit data, client lists, and uploaded financial records.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">AES-256 Encryption</div>
                    <p className="text-[11px] text-slate-500">Bank-grade encryption at rest and in transit via TLS 1.3.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">No Public AI Training</div>
                    <p className="text-[11px] text-slate-500">Your documents are NEVER used to train public foundation models.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">Isolated Firm Data</div>
                    <p className="text-[11px] text-slate-500">Client files and team audits are strictly sandboxed to your firm.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base">1. Document Processing & Confidentiality</h5>
                  <p className="text-xs text-slate-600">
                    Uploaded PDF documents, OCR image scans, and bookkeeping entries are processed in secure ephemeral memory to extract text and calculate forensic risk scores. Data is strictly processed for the audit requested by the user and is never shared with third-party advertising networks.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base">2. Payment Data Privacy</h5>
                  <p className="text-xs text-slate-600">
                    Payment information is securely tokenized and handled directly by <strong>Freemius</strong> in compliance with <strong>PCI-DSS Level 1</strong> standards. ForensicDocAudit servers do not store or capture full credit card numbers or banking security codes.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-base">3. Data Deletion & Right to be Forgotten</h5>
                  <p className="text-xs text-slate-600">
                    In compliance with GDPR and international data rights, users can export or permanently purge their audit logs, team members, and client records at any time from the account settings or by contacting our data protection officer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Questions? Contact us at:</span>
              <a href="mailto:support@forensicdocaudit.com" className="font-bold text-purple-600 hover:underline">
                support@forensicdocaudit.com
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close & Return
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
