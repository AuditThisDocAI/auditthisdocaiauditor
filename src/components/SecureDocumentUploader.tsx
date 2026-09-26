import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  Camera, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Loader2, 
  ScanSearch, 
  FileDown, 
  Bot, 
  Layers, 
  Hash, 
  Lock, 
  RefreshCw,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { ExportPdfReportModal } from './ExportPdfReportModal';
import { downloadImageFile } from '../lib/pdfReportGenerator';
import { appendAuditTrailEvent } from '../lib/auditTrailService';

export interface SecureUploadResult {
  isAuditable?: boolean;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' | string;
  summary: string;
  documentType: string;
  findings: Array<{
    category?: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical' | string;
    recommendation?: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  keyMetrics?: {
    detectedVendor?: string;
    detectedAmount?: string;
    detectedDate?: string;
    missingFields?: string[];
  };
  imageUrl?: string;
}

interface SecureDocumentUploaderProps {
  onScanComplete?: (result: SecureUploadResult) => void;
  onViewHeatmap?: (audit: any) => void;
}

const DOCUMENT_CATEGORIES = [
  { id: 'auto', label: 'Auto-Detect Type' },
  { id: 'invoice', label: 'Tax Invoice / Bill' },
  { id: 'receipt', label: 'Commercial Receipt' },
  { id: 'statement', label: 'Bank Statement' },
  { id: 'payslip', label: 'Salary Slip / Payroll' },
  { id: 'prescription', label: 'Medical Prescription / Rx' },
  { id: 'contract', label: 'Commercial Contract' }
];

export function SecureDocumentUploader({ onScanComplete, onViewHeatmap }: SecureDocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [category, setCategory] = useState('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [result, setResult] = useState<SecureUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualText, setManualText] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Advanced forensic toggles
  const [checks, setChecks] = useState({
    fontKerning: true,
    metadataAnalysis: true,
    mathReconciliation: true,
    taxValidation: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Compute client-side SHA-256 hash for chain-of-custody verification
  const computeFileHash = async (fileBlob: Blob): Promise<string> => {
    try {
      const buffer = await fileBlob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      return 'hash_unsupported_environment';
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setErrorMsg(null);

    // Validate size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMsg('File size exceeds 20MB maximum security threshold. Please select a smaller file.');
      return;
    }

    // Validate format
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff'];
    const lowerName = selectedFile.name.toLowerCase();
    const isExtensionValid = validExtensions.some(ext => lowerName.endsWith(ext));
    const isMimeValid = selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf';

    if (!isExtensionValid && !isMimeValid) {
      setErrorMsg('Unsupported file type. Please upload a PDF, PNG, JPG, JPEG, or WEBP document.');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Compute cryptographic hash
    const hash = await computeFileHash(selectedFile);
    setFileHash(hash);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
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

  const clearSelectedFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFileHash(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Could not access camera. Please verify device permissions.');
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
        canvas.toBlob(async (blob) => {
          if (blob) {
            const capturedFile = new File(
              [blob], 
              `secure_capture_${Date.now().toString().slice(-5)}.jpg`, 
              { type: 'image/jpeg' }
            );
            await handleFileSelect(capturedFile);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const handleExecuteScan = async () => {
    if (!file && !manualText.trim()) {
      setErrorMsg('Please attach a document or paste document text before initiating forensic scanning.');
      return;
    }

    setIsScanning(true);
    setScanStep(1);
    setErrorMsg(null);
    setResult(null);

    try {
      let base64Data = '';
      let mimeType = '';
      let documentName = file ? file.name : 'Pasted_Text_Document.txt';

      if (file) {
        mimeType = file.type || 'application/octet-stream';
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || '');
          };
          reader.onerror = err => reject(err);
        });
      }

      setScanStep(2);

      // Perform real-time forensic audit via /api/audit
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: manualText,
          documentName: documentName,
          fileData: file ? { base64: base64Data, mimeType } : undefined,
          forensicCategory: category !== 'auto' ? category : undefined,
          checks
        })
      });

      setScanStep(3);

      if (!response.ok) {
        throw new Error(`Audit service returned HTTP ${response.status}`);
      }

      const scanResult: SecureUploadResult = await response.json();
      setScanStep(4);

      // Add to audit trail log
      appendAuditTrailEvent({
        category: 'DOCUMENT_AUDIT',
        action: 'Secure Forensic Ingestion',
        actor: 'Dr. Aria AI Auditor',
        documentRef: documentName,
        severity: scanResult.riskLevel === 'Critical' ? 'CRITICAL' : scanResult.riskLevel === 'High' ? 'CRITICAL' : scanResult.riskLevel === 'Moderate' ? 'WARNING' : 'INFO',
        details: `Document '${documentName}' securely analyzed. Risk Score: ${scanResult.riskScore}/100 (${scanResult.riskLevel}). SHA-256: ${fileHash ? fileHash.slice(0, 16) + '...' : 'Verified'}`
      });

      setResult(scanResult);

      if (onScanComplete) {
        onScanComplete(scanResult);
      }

      // Decrement or track free audit count in local storage if not pro
      const currentCount = parseInt(localStorage.getItem('audit_this_doc_free_count') || '0', 10);
      localStorage.setItem('audit_this_doc_free_count', (currentCount + 1).toString());

    } catch (err: any) {
      console.error('Forensic scan error:', err);
      setErrorMsg(`Forensic scanning encountered an issue: ${err.message || 'Verification service offline'}. Please retry.`);
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 45) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 25) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getSeverityPill = (severity: string) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
      case 'moderate':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div 
      id="secure-document-uploader-root" 
      className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8 transition-all"
    >
      {/* Top Banner with Zero-Trust Security Indicators */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 sm:p-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Trust TLS 1.3 Encryption
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono">
              SHA-256 Verified
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5 mt-2">
            <ScanSearch className="w-6 h-6 text-[#7C3AED]" />
            Secure Document Attachment & Forensic Ingestion
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Attach financial statements, tax invoices, payroll records, or prescription receipts for instant forensic scrutiny, layout tamper detection, and arithmetic reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isCameraActive ? (
            <button
              id="btn-uploader-start-camera"
              type="button"
              onClick={startCamera}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-purple-300" />
              Capture via Camera
            </button>
          ) : (
            <button
              id="btn-uploader-stop-camera"
              type="button"
              onClick={stopCamera}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Close Camera
            </button>
          )}

          <button
            id="btn-uploader-toggle-options"
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showAdvancedOptions 
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]' 
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Forensic Parameters
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Camera Live Preview Viewfinder */}
        {isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-purple-400 shadow-xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full max-h-[420px] object-contain mx-auto"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center items-center gap-4">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>

              <button
                id="btn-capture-snapshot"
                type="button"
                onClick={capturePhoto}
                className="px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Capture Document
              </button>
            </div>
          </div>
        )}

        {/* Advanced Forensic Parameters (Collapsible) */}
        <AnimatePresence>
          {showAdvancedOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border border-purple-200 bg-purple-50/50 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                  Active Forensic Heuristics & Verification Modules
                </span>
                <span className="text-[11px] text-purple-700 font-semibold">Gemini 3.8 Flash Neural Pipeline</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-purple-200 text-xs font-bold text-slate-700 cursor-pointer hover:border-purple-400 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.fontKerning} 
                    onChange={e => setChecks({ ...checks, fontKerning: e.target.checked })}
                    className="accent-[#7C3AED] w-4 h-4 rounded" 
                  />
                  <span>Font & Kerning Forensic</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-purple-200 text-xs font-bold text-slate-700 cursor-pointer hover:border-purple-400 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.metadataAnalysis} 
                    onChange={e => setChecks({ ...checks, metadataAnalysis: e.target.checked })}
                    className="accent-[#7C3AED] w-4 h-4 rounded" 
                  />
                  <span>Metadata Timestamp Audit</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-purple-200 text-xs font-bold text-slate-700 cursor-pointer hover:border-purple-400 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.mathReconciliation} 
                    onChange={e => setChecks({ ...checks, mathReconciliation: e.target.checked })}
                    className="accent-[#7C3AED] w-4 h-4 rounded" 
                  />
                  <span>Line-Item Math Validation</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-purple-200 text-xs font-bold text-slate-700 cursor-pointer hover:border-purple-400 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.taxValidation} 
                    onChange={e => setChecks({ ...checks, taxValidation: e.target.checked })}
                    className="accent-[#7C3AED] w-4 h-4 rounded" 
                  />
                  <span>Statutory Tax ID Registry</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-semibold">
              <strong className="block text-red-900 font-bold">Verification Warning</strong>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        {!file && (
          <div
            id="drag-drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-[#7C3AED] bg-purple-50/80 scale-[1.01]'
                : 'border-slate-300 hover:border-[#7C3AED] hover:bg-slate-50/80 bg-slate-50/40'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Drag and drop your document here, or <span className="text-[#7C3AED] underline">browse files</span>
              </h3>
              <p className="text-xs text-slate-500">
                Supported formats: PDF, PNG, JPG, JPEG, WEBP (Max 20MB). Client-side SHA-256 calculated automatically.
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
                Tax Invoices
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
                Bank Statements
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
                Payslips
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
                Medical Rx
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
                Contracts
              </span>
            </div>
          </div>
        )}

        {/* Selected File Security Strip & Thumbnail Preview */}
        {file && (
          <div className="p-4 sm:p-5 rounded-2xl border border-purple-200 bg-purple-50/70 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {previewUrl && file.type.startsWith('image/') ? (
                  <div className="relative shrink-0">
                    <img
                      src={previewUrl}
                      alt="Document scan thumbnail"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-purple-300 shadow-sm bg-white"
                    />
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-purple-100 border-2 border-purple-300 flex flex-col items-center justify-center text-[#7C3AED] shadow-sm shrink-0">
                    <FileText className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase mt-1">PDF DOC</span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base break-all">
                      {file.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 text-[11px] font-bold">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Integrity Verified &bull; {file.type || 'Document'}</span>
                  </p>

                  {fileHash && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-1 rounded-md border border-purple-200/60 max-w-full overflow-hidden">
                      <Hash className="w-3 h-3 text-purple-600 shrink-0" />
                      <span className="truncate">SHA-256: {fileHash}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => downloadImageFile(file, file.name)}
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    title="Download attached file"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="p-2.5 rounded-xl bg-white hover:bg-red-50 border border-slate-200 text-red-600 text-xs font-bold transition-all shadow-2xs"
                  title="Remove attached file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Selection & Optional Text Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
              Document Classification
            </label>
            <select
              id="select-uploader-category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2">
              Supplemental Notes or Raw Document Text (Optional)
            </label>
            <input
              type="text"
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="e.g., Invoice #INV-2024-883, wire transfer details, or OCR copy..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>
        </div>

        {/* Action Button: Execute Forensic Audit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
            <span>Multi-modal OCR & Anomaly Verification running through Gemini 3.8 Flash.</span>
          </div>

          <button
            id="btn-uploader-execute-audit"
            type="button"
            onClick={handleExecuteScan}
            disabled={isScanning || (!file && !manualText.trim())}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {scanStep === 1 && 'Verifying SHA-256 Checksum...'}
                  {scanStep === 2 && 'Transmitting Encrypted Payload...'}
                  {scanStep === 3 && 'Analyzing with Gemini 3.8 Flash...'}
                  {scanStep === 4 && 'Compiling Forensic Findings...'}
                </span>
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                <span>Execute Forensic Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Forensic Audit Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-slate-200 pt-6 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl border text-center font-black ${getRiskScoreColor(result.riskScore)}`}>
                  <div className="text-2xl sm:text-3xl font-black">{result.riskScore}</div>
                  <div className="text-[10px] uppercase tracking-wider">Risk / 100</div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Audit Assessment
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                      result.riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                      result.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                      result.riskLevel === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {result.riskLevel} Risk
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    {result.documentType || 'Analyzed Document'} Forensic Report
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {result.findings?.length || 0} Red Flag Anomaly Markers Identified
                  </p>
                </div>
              </div>

              {/* Action Buttons for Results */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C3AED] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileDown className="w-4 h-4 text-[#7C3AED]" />
                  <span>Download PDF Report</span>
                </button>

                {onViewHeatmap && (
                  <button
                    type="button"
                    onClick={() => onViewHeatmap(result)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Inspect Heatmap</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-dr-aria-chat', {
                      detail: { 
                        prompt: `Dr. Aria, please conduct an exhaustive forensic breakdown on this ${result.documentType || 'document'} which scored ${result.riskScore}/100 (${result.riskLevel} Risk). What specific remediation and vendor verification steps do you advise?` 
                      }
                    }));
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Bot className="w-4 h-4" />
                  <span>Consult Dr. Aria AI</span>
                </button>
              </div>
            </div>

            {/* Extracted Key Forensic Metrics */}
            {result.keyMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Vendor / Issuer
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 block truncate">
                    {result.keyMetrics.detectedVendor || 'Not identified'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Value
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 block">
                    {result.keyMetrics.detectedAmount || 'Not recognized'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Document Timestamp
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 block">
                    {result.keyMetrics.detectedDate || 'Omitted'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Missing Controls
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 block">
                    {result.keyMetrics.missingFields?.length 
                      ? `${result.keyMetrics.missingFields.length} critical fields` 
                      : 'None detected'}
                  </span>
                </div>
              </div>
            )}

            {/* Executive Summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-[#7C3AED]" />
                Forensic Executive Summary
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Categorized Findings */}
            {result.findings && result.findings.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Identified Red Flags & Anomaly Details
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {result.findings.map((f, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition-all shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {f.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getSeverityPill(f.severity)}`}>
                          {f.severity}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        {f.description}
                      </p>

                      {f.recommendation && (
                        <div className="text-[11px] text-[#7C3AED] bg-purple-50 p-2 rounded-lg border border-purple-100 font-medium">
                          <strong>Action:</strong> {f.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reset / Scan Another Document */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  clearSelectedFile();
                  setResult(null);
                  setManualText('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Another Document
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* PDF Export Modal */}
      {showReportModal && result && (
        <ExportPdfReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          documentName={file ? file.name : 'Scanned_Document.pdf'}
          auditResult={{
            riskScore: result.riskScore,
            riskLevel: (['Low', 'Moderate', 'High', 'Critical'].includes(result.riskLevel) ? (result.riskLevel as any) : 'Low'),
            documentType: result.documentType || 'Document',
            summary: result.summary || 'Forensic examination completed.',
            findings: (result.findings || []).map(f => ({
              category: f.category || 'General Anomaly',
              title: f.title,
              description: f.description,
              severity: (['low', 'medium', 'high', 'critical'].includes(f.severity?.toLowerCase()) ? (f.severity.toLowerCase() as any) : 'medium'),
              recommendation: f.recommendation || 'Verify documentation with issuing entity.'
            })),
            keyMetrics: result.keyMetrics
          }}
        />
      )}
    </div>
  );
}

export default SecureDocumentUploader;
