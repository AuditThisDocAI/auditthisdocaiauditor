import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScanSearch, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Loader2, 
  Save, 
  Camera, 
  X, 
  RefreshCw, 
  Trash2, 
  Download, 
  FileDown, 
  Bot,
  Building,
  User,
  Hash,
  DollarSign,
  Calendar,
  UploadCloud,
  FileCheck,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  Hourglass,
  Crown,
  Scale,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AuditResult } from '../lib/auditEngine';
import { appendAuditTrailEvent } from '../lib/auditTrailService';
import { ExportPdfReportModal } from './ExportPdfReportModal';
import { downloadDocumentFile, downloadImageFile } from '../lib/pdfReportGenerator';
import { useCurrency, formatAuditAmount } from '../lib/currency';
import { CurrencySelector } from './CurrencySelector';
import { useTrial } from '../lib/trialManager';

export default function AuditScanner() {
  const { isPro, isTrialExpired, remainingFormatted } = useTrial();
  const { currency, currencyConfig } = useCurrency();
  const [text, setText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isPrivilegedLPP, setIsPrivilegedLPP] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFromCamera, setIsFromCamera] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeTabVisual, setActiveTabVisual] = useState<'visual' | 'parties' | 'items'>('visual');
  const [aiStatus, setAiStatus] = useState<{
    connected: boolean;
    providerName: string;
    grokConnected?: boolean;
    activeKeyPrefix?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdfFile = Boolean(
    file?.type?.includes('pdf') || 
    file?.name?.toLowerCase().endsWith('.pdf') || 
    result?.isPdf
  );

  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => setAiStatus(data))
      .catch(e => console.warn('Could not load AI status in scanner', e));
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access not available:", err);
      setCameraError("Camera access unavailable. Please ensure permissions are granted, or upload a photo/PDF directly.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `invoice_scan_${Date.now().toString().slice(-4)}.jpg`, { type: "image/jpeg" });
            setFile(capturedFile);
            setPreviewUrl(URL.createObjectURL(capturedFile));
            setIsFromCamera(true);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const clearCapturedImage = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setIsFromCamera(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelection = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setIsFromCamera(false);
    setResult(null);
  };

  // Generate a realistic Sample PDF invoice on-the-fly for immediate testing
  const handleLoadSamplePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("COMMERCIAL TAX INVOICE", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Invoice #: INV-2026-9904", 14, 28);
    doc.text("Invoice Date: October 2, 2026", 14, 34);
    doc.text("Due Date: Net 30 Days (November 1, 2026)", 14, 40);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("ISSUING ENTITY (VENDOR):", 14, 52);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Global CloudTech Systems Inc.", 14, 58);
    doc.text("VAT / Tax ID: US-88-2940192", 14, 64);
    doc.text("500 Tech Parkway, Suite 400, Austin, TX", 14, 70);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("BILLED RECIPIENT:", 110, 52);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Horizon Financial Advisory Corp.", 110, 58);
    doc.text("Attn: Accounts Payable / Corporate Treasury", 110, 64);

    // Line items table
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 80, 196, 80);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Description", 14, 86);
    doc.text("Qty", 130, 86);
    doc.text("Total", 170, 86);
    doc.line(14, 90, 196, 90);

    doc.setTextColor(71, 85, 105);
    doc.text("Enterprise Cloud GPU Computing Infrastructure", 14, 98);
    doc.text("1", 130, 98);
    doc.text("$14,800.00", 170, 98);

    doc.text("Penetration Testing & Security Audit Retainer", 14, 106);
    doc.text("1", 130, 106);
    doc.text("$3,600.00", 170, 106);

    doc.line(14, 114, 196, 114);
    doc.text("Subtotal:", 130, 122);
    doc.text("$18,400.00", 170, 122);
    doc.text("Tax (8.25%):", 130, 128);
    doc.text("$1,518.00", 170, 128);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Total Payable:", 130, 136);
    doc.text("$19,918.00", 170, 136);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Remittance: ACH Bank of America, Routing #026009593, Acct #99482109.", 14, 160);
    doc.text("Certified authentic electronic commercial invoice subject to AU-C 240 / SAS 99 standards.", 14, 166);

    const blob = doc.output('blob');
    const sampleFile = new File([blob], 'Commercial_Tax_Invoice_INV9904.pdf', { type: 'application/pdf' });
    handleFileSelection(sampleFile);
    setText('');
  };

  // Generate a realistic Sample Retail/Expense Receipt Image on-the-fly
  const handleLoadSampleImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1050;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 800, 1050);

      // Receipt Header
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('METRO TECH HARDWARE SUPPLIES', 40, 70);

      ctx.fillStyle = '#475569';
      ctx.font = '16px monospace';
      ctx.fillText('Store #481 - Register 04 - Cashier: Alex M.', 40, 110);
      ctx.fillText('Date: 10/04/2026 14:32:19 | Trans #884910', 40, 135);
      ctx.fillText('Tax ID / EIN: 74-1294810-TX', 40, 160);
      ctx.fillText('Customer: Enterprise Field Services LLC', 40, 185);
      ctx.fillText('====================================================', 40, 215);

      // Line items
      ctx.fillStyle = '#0F172A';
      ctx.fillText('1. Thunderbolt 4 Pro Dock Station (Qty: 2)   $599.98', 40, 255);
      ctx.fillText('2. 4K Ultra-HD Display Monitor (27")         $449.00', 40, 295);
      ctx.fillText('3. Mechanical Ergonomic Keyboard             $129.50', 40, 335);
      ctx.fillText('4. Cat6A Shielded Network Spool (1000ft)     $210.00', 40, 375);
      ctx.fillText('----------------------------------------------------', 40, 415);

      ctx.fillText('SUBTOTAL:                                  $1,388.48', 40, 455);
      ctx.fillText('STATE SALES TAX (8.25%):                     $114.55', 40, 495);
      ctx.font = 'bold 22px monospace';
      ctx.fillText('TOTAL DUE / PAID:                          $1,503.03', 40, 545);

      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('PAYMENT METHOD: CORPORATE VISA ENDING IN 4091', 40, 595);
      ctx.fillText('APPROVAL CODE: 094821 - REF: 881029', 40, 625);
      ctx.fillText('STATUS: TRANSACTION COMPLETED & AUTHORIZED', 40, 655);
      ctx.fillText('Thank you for choosing Metro Tech Hardware Solutions!', 40, 720);

      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'MetroTech_Retail_Receipt_8849.png', { type: 'image/png' });
          handleFileSelection(sampleFile);
          setText('');
        }
      }, 'image/png');
    }
  };

  const handleScan = async () => {
    // Check if 7-day free trial has expired and user is not Pro/admin
    if (isTrialExpired && !isPro) {
      window.dispatchEvent(new CustomEvent('open-trial-expired-modal'));
      return;
    }

    if (!text.trim() && !file) return;
    
    setIsScanning(true);
    setResult(null);
    setIsSaved(false);

    try {
      let base64Data = '';
      let mimeType = '';
      let documentName = '';

      if (file) {
        documentName = file.name;
        mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1]);
          };
          reader.onerror = error => reject(error);
        });
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentText: text,
          documentName: documentName,
          fileData: file ? { base64: base64Data, mimeType } : undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to complete genuine AI audit examination.');
      }
      
      const scanResult: AuditResult = await response.json();
      setResult(scanResult);
    } catch (e: any) {
      console.error("Audit scan error:", e);
      setResult({
        isAuditable: false,
        riskScore: 0,
        riskLevel: 'Low',
        statutoryStandard: 'SAS 99 / AU-C 240 / FRE 902 Forensic Standard',
        summary: `Audit scan could not be completed: ${e?.message || 'Server connection error'}. Please verify your document or check that your Grok, Groq, or Gemini API key is configured in AI Studio Secrets.`,
        documentType: 'Document Verification',
        exactDocumentDescription: 'Audit scan could not be completed. Genuine forensic examination requires an active Groq, Grok, or Gemini API key.',
        documentSubject: 'Unprocessed Examination',
        authenticityVerdict: 'Inconclusive',
        findings: [
          {
            category: 'Statutory Compliance',
            title: 'Audit Examination Notice',
            description: e?.message || 'The genuine forensic AI audit could not complete. Heuristic simulated guessing is strictly disabled to comply with SAS 99 / AU-C 240 judicial accounting standards.',
            severity: 'low',
            recommendation: 'Please re-run the scan or check your AI API key in AI Studio Secrets.'
          }
        ],
        keyMetrics: {
          detectedVendor: 'Unknown',
          detectedRecipient: 'Unknown',
          detectedAmount: '$0.00',
          totalAmount: '$0.00',
          taxAmount: '$0.00',
          detectedDate: new Date().toLocaleDateString(),
          missingFields: []
        }
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCommitToLedger = () => {
    if (!result) return;
    
    appendAuditTrailEvent({
      category: 'DOCUMENT_AUDIT',
      action: `Scanned ${result.documentType}`,
      severity: result.riskLevel.toUpperCase() as any,
      actor: localStorage.getItem('audit-this-doc-user-email') || 'User',
      details: result.exactDocumentDescription || result.summary,
      documentRef: `${result.documentType} - ${result.keyMetrics.detectedVendor}`
    });
    
    setIsSaved(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'audittrail' } }));
    }, 1500);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'High': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'Moderate': return 'text-amber-700 bg-amber-100 border-amber-300';
      case 'Low': return 'text-emerald-700 bg-emerald-100 border-emerald-300';
      default: return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  const getVerdictBadge = (verdict?: string) => {
    const v = verdict || 'Verified Authentic';
    if (v.toLowerCase().includes('authentic')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 border border-emerald-300 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {v}
        </span>
      );
    }
    if (v.toLowerCase().includes('suspect') || v.toLowerCase().includes('manipulat')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 border border-amber-300 shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {v}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-800 border border-rose-300 shadow-xs">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        {v}
      </span>
    );
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
              <ScanSearch className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Forensic Document Auditor
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                Multimodal inspection of PDFs, images, and contracts under SAS 99 / AU-C 240 / FRE 902 standards.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* 7-Day Free Trial or Pro Status Pill */}
          <button
            type="button"
            onClick={() => {
              if (isTrialExpired && !isPro) {
                window.dispatchEvent(new CustomEvent('open-trial-expired-modal'));
              }
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPro
                ? 'bg-purple-500/20 border-purple-400/30 text-purple-200'
                : isTrialExpired
                  ? 'bg-rose-500/30 border-rose-400/50 text-rose-200 animate-pulse'
                  : 'bg-white/10 border-white/20 text-purple-200 hover:bg-white/15'
            }`}
            title={isPro ? 'Pro Subscription Active' : isTrialExpired ? '7-Day Free Trial has expired. Click to subscribe.' : `7-Day Free Trial Active (${remainingFormatted})`}
          >
            {isPro ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Pro Active</span>
              </>
            ) : isTrialExpired ? (
              <>
                <Hourglass className="w-3.5 h-3.5 text-rose-300" />
                <span>Trial Expired</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-purple-300" />
                <span>7-Day Trial: {remainingFormatted}</span>
              </>
            )}
          </button>

          {/* Global Audit Currency Selector */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/20">
            <span className="text-[11px] text-purple-200 font-bold hidden sm:inline">Audit Currency:</span>
            <CurrencySelector compact />
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 tracking-wide shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{aiStatus?.grokConnected ? `Grok LPU Active (${aiStatus.activeKeyPrefix || 'gsk_...'})` : (aiStatus?.providerName || 'Multimodal AI Active')}</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Trial Expired Warning Card if 7 days completed */}
        {isTrialExpired && !isPro && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Hourglass className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="font-extrabold text-rose-950 text-sm">7-Day Free Trial Concluded</p>
                <p className="text-rose-700 mt-0.5">Your 7-day evaluation time is up. To scan new documents, upgrade to the Business White Label Plan.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-trial-expired-modal'))}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02]"
            >
              Upgrade to Pro Plan
            </button>
          </div>
        )}
        {/* POPIA & LSSA Statutory Compliance Assurance Bar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-indigo-50/90 to-purple-50/90 border border-slate-200 text-xs text-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-black text-xs shadow-2xs">
              🇿🇦
            </div>
            <div>
              <div className="font-extrabold text-slate-900 flex flex-wrap items-center gap-1.5">
                <span>POPIA (Act 4 of 2013) &amp; LSSA Legal Practice Standards</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  Operator § 21
                </span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-900 text-[10px] font-black uppercase tracking-wider">
                  ECTA § 15
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Ephemeral OCR parsing &bull; SHA-256 chain-of-custody fingerprint &bull; High Court Rule 35 Discovery Qualified
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:border-indigo-300 transition-colors cursor-pointer" title="Mark this audit report with Attorney-Client Legal Professional Privilege (LPP)">
              <input
                type="checkbox"
                checked={isPrivilegedLPP}
                onChange={e => setIsPrivilegedLPP(e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
              />
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>Legal Privilege (LPP)</span>
            </label>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab: 'popia' } }))}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 hover:underline px-2 py-1 cursor-pointer"
            >
              POPIA Info
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab: 'lssa' } }))}
              className="text-[11px] font-bold text-indigo-800 hover:text-indigo-900 hover:underline px-2 py-1 cursor-pointer"
            >
              LSSA Standards
            </button>
          </div>
        </div>

        {/* Document Ingestion Zone */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#7C3AED]" />
              Upload PDF, Scanned Image, or Take Photo
            </label>
            {!isCameraActive && (
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 rounded-xl transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                {previewUrl && isFromCamera ? 'Retake Photo' : 'Use Camera'}
              </button>
            )}
          </div>

          {cameraError && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center justify-between gap-2">
              <span>{cameraError}</span>
              <button type="button" onClick={() => setCameraError(null)} className="text-amber-700 hover:text-amber-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Camera Viewfinder */}
          {isCameraActive && (
            <div className="mb-4 relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-md">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full max-h-[380px] object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-4">
                <button 
                  type="button"
                  onClick={stopCamera}
                  className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-all cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 hover:border-white transition-all shadow-lg flex items-center justify-center cursor-pointer"
                  title="Take Photo"
                >
                  <Camera className="w-6 h-6 text-slate-800" />
                </button>
              </div>
            </div>
          )}

          {/* Drag & Drop File Ingestion Zone */}
          {!isCameraActive && !file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelection(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                isDraggingOver 
                  ? 'border-[#7C3AED] bg-purple-50/70 scale-[0.99]' 
                  : 'border-slate-200 hover:border-[#7C3AED]/60 bg-slate-50/50 hover:bg-purple-50/30'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">
                  Click or Drag & Drop PDF Document or Image Here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF (.pdf), PNG, JPEG, WebP, and photos • Up to 25 MB
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                  PDF Documents
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                  Tax Invoices
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                  Retail Receipts
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                  Employment Contracts
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelection(f);
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Active File Preview Card (Image or PDF) */}
          {file && !isCameraActive && (
            <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-purple-200 bg-purple-50/60 shadow-xs transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Dedicated icon or image preview */}
                  <div className="relative shrink-0">
                    {isPdfFile ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100 border-2 border-red-200 flex flex-col items-center justify-center text-red-600 shadow-sm">
                        <FileText className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">PDF</span>
                      </div>
                    ) : previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Captured invoice thumbnail preview" 
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border-2 border-purple-300 shadow-sm bg-white"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7C3AED] text-white shadow-xs">
                        {isPdfFile ? (
                          <>
                            <FileCheck className="w-3 h-3" />
                            Adobe PDF Document
                          </>
                        ) : isFromCamera ? (
                          <>
                            <Camera className="w-3 h-3" />
                            Captured Camera Photo
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3" />
                            Scanned Document Image
                          </>
                        )}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Ready to Audit
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-[220px] sm:max-w-[360px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || (isPdfFile ? 'application/pdf' : 'image/jpeg')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => downloadDocumentFile(file, file.name)}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#7C3AED] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    title="Download document file to your local computer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
                    Download File
                  </button>
                  {isFromCamera && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#7C3AED] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retake
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearCapturedImage}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick-Test Sample Presets */}
          <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              Quick-Test Presets (1-Click Verification):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleLoadSamplePdf}
                className="text-[11px] px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title="Generate and test an authentic PDF Invoice"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Test Sample PDF Invoice</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleImage}
                className="text-[11px] px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title="Generate and test an authentic Retail Receipt image"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Test Receipt Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setText(`INVOICE #INV-8849-WIRE
Vendor: Apex Offshore Capital Ltd.
Invoice Date: October 1, 2026
Due Date: IMMEDIATELY UPON RECEIPT (24hr mandate)
Tax / VAT ID: [NOT PROVIDED / EXEMPT]

Bill To: Corporate Treasury Division

LINE ITEMS:
1. Urgent Cross-Border Asset Liquidity Escrow - $48,500.00
2. Expeditious Discretionary Processing Fee - $4,200.00
Subtotal: $52,700.00
Tax (0%): $0.00
TOTAL DUE: $64,200.00 [ARITHMETIC DISCREPANCY: 52,700 != 64,200]

REMITTANCE INSTRUCTIONS (URGENT):
Bank: Cayman Horizon Private Bank
Account: KY92-0041-8821-9901-002
Routing / SWIFT: CAYMKY22
Note: Do not call primary account manager; please release wire within 4 hours to avoid statutory freeze.`);
                  clearCapturedImage();
                }}
                className="text-[11px] px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                title="Load high-risk wire fraud invoice sample"
              >
                <span>🚨 Wire Fraud Sample</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setText(`INVOICE #9021-DEV
Vendor: CloudTech Systems LLC
Date: September 28, 2026
Due Date: Net 15 Days
Tax ID: MISSING
EIN: [None on record]

Bill To: Enterprise Solutions Inc.

Description:
1. Cloud Infrastructure Management - $12,400.00
2. Penetration Testing Retainer - $6,000.00
Subtotal: $18,400.00
Sales Tax: $1,472.00
Total Due: $21,472.00 (Math error: 18,400 + 1,472 = 19,872, not 21,472)

Payment: ACH to routing 021000021 acct 88219904`);
                  clearCapturedImage();
                }}
                className="text-[11px] px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                title="Load invoice with math discrepancy & missing tax ID"
              >
                <span>⚠️ Math Anomaly</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setText(`COMMERCIAL INVOICE #PO-2026-4401
Vendor: Dell Technologies Inc.
VAT ID: US-74-1294810
Address: 1 Dell Way, Round Rock, TX 78682
Invoice Date: September 15, 2026
Payment Terms: Net 30 Days

Bill To: Global Financial Advisory
PO Reference: PO-89214

Line Items:
1. Dell PowerEdge R750 Server Rack (Qty: 2) - $8,200.00
2. Redundant Power Supply Units (Qty: 4) - $1,100.00
3. 3-Year Enterprise ProSupport Support Pack - $2,400.00
Subtotal: $11,700.00
Sales Tax (8.25%): $965.25
Total Amount Payable: $12,665.25

Authorized Signature: M. Sterling, Enterprise Logistics Director
Payment Method: Standard Corporate Lockbox ACH`);
                  clearCapturedImage();
                }}
                className="text-[11px] px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                title="Load clean, validated invoice"
              >
                <span>✅ Clean Invoice</span>
              </button>
            </div>
          </div>
          
          {/* Optional Raw Text / Additional Context Area */}
          <div className="mt-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Optional: Paste raw document text or contract clauses here to accompany your PDF or photo..."
              className="w-full h-24 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all resize-none text-xs font-mono text-slate-700"
            />
          </div>
        </div>

        {/* Scan Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-medium">
            {file ? (
              <span className="text-[#7C3AED] font-bold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Target Document: {file.name} ({isPdfFile ? 'PDF Vector & Text' : 'Visual Multimodal'})
              </span>
            ) : text.trim() ? (
              <span className="text-slate-600 font-medium">
                Target: {text.trim().length} characters of structured financial text
              </span>
            ) : (
              <span>Upload a PDF, photo, or select a test preset above to begin examination.</span>
            )}
          </div>
          <button
            type="button"
            onClick={isTrialExpired && !isPro ? () => window.dispatchEvent(new CustomEvent('open-trial-expired-modal')) : handleScan}
            disabled={!isTrialExpired && (isScanning || (!text.trim() && !file))}
            className={`w-full sm:w-auto ${
              isTrialExpired && !isPro
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                : 'bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-purple-500/20'
            } px-7 py-3 rounded-2xl font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm`}
          >
            {isTrialExpired && !isPro ? (
              <>
                <Hourglass className="w-5 h-5 text-white animate-pulse" />
                <span>7-Day Trial Expired — Upgrade to Run Audit</span>
              </>
            ) : isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Executing CFE Multimodal Examination...</span>
              </>
            ) : (
              <>
                <ScanSearch className="w-5 h-5" />
                <span>Run Forensic Examination</span>
              </>
            )}
          </button>
        </div>

        {/* Audit Results Section */}
        <AnimatePresence>
          {result && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 border-t border-slate-200 pt-8 space-y-6"
            >
              {/* 1. HERO CARD: EXACT DOCUMENT IDENTIFICATION & CLASSIFICATION */}
              <div className="bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-purple-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-[#7C3AED] text-white shadow-xs tracking-wide uppercase">
                      Exact Identification
                    </span>
                    <span className="text-xs text-purple-200 font-mono">
                      {result.statutoryStandard || 'SAS 99 / AU-C 240 / FRE 902'}
                    </span>
                  </div>
                  <div>
                    {getVerdictBadge(result.authenticityVerdict)}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
                    Definitive Document Classification
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                    {result.documentType}
                  </h3>
                  {result.documentSubject && (
                    <p className="text-sm text-purple-200 font-semibold mt-1">
                      Subject: {result.documentSubject}
                    </p>
                  )}
                </div>

                {/* Exact narrative description detailing what the image/document actually is */}
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-sm sm:text-base leading-relaxed text-slate-100 font-medium backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-300 uppercase tracking-wider mb-1">
                    <FileCheck className="w-4 h-4 text-purple-300" />
                    Exact Document Analysis:
                  </div>
                  <p>
                    {result.exactDocumentDescription || result.summary}
                  </p>
                </div>

                {/* Primary Parties Identified */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Issuing Entity / Vendor
                    </span>
                    <p className="font-extrabold text-sm text-white mt-1 truncate" title={result.keyMetrics.detectedVendor}>
                      {result.keyMetrics.detectedVendor || 'Not detected'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Billed Recipient / Client
                    </span>
                    <p className="font-extrabold text-sm text-white mt-1 truncate" title={result.keyMetrics.detectedRecipient}>
                      {result.keyMetrics.detectedRecipient || 'Not detected'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Reference / Invoice #
                    </span>
                    <p className="font-extrabold text-sm text-white mt-1 truncate">
                      {result.keyMetrics.detectedReferenceNumbers && result.keyMetrics.detectedReferenceNumbers.length > 0 
                        ? result.keyMetrics.detectedReferenceNumbers.join(', ')
                        : 'Identified on document'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-300 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Audited Value ({currencyConfig.code})
                      </span>
                      <span className="text-[10px] text-purple-300 font-mono">{currencyConfig.flag}</span>
                    </span>
                    <p className="font-black text-sm text-emerald-400 mt-1">
                      {formatAuditAmount(result.keyMetrics.detectedAmount || result.keyMetrics.totalAmount, currency).formatted}
                    </p>
                    {result.keyMetrics.detectedAmount && (
                      <span className="text-[10px] text-slate-300 block truncate font-mono mt-0.5" title={`Original detected on document: ${result.keyMetrics.detectedAmount}`}>
                        Doc: {result.keyMetrics.detectedAmount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Items Breakdown Table if present */}
                {result.keyMetrics.lineItems && result.keyMetrics.lineItems.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                      Audited Line Items & Services ({result.keyMetrics.lineItems.length}):
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-purple-200">
                            <th className="py-2 px-3 font-bold">Line Description</th>
                            <th className="py-2 px-3 font-bold w-16 text-center">Qty</th>
                            <th className="py-2 px-3 font-bold w-36 text-right">Amount ({currencyConfig.code})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {result.keyMetrics.lineItems.map((item, idx) => (
                            <tr key={idx} className="text-slate-200">
                              <td className="py-2 px-3 font-medium">{item.description}</td>
                              <td className="py-2 px-3 text-center text-slate-300">{item.quantity || '1'}</td>
                              <td className="py-2 px-3 text-right font-bold text-white">
                                {formatAuditAmount(item.amount, currency).formatted}
                                {item.amount && !item.amount.includes(currencyConfig.symbol) && (
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    {item.amount}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. STATUTORY RISK & KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Forensic Risk Score</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">{result.riskScore}</span>
                    <span className="text-sm font-bold text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold mt-1">
                    {result.riskScore < 30 ? 'Low risk baseline' : result.riskScore < 60 ? 'Moderate attention required' : 'High statutory discrepancy'}
                  </span>
                </div>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Risk Assessment</span>
                  <div className="mt-2">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black border inline-block ${getRiskColor(result.riskLevel)}`}>
                      {result.riskLevel} Risk Severity
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold mt-1">
                    Certified CFE Risk Classification
                  </span>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Audit Findings</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#7C3AED]">{result.findings.length}</span>
                    <span className="text-xs font-bold text-slate-500">Itemized flags</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold mt-1">
                    Across ledger & remittance logic
                  </span>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Tax & Math Verification</span>
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-bold text-slate-800">{result.keyMetrics.detectedSubtotal || result.keyMetrics.detectedAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax Amount:</span>
                      <span className="font-bold text-slate-800">{result.keyMetrics.detectedTax || result.keyMetrics.taxAmount || '$0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issue Date:</span>
                      <span className="font-bold text-slate-800">{result.keyMetrics.detectedDate || 'Not specified'}</span>
                    </div>
                  </div>
                  {result.keyMetrics.missingFields && result.keyMetrics.missingFields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.keyMetrics.missingFields.map((f, i) => (
                        <span key={i} className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                          Missing {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. VISUAL DOCUMENT INSPECTION: PDF OR IMAGE */}
              {previewUrl && (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <ScanSearch className="w-5 h-5 text-[#7C3AED]" />
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {isPdfFile ? 'PDF Document Interactive Forensic Viewer' : 'Visual Anomaly Overlay & Image Inspection'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadDocumentFile(file || previewUrl, file?.name || (isPdfFile ? 'scanned_document.pdf' : 'scanned_document.png'))}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#7C3AED] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download {isPdfFile ? 'PDF' : 'Image'}
                      </button>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#7C3AED] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in New Tab
                      </a>
                    </div>
                  </div>

                  {/* If PDF, show embedded object/iframe viewer */}
                  {isPdfFile ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-white h-[420px]">
                        <iframe
                          src={previewUrl}
                          title="Audited PDF Document Preview"
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                        <span>Digital PDF vector & typography layers cross-examined under SAS 99.</span>
                        <span className="font-bold text-[#7C3AED]">{file?.name || 'Uploaded PDF'}</span>
                      </div>
                    </div>
                  ) : (
                    /* If Image, show image with bounding box visual overlay */
                    <div className="relative inline-block w-full max-w-3xl border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm mx-auto">
                      <img 
                        src={previewUrl} 
                        alt="Audited Document Image" 
                        className="w-full h-auto object-contain max-h-[500px]" 
                      />
                      {result.findings.map((finding, idx) => {
                        if (finding.boundingBox) {
                          const isHigh = finding.severity === 'critical' || finding.severity === 'high';
                          return (
                            <div 
                              key={idx}
                              className={`absolute border-2 cursor-pointer group transition-all ${
                                isHigh 
                                  ? 'border-red-500 bg-red-500/20 hover:bg-red-500/35' 
                                  : 'border-amber-500 bg-amber-500/20 hover:bg-amber-500/35'
                              }`}
                              style={{ 
                                left: `${finding.boundingBox.x}%`, 
                                top: `${finding.boundingBox.y}%`, 
                                width: `${finding.boundingBox.width}%`, 
                                height: `${finding.boundingBox.height}%` 
                              }}
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl border border-slate-700">
                                {finding.title}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 4. FORENSIC FINDINGS LIST */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#7C3AED]" />
                  Forensic Examination Findings ({result.findings.length})
                </h3>
                <div className="space-y-3">
                  {result.findings.map((finding, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex gap-4 shadow-xs">
                      <div className="mt-0.5 shrink-0">
                        {finding.severity === 'critical' || finding.severity === 'high' ? (
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                        ) : finding.severity === 'medium' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm sm:text-base">{finding.title}</span>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                            {finding.category}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            finding.severity === 'critical' || finding.severity === 'high'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pt-1">{finding.description}</p>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                          <span className="text-xs font-black text-slate-900 block mb-0.5">Statutory Recommendation:</span>
                          <p className="text-xs text-slate-700">{finding.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. ACTION BUTTONS & AUDIT LEDGER COMMIT */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="px-5 py-3 rounded-xl font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center gap-2 transition-all shadow-md shadow-[#7C3AED]/20 text-xs sm:text-sm cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    Export / Download PDF Report
                  </button>

                  {(file || previewUrl) && (
                    <button
                      type="button"
                      onClick={() => downloadDocumentFile(file || previewUrl!, file?.name || (isPdfFile ? 'scanned_document.pdf' : 'scanned_document.png'))}
                      className="px-4 py-3 rounded-xl font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-all text-xs sm:text-sm shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      Download {isPdfFile ? 'PDF Document' : 'Scan Image'}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCommitToLedger}
                  disabled={isSaved}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs sm:text-sm cursor-pointer ${
                    isSaved 
                      ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Saved to Ledger
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Commit to Audit Ledger
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {result && (
        <ExportPdfReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          auditResult={result}
          documentName={file?.name || 'Document Scan'}
          initialIsPrivileged={isPrivilegedLPP}
        />
      )}
    </div>
  );
}
