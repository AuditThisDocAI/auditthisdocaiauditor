import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Palette, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Save, 
  Crown, 
  Eye, 
  ShieldCheck, 
  Lock, 
  FileText, 
  Download,
  Send,
  Server,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Monitor,
  Smartphone,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  Printer,
  ExternalLink,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { getActiveFirm, saveActiveFirm, exportAllFirmDataAsJson, FirmProfile } from '../lib/multiTenantDb';
import { generateBrandedReportWindow } from '../lib/pdfReportGenerator';
import { PaywallModal } from './PaywallModal';

export function FirmBrandingSettings() {
  const [firm, setFirm] = useState<FirmProfile>(getActiveFirm());
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'colors' | 'preview' | 'email' | 'domain' | 'export'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);

  // Access control state - White Label settings are strictly for paid subscribers after sign up
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  const checkAccess = () => {
    const authed = localStorage.getItem('audit-this-doc-cms-auth') === 'true';
    const email = (localStorage.getItem('audit-this-doc-user-email') || '').toLowerCase().trim();
    const isAdmin = email === 'brigittalombard09@gmail.com';
    const pro = localStorage.getItem('audit_this_doc_is_pro') === 'true' || isAdmin;

    setIsLoggedIn(authed);
    setIsPro(pro);
  };

  useEffect(() => {
    setFirm(getActiveFirm());
    checkAccess();
    window.addEventListener('admin-auth-changed', checkAccess);
    window.addEventListener('pro-status-changed', checkAccess);
    window.addEventListener('storage', checkAccess);
    return () => {
      window.removeEventListener('admin-auth-changed', checkAccess);
      window.removeEventListener('pro-status-changed', checkAccess);
      window.removeEventListener('storage', checkAccess);
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveActiveFirm(firm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendTestEmail = () => {
    setTestEmailSent(true);
    const subject = `Test Dispatch from ${firm.name}`;
    const body = `Hello,\n\nThis is a test notification email dispatched from ${firm.name} (${firm.senderName}).\n\nSupport Email: ${firm.supportEmail}\nWebsite: ${firm.website || 'N/A'}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(firm.senderEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    setTimeout(() => setTestEmailSent(false), 4000);
  };

  const handleRunSimScan = (docType: 'ledger' | 'invoices' | 'payroll') => {
    setCustomUploadedFile(null);
    setSimSampleDoc(docType);
    setSimScanState('scanning');
    setTimeout(() => setSimScanState('complete'), 800);
  };

  const processUploadedFile = (file: File) => {
    if (!file) return;
    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    setCustomUploadedFile({
      name: file.name,
      size: sizeFormatted,
      type: file.type || 'document'
    });

    setSimScanState('scanning');
    setTimeout(() => {
      setSimScanState('complete');
    }, 900);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handlePrintSampleReport = () => {
    const docName = customUploadedFile
      ? customUploadedFile.name
      : simSampleDoc === 'ledger' ? 'Q3_General_Ledger_2026.csv' : simSampleDoc === 'invoices' ? 'August_Vendor_Invoices.pdf' : 'Payroll_Reconciliation_2026.xlsx';

    generateBrandedReportWindow({
      documentName: docName,
      auditDate: new Date().toLocaleDateString(),
      riskScore: simSampleDoc === 'ledger' ? 78 : simSampleDoc === 'invoices' ? 92 : 35,
      riskLevel: simSampleDoc === 'ledger' ? 'Moderate' : simSampleDoc === 'invoices' ? 'High' : 'Low',
      clientName: 'Acme Enterprises (Client)',
      auditorName: firm.name,
      duplicatePayments: [
        { invoice: 'INV-9021', vendor: 'Global Supply Co', amount: 4850, date: '2026-08-01' },
        { invoice: 'INV-9021-DUP', vendor: 'Global Supply Co', amount: 4850, date: '2026-08-03' },
      ],
      roundNumberPayments: [
        { vendor: 'Capital Advisory LLC', amount: 25000, description: 'Consulting Retainer' },
      ],
      weekendPayments: [
        { date: '2026-08-08 (Saturday)', vendor: 'Apex Tech Transfer', amount: 14200 },
      ],
      executiveSummary: `This financial document (${docName}) was audited under ${firm.name}'s proprietary forensic compliance standards. Flagged duplicate payments, unverified weekend transfers, and round-number retainer transactions requiring firm review.`
    });
  };

  // Simulation controls state for live White Label preview
  const [simDevice, setSimDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [simSampleDoc, setSimSampleDoc] = useState<'ledger' | 'invoices' | 'payroll'>('ledger');
  const [simScanState, setSimScanState] = useState<'idle' | 'scanning' | 'complete'>('complete');

  // Real File Upload & Dropzone state for White Label Auditor simulation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customUploadedFile, setCustomUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const PRESET_PALETTES = [
    { name: 'Corporate Midnight', primary: '#0F172A', secondary: '#2563EB', bg: '#F8FAFC' },
    { name: 'Emerald Accounting', primary: '#064E3B', secondary: '#059669', bg: '#F0FDF4' },
    { name: 'Royal Onyx', primary: '#18181B', secondary: '#7C3AED', bg: '#FAFAFA' },
    { name: 'Deep Navy Gold', primary: '#1E3A8A', secondary: '#D97706', bg: '#F8FAFC' },
    { name: 'Crimson Risk Advisory', primary: '#7F1D1D', secondary: '#DC2626', bg: '#FEF2F2' },
  ];

  if (!isLoggedIn || !isPro) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl border-2 border-amber-200 p-8 sm:p-12 shadow-xl text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-6 shadow-md">
            <Crown className="w-8 h-8" />
          </div>

          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Paid Business Plan Required
          </span>

          <h2 className="text-3xl font-black text-slate-900 mt-4 tracking-tight">
            White Label Settings Unavailable on Free Tier
          </h2>

          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mt-3 leading-relaxed">
            Custom white label portal branding, custom domain configuration, firm logo watermarks, and white-labeled client PDF reports are available exclusively to paid subscribers who have signed up.
          </p>

          <div className="my-8 max-w-md mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Included in Paid Pro / Business:</div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Custom Logo, Brand Colors, and Custom Domain</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Firm Branded PDF Audit Certificates & Dispatches</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>White-Labeled Email Dispatches & Custom SMTP</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1,000 Monthly Document Forensic Audits</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isLoggedIn ? (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
                className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
              >
                Sign Up / Sign In
              </button>
            ) : (
              <button
                onClick={() => setShowPaywallModal(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Paid Pro
              </button>
            )}

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }))}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>

          <PaywallModal
            isOpen={showPaywallModal}
            onClose={() => setShowPaywallModal(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              White Label Accounting Firm Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Firm White Label & Branding Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Rebrand the entire forensic application, client portals, email dispatches, and PDF certificates with your firm's identity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportAllFirmDataAsJson(firm.id)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export All Firm Data
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savedSuccess ? 'Saved Changes!' : 'Save Branding Config'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Firm White Label branding saved! All client portals, PDFs, and navigation bars have been updated automatically.
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-6 text-sm font-bold text-slate-500">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'profile' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Firm Profile & Logo
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('colors')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'colors' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          Brand Colors & Theme
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('preview')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'preview' ? 'border-purple-600 text-purple-600 font-extrabold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4 text-amber-500" />
          White Label Preview
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('email')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'email' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          Outbound Emails & SMTP
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('domain')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'domain' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          Custom Domain & Portal
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('export')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'export' ? 'border-purple-600 text-purple-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4" />
          Data Ownership & Backup
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form / Simulation Canvas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB: White Label Auditor Preview */}
          {activeSubTab === 'preview' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" /> Interactive Simulation
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                    Client-Facing Document Auditor Preview
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This live preview shows exactly what your clients see when uploading ledgers or viewing audit findings under <strong>{firm.name || 'Your Firm'}</strong>'s custom domain.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSimDevice('desktop')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      simDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimDevice('mobile')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      simDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>
              </div>

              {/* Sample Document Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Simulate Document Scan:
                </span>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunSimScan('ledger')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      simSampleDoc === 'ledger'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Q3 General Ledger.csv
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunSimScan('invoices')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      simSampleDoc === 'invoices'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    August Vendor Invoices.pdf
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunSimScan('payroll')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      simSampleDoc === 'payroll'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Payroll Statement.xlsx
                  </button>
                </div>
              </div>

              {/* Simulated Client Browser Frame */}
              <div 
                className={`mx-auto transition-all duration-300 rounded-3xl border border-slate-300 shadow-xl overflow-hidden bg-white ${
                  simDevice === 'mobile' ? 'max-w-[380px]' : 'w-full'
                }`}
              >
                {/* Browser Address Bar */}
                <div className="bg-slate-800 text-slate-300 px-4 py-2.5 flex items-center justify-between text-xs font-mono border-b border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  </div>

                  <div className="bg-slate-900/90 text-slate-200 px-3 py-1 rounded-lg text-[11px] flex items-center gap-1.5 border border-slate-700 max-w-[280px] truncate">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      https://{firm.customDomain || 'audit.' + (firm.name ? firm.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'apexadvisory') + '.com'}
                    </span>
                  </div>

                  <span className="text-[10px] text-purple-400 font-sans font-bold">Client View</span>
                </div>

                {/* Branded Application Nav Header */}
                <div 
                  className="px-5 py-4 transition-colors flex items-center justify-between text-white"
                  style={{ backgroundColor: firm.primaryColor || '#0F172A' }}
                >
                  <div className="flex items-center gap-3">
                    {firm.logoUrl ? (
                      <img src={firm.logoUrl} alt={firm.name} className="h-8 max-w-[140px] object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-white/20 text-white font-extrabold flex items-center justify-center text-sm shadow-xs border border-white/20">
                        {(firm.name || 'F').charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="font-extrabold text-sm block leading-tight">
                        {firm.name || 'Accounting Firm Portal'}
                      </span>
                      <span className="text-[10px] text-white/80 block font-medium">
                        Forensic Document & Ledger Audit Desk
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <span 
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-xs"
                      style={{ backgroundColor: firm.secondaryColor || '#2563EB' }}
                    >
                      Client Portal
                    </span>
                  </div>
                </div>

                {/* Branded Auditor Canvas */}
                <div 
                  className="p-6 space-y-6 transition-colors"
                  style={{ backgroundColor: firm.backgroundColor || '#F8FAFC' }}
                >
                  {/* Hero Intro */}
                  <div className="text-center space-y-1.5 py-2">
                    <h4 className="text-lg font-extrabold text-slate-900">
                      Upload Financial Files for Forensic Audit
                    </h4>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto">
                      Analyzed under <strong>{firm.name || 'Your Firm'}</strong>'s compliance parameters. Zero third-party branding visible.
                    </p>
                  </div>

                  {/* Hidden Native File Input */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".csv,.xlsx,.xls,.pdf,.txt,.doc,.docx,image/*"
                    className="hidden"
                  />

                  {/* Drag-and-Drop Dropzone Simulation */}
                  <div 
                    className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 cursor-pointer hover:shadow-md ${
                      isDragging ? 'bg-purple-50/90 border-purple-600 scale-[1.01]' : 'bg-white'
                    }`}
                    style={{ borderColor: isDragging ? '#7C3AED' : firm.secondaryColor || '#2563EB' }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: firm.secondaryColor || '#2563EB' }}>
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <strong className="text-xs font-extrabold text-slate-900 block">
                        {isDragging ? 'Drop Financial File Here...' : 'Drag & Drop Ledgers, CSVs, or Invoices Here'}
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        Supports General Ledgers, Bank Statements, PDF Invoices & Payrolls
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: firm.primaryColor || '#0F172A' }}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Browse Files to Audit
                    </button>
                  </div>

                  {/* Scanning Animation State */}
                  {simScanState === 'scanning' ? (
                    <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                      <strong className="text-xs font-bold text-slate-800 block">
                        Auditing {customUploadedFile ? customUploadedFile.name : simSampleDoc === 'ledger' ? 'Q3 General Ledger.csv' : simSampleDoc === 'invoices' ? 'August Vendor Invoices.pdf' : 'Payroll Statement.xlsx'}...
                      </strong>
                      <span className="text-[11px] text-slate-400 block">
                        Running {firm.name} forensic anomaly detection algorithms...
                      </span>
                    </div>
                  ) : (
                    /* Audit Results Panel */
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                      {/* Audit Summary Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Document Audit Report
                          </span>
                          <strong className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <span>
                              {customUploadedFile 
                                ? `${customUploadedFile.name} (${customUploadedFile.size})`
                                : simSampleDoc === 'ledger' ? 'Q3_General_Ledger_2026.csv' : simSampleDoc === 'invoices' ? 'August_Vendor_Invoices.pdf' : 'Payroll_Reconciliation_2026.xlsx'}
                            </span>
                            {customUploadedFile && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Uploaded File
                              </span>
                            )}
                          </strong>
                        </div>

                        <span 
                          className={`px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto ${
                            customUploadedFile || simSampleDoc === 'invoices' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : simSampleDoc === 'ledger' 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          Risk Score: {customUploadedFile ? '84/100 (High Risk Anomalies Detected)' : simSampleDoc === 'ledger' ? '78/100 (Moderate)' : simSampleDoc === 'invoices' ? '92/100 (High Risk)' : '35/100 (Low Risk)'}
                        </span>
                      </div>

                      {/* Summary Box */}
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                        <strong>Auditor Summary:</strong> Audited under {firm.name}'s compliance framework. Flagged potential duplicate invoice payments, round-number retainer transfers, and weekend disbursements requiring client verification.
                      </p>

                      {/* Flagged Anomaly Items */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Flagged Forensic Items:
                        </span>

                        <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <div>
                              <strong className="text-red-950 font-bold block">Duplicate Invoice INV-9021</strong>
                              <span className="text-red-700 text-[10px]">Global Supply Co &bull; $4,850.00</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-red-200/80 text-red-900 px-2 py-0.5 rounded">Action Required</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <div>
                              <strong className="text-amber-950 font-bold block">Round-Number Retainer Payment</strong>
                              <span className="text-amber-800 text-[10px]">Capital Advisory LLC &bull; $25,000.00</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">Verify Purpose</span>
                        </div>
                      </div>

                      {/* PDF Report Generation Button */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400">
                          Certified PDF certificate generated with <strong>{firm.name}</strong> header.
                        </span>

                        <button
                          type="button"
                          onClick={handlePrintSampleReport}
                          className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Branded PDF Report
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer Branding Guarantee */}
                  <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                    &copy; {new Date().getFullYear()} {firm.name || 'Your Accounting Firm'}. All Rights Reserved. &bull; Contact: {firm.supportEmail || 'support@yourfirm.com'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Container for Settings Tabs */}
          {activeSubTab !== 'preview' && (
            <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              
              {/* TAB 1: Profile & Logo */}
              {activeSubTab === 'profile' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    1. Firm Identity & Public Credentials
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Accounting Firm Name *</label>
                      <input
                        type="text"
                        required
                        value={firm.name}
                        onChange={(e) => setFirm({ ...firm, name: e.target.value })}
                        placeholder="e.g. Apex Advisory & Accounting LLC"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Firm Website URL</label>
                      <input
                        type="url"
                        value={firm.website}
                        onChange={(e) => setFirm({ ...firm, website: e.target.value })}
                        placeholder="https://yourfirm.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Firm Logo Image URL</label>
                    <input
                      type="url"
                      value={firm.logoUrl}
                      onChange={(e) => setFirm({ ...firm, logoUrl: e.target.value })}
                      placeholder="https://yourfirm.com/assets/logo.png"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Transparent PNG or SVG recommended (high resolution, min 300px width).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Support & Audit Email *</label>
                      <input
                        type="email"
                        required
                        value={firm.supportEmail}
                        onChange={(e) => setFirm({ ...firm, supportEmail: e.target.value })}
                        placeholder="audits@yourfirm.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Support Phone Line</label>
                      <input
                        type="text"
                        value={firm.supportPhone || ''}
                        onChange={(e) => setFirm({ ...firm, supportPhone: e.target.value })}
                        placeholder="+1 (800) 555-0199"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Physical Office Address (Appears on PDF Certificates)</label>
                    <textarea
                      rows={2}
                      value={firm.address || ''}
                      onChange={(e) => setFirm({ ...firm, address: e.target.value })}
                      placeholder="100 Financial Plaza, Suite 400, New York, NY 10005"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Brand Colors */}
              {activeSubTab === 'colors' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    2. Dynamic Brand Palette & UI Theme
                  </h3>

                  <p className="text-xs text-slate-500">
                    Select a preset palette or enter your exact corporate hex codes. The application login, client portals, action buttons, and PDF reports will apply these colors dynamically.
                  </p>

                  {/* Preset Palettes */}
                  <div>
                    <span className="block text-xs font-bold text-slate-900 mb-2">Popular Firm Color Palettes</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PRESET_PALETTES.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFirm({
                            ...firm,
                            primaryColor: preset.primary,
                            secondaryColor: preset.secondary,
                            backgroundColor: preset.bg,
                          })}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between text-left"
                        >
                          <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.primary }} />
                            <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.secondary }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Primary Color (Headers & Navigation)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={firm.primaryColor}
                          onChange={(e) => setFirm({ ...firm, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={firm.primaryColor}
                          onChange={(e) => setFirm({ ...firm, primaryColor: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Secondary Color (Accents & Badges)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={firm.secondaryColor}
                          onChange={(e) => setFirm({ ...firm, secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={firm.secondaryColor}
                          onChange={(e) => setFirm({ ...firm, secondaryColor: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Background Tint (Canvas & Containers)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={firm.backgroundColor || '#F8FAFC'}
                          onChange={(e) => setFirm({ ...firm, backgroundColor: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                        />
                        <input
                          type="text"
                          value={firm.backgroundColor || '#F8FAFC'}
                          onChange={(e) => setFirm({ ...firm, backgroundColor: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Outbound Email & SMTP */}
              {activeSubTab === 'email' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-600" />
                    3. Outbound Email & Custom Sender Identity
                  </h3>

                  <p className="text-xs text-slate-500">
                    Ensure all client notification emails, audit reports, and login invites originate strictly under your firm's name and email address.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Email Sender Display Name *</label>
                      <input
                        type="text"
                        required
                        value={firm.senderName}
                        onChange={(e) => setFirm({ ...firm, senderName: e.target.value })}
                        placeholder="e.g. Apex Advisory Audit Desk"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Email Sender Address *</label>
                      <input
                        type="email"
                        required
                        value={firm.senderEmail}
                        onChange={(e) => setFirm({ ...firm, senderEmail: e.target.value })}
                        placeholder="notifications@yourfirm.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-purple-600" />
                      Custom Firm SMTP Relay (Optional)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={firm.smtpHost || ''}
                        onChange={(e) => setFirm({ ...firm, smtpHost: e.target.value })}
                        placeholder="smtp.yourfirm.com"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        value={firm.smtpPort || 587}
                        onChange={(e) => setFirm({ ...firm, smtpPort: parseInt(e.target.value, 10) || 587 })}
                        placeholder="587"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 flex items-center gap-2 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Test Email to {firm.senderEmail}
                    </button>

                    {testEmailSent && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Test dispatch verified!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Custom Domain */}
              {activeSubTab === 'domain' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    4. Custom Domain & Client Portal URL
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Firm Custom Subdomain / Domain</label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      <span className="pl-3.5 text-slate-400 font-mono text-xs">https://</span>
                      <input
                        type="text"
                        value={firm.customDomain || ''}
                        onChange={(e) => setFirm({ ...firm, customDomain: e.target.value })}
                        placeholder="audit.apexadvisory.com"
                        className="w-full px-2 py-2.5 bg-transparent font-mono text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Point your CNAME record to <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-600">ingress.forensicdocaudit.com</code>
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <strong className="block mb-0.5">Automated SSL Certificate & Data Isolation Active</strong>
                      Custom domains automatically provision wildcard SSL/TLS certificates and isolate all client session states to your firm ID (<code className="font-mono bg-emerald-100/80 px-1 rounded">{firm.id}</code>).
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Export & Data Ownership */}
              {activeSubTab === 'export' && (
                <div className="space-y-5">
                  <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Download className="w-5 h-5 text-purple-600" />
                    5. Firm Data Ownership & One-Click Backup
                  </h3>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      Data Ownership Guarantee
                    </span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      All client financial ledgers, fraud detection logs, staff records, and audit history uploaded by your accountants belong <strong>100% exclusively to {firm.name}</strong>.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <strong className="text-sm text-slate-900 block">Download Complete Firm Archive (.JSON)</strong>
                      <span className="text-xs text-slate-500">Includes all client profiles, staff records, audit logs, and usage histories.</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => exportAllFirmDataAsJson(firm.id)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 text-purple-400" />
                      Export Complete Data Package
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Firm ID: {firm.id}
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Branding Settings
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Multi-View Preview Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                Real-Time White Label Preview
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded-md">
                LIVE
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Preview how your client-facing header, navigation bar, and document reports render across all client devices.
            </p>

            {/* Launch Full Simulation Button */}
            <button
              type="button"
              onClick={() => setActiveSubTab('preview')}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-amber-300" />
              Open Interactive Auditor Simulation
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* 1. Header Card Preview */}
            <div className="p-4 rounded-2xl bg-white text-slate-900 shadow-lg space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                Portal Header Bar
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {firm.logoUrl ? (
                    <img src={firm.logoUrl} alt={firm.name} className="h-7 object-contain max-w-[120px]" />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-xl text-white font-black flex items-center justify-center text-xs shadow-sm"
                      style={{ backgroundColor: firm.primaryColor }}
                    >
                      {(firm.name || 'F').charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="font-extrabold text-xs block text-slate-900">
                      {firm.name || 'Accounting Firm'}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {firm.supportEmail}
                    </span>
                  </div>
                </div>

                <span 
                  className="px-2.5 py-1 rounded-full text-[9px] font-extrabold text-white shadow-xs"
                  style={{ backgroundColor: firm.secondaryColor }}
                >
                  Client Portal
                </span>
              </div>
            </div>

            {/* 2. PDF Certificate Footer Preview */}
            <div className="p-4 rounded-2xl bg-slate-800 text-slate-200 border border-slate-700 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-1">
                Exported PDF Footer
              </div>
              <div className="text-[11px] leading-tight">
                &copy; {new Date().getFullYear()} {firm.name}. Prepared & Certified by {firm.name}.
              </div>
              <div className="text-[9px] font-mono text-purple-300 pt-1">
                Outbound Email: {firm.senderName} &lt;{firm.senderEmail}&gt;
              </div>
            </div>

            <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-800/50 text-[11px] text-purple-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Zero third-party watermarks visible to clients.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

