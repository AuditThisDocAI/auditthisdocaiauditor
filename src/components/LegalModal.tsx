import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, FileText, RotateCcw, Lock, X, 
  CheckCircle2, AlertTriangle, Scale, Mail, HelpCircle, 
  Calendar, Building2, CreditCard, ChevronRight, Download,
  Award, Globe, BookOpen, ShieldAlert, Hash, ExternalLink, Check
} from 'lucide-react';

export type LegalPolicyTab = 'terms' | 'refund' | 'privacy' | 'popia' | 'lssa';

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
                  <span>Legal & Regulatory Compliance Policies</span>
                  <span className="text-[11px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-md uppercase">
                    POPIA &bull; LSSA
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  ForensicDocAudit &bull; South Africa (POPIA Act 4 of 2013 &amp; LSSA Legal Practice Standards)
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
              <span>Terms & Conditions</span>
            </button>

            <button
              onClick={() => setActiveTab('popia')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'popia'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 text-amber-800 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>POPIA (Act 4/2013) & PAIA Manual</span>
            </button>

            <button
              onClick={() => setActiveTab('lssa')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'lssa'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 text-indigo-800 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>LSSA & Legal Practice Standards</span>
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

            <button
              onClick={() => setActiveTab('refund')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'refund'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Refund Policy</span>
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
                    ForensicDocAudit utilizes advanced machine learning, optical character recognition (OCR), and statistical anomaly algorithms (including the Forensic AI Engine) to inspect documents, invoices, receipts, and ledger files.
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
                      <strong>Direct Email</strong>: Send an email to <a href="mailto:Auditthisdoc@zohomail.com" className="text-purple-600 font-bold underline">Auditthisdoc@zohomail.com</a> with your purchase email address or Freemius Order ID.
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
              </div>
            )}

            {/* POPIA (Act 4 of 2013) & PAIA Section 51 Compliance Panel */}
            {activeTab === 'popia' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1.5 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                      <Award className="w-3.5 h-3.5 text-amber-700" />
                      Statutory Republic of South Africa Compliance
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      POPIA (Act No. 4 of 2013) &bull; PAIA (Act No. 2 of 2000)
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">
                    Protection of Personal Information Act (POPIA) &amp; PAIA Manual
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Statutory data protection framework, Section 21 Operator Agreement, and lawful processing conditions for South African accounting, audit, and legal practices.
                  </p>
                </div>

                {/* Statutory Quick Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                      § 55
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">Information Officer</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Registered with the Information Regulator of South Africa (IRSA).
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-xs">
                      § 21
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">Operator Mandate</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Processes records strictly as an Operator for Responsible Parties.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-200 text-blue-900 flex items-center justify-center font-bold text-xs">
                      § 19
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">Security Safeguards</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      AES-256 at rest, TLS 1.3 in transit, and ephemeral memory OCR.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs">
                      § 22
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">Breach Protocol</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Statutory 72-hour notice protocol to IRSA &amp; affected data subjects.
                    </p>
                  </div>
                </div>

                {/* Section 1: Role Definitions */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">1</span>
                    <span>Operator vs. Responsible Party Distinction (Sections 20 &amp; 21 POPIA)</span>
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Under POPIA, when an accounting firm, auditing practice, or corporate entity uploads client invoices, employee registers, or tax documents to <strong>ForensicDocAudit</strong>, the customer operates as the <strong>Responsible Party</strong> (determining the purpose and means of processing). ForensicDocAudit acts exclusively as an <strong>Operator</strong> (processing personal information on behalf of and under the explicit mandate of the Responsible Party in terms of Section 21 of POPIA).
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                    <div className="font-bold text-slate-900">Statutory Operator Commitments:</div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>We process personal information solely with the knowledge and authorization of the Responsible Party.</li>
                      <li>We maintain strict statutory confidentiality and ensure staff/personnel are bound by confidentiality covenants.</li>
                      <li>We establish and maintain technical and organizational measures under Section 19 to safeguard integrity and confidentiality.</li>
                      <li>We notify the Responsible Party immediately if there are reasonable grounds to believe personal information has been accessed by an unauthorized person (Section 22).</li>
                    </ul>
                  </div>
                </div>

                {/* Section 2: 8 Conditions */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">2</span>
                    <span>The Eight (8) Statutory Conditions for Lawful Processing (Sections 8 - 25)</span>
                  </h5>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 1: Accountability (Section 8)</strong>
                      <span>The designated Information Officer ensures internal governance, statutory employee vetting, and compliance records.</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 2: Processing Limitation (Sections 9 - 12)</strong>
                      <span>Lawful processing with legitimate justification (fraud risk mitigation under Section 11(1)(f)), minimality of extracted financial fields, and direct intake from the Responsible Party.</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 3: Purpose Specification (Sections 13 - 14)</strong>
                      <span>Data is collected strictly for document discrepancy auditing, fraud detection, and litigation support. Files are purged upon user request or expiration of audit retention periods.</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 4: Further Processing Limitation (Section 15)</strong>
                      <span>Data processed is never repurposed for marketing, behavioral profiling, or public foundation model training.</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 5: Information Quality (Section 16)</strong>
                      <span>OCR extracts and anomaly calculations include confidence metrics and prompt human auditors for manual confirmation before report sign-off.</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 6: Openness (Sections 17 - 18) &amp; PAIA Section 51 Manual</strong>
                      <span>Detailed transparency regarding data categories, processing logic, and our PAIA Section 51 manual filed in accordance with the Promotion of Access to Information Act.</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 7: Security Safeguards (Sections 19 - 22)</strong>
                      <span>End-to-end TLS 1.3 in transit, AES-256 rest encryption, SHA-256 document hashing for chain-of-custody integrity, and statutory breach reporting.</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <strong className="text-slate-900 block mb-0.5">Condition 8: Data Subject Participation (Sections 23 - 25)</strong>
                      <span>Direct facility for data subjects to confirm records held, request correction (Form 2), or object to processing (Form 1).</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Special Personal Information */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">3</span>
                    <span>Processing of Special Personal Information &amp; Account Numbers (Sections 26 &amp; 105)</span>
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Financial audits often involve banking account details, South African Revenue Service (SARS) Tax/VAT identifiers, and litigation discovery documents. Processing of special personal information is strictly justified under <strong>Section 27(1)(b) of POPIA</strong> (necessary for the establishment, exercise, or defense of a right or obligation in law) and Section 32 (health/vital records for medical billing forensic verification).
                  </p>
                </div>

                {/* Section 4: Data Subject Rights & Information Officer */}
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="font-extrabold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-700" />
                    <span>Statutory Information Officer Contact Details (Section 51 PAIA &amp; Section 55 POPIA)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                    <div>
                      <strong>Designated Information Officer:</strong>
                      <div className="text-slate-600">Legal &amp; Compliance Directorate</div>
                      <div className="text-slate-600">ForensicDocAudit (Pty) Ltd</div>
                      <div className="font-medium text-amber-900 mt-1">Email: popia@forensicdocaudit.co.za</div>
                    </div>
                    <div>
                      <strong>Information Regulator of South Africa (IRSA):</strong>
                      <div className="text-slate-600">JD House, 27 Stiemens Street, Braamfontein</div>
                      <div className="text-slate-600">Johannesburg, 2001</div>
                      <div className="font-medium text-amber-900 mt-1">Complaints: complaints.IR@justice.gov.za</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LSSA (Law Society of South Africa) Legal Practice Standards Panel */}
            {activeTab === 'lssa' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1.5 bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-full border border-indigo-300">
                      <Scale className="w-3.5 h-3.5 text-indigo-700" />
                      Law Society of South Africa (LSSA) Standards
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Legal Practice Act (Act 28 of 2014) &bull; ECTA (Act 25 of 2002 § 15)
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">
                    LSSA Practice Guidelines &amp; Evidential Litigation Support
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Framework for legal practitioners, litigation support teams, and forensic accountants operating under South African High Court discovery and attorney-client privilege rules.
                  </p>
                </div>

                {/* LSSA Key Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-indigo-200 text-indigo-900 flex items-center justify-center font-bold text-xs">
                      LPP
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">Legal Privilege</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Common law Attorney-Client Privilege protection on litigation files.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs">
                      § 15
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">ECTA Admissibility</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Data message evidential weight verified via SHA-256 digital hashes.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-900 flex items-center justify-center font-bold text-xs">
                      R 35
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">High Court Rule 35</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Structured certificates prepared for Discovery &amp; Inspection schedules.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-200 text-blue-900 flex items-center justify-center font-bold text-xs">
                      R 54
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">LPC Rule 54 Trust</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Strict data isolation for attorney trust account and ledger records.
                    </p>
                  </div>
                </div>

                {/* Section 1: LPP & Confidentiality */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold">1</span>
                    <span>Protection of Legal Professional Privilege (LPP) &amp; Work Product</span>
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Under South African common law, communications between legal practitioners and their clients for the purpose of obtaining legal advice or in contemplation of litigation are privileged. ForensicDocAudit guarantees:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>
                      <strong>Zero Third-Party Inspection:</strong> Uploaded litigation documents, draft contracts, and expert briefing materials are encrypted in client-isolated tenants.
                    </li>
                    <li>
                      <strong>Non-Waiver Covenant:</strong> Processing of evidence through the Forensic AI engine does not constitute a waiver of legal privilege.
                    </li>
                    <li>
                      <strong>Privileged Header Markings:</strong> Reports generated in Attorney/Litigation mode automatically carry the statutory endorsement: <em>"CONFIDENTIAL &amp; SUBJECT TO LEGAL PROFESSIONAL PRIVILEGE (LPP) &bull; ATTORNEY WORK PRODUCT"</em>.
                    </li>
                  </ul>
                </div>

                {/* Section 2: ECTA Section 15 & Digital Evidence */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold">2</span>
                    <span>Evidential Weight &amp; Admissibility under ECTA (Act No. 25 of 2002)</span>
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    In terms of <strong>Section 15 of the Electronic Communications and Transactions Act (ECTA)</strong>, the rules of evidence must not be applied to deny the admissibility of a data message under South African law. ForensicDocAudit adheres to statutory evidential requirements:
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Cryptographic SHA-256 Hashing (§ 15(1)(a)):</strong> Every document processed receives a unique 256-bit client-side hash before transmission to verify that the integrity of the data message has remained intact.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Chain of Custody Timestamping (§ 15(1)(b)):</strong> Forensic event logs track the precise timestamp, user ID, and processing sequence in immutable audit logs.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Expert Witness Verification (§ 213 Criminal Procedure Act):</strong> Certificates are structured to support expert testimony in High Court, Commercial Crimes Court, and Specialised Commercial Crime Units (Hawks/DPCI).
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: High Court Uniform Rule 35 Discovery */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold">3</span>
                    <span>Uniform High Court Rule 35 (Discovery and Inspection of Documents)</span>
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Forensic audit outputs are cataloged with distinct engagement reference numbers, date stamps, and itemized discrepancy findings, enabling litigation teams to incorporate findings directly into <strong>First Schedule, Part 1</strong> (documents in possession to be produced) or <strong>First Schedule, Part 2</strong> (privileged documents) of High Court discovery notices.
                  </p>
                </div>

                {/* Section 4: LPA Rule 54 Trust Record Protection */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold">4</span>
                    <span>Legal Practice Act Rule 54 &amp; Trust Account Integrity</span>
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    For legal practitioners auditing trust payments, conveyancing balances, or Section 86 trust interest remittances, ForensicDocAudit enforces strict isolation of trust records from business operational expenses, preventing commingling in accordance with Legal Practice Council (LPC) accounting rules.
                  </p>
                </div>

                {/* LSSA Contact and Advisory Notice */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 space-y-1.5">
                  <div className="font-extrabold text-indigo-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-700" />
                    <span>LSSA Practitioner Inquiries &amp; Litigation Support Desk</span>
                  </div>
                  <p>
                    For litigation support, expert testimony certification, or specialized legal practitioner compliance inquiries in South Africa:
                  </p>
                  <div className="font-semibold text-indigo-800">
                    Email: legal@forensicdocaudit.co.za &bull; Telephone: +27 (0)11 555 0188
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Questions? Contact us at:</span>
              <a href="mailto:Auditthisdoc@zohomail.com" className="font-bold text-purple-600 hover:underline">
                Auditthisdoc@zohomail.com
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
