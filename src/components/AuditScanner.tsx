import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, FileText, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, Save, Camera, X, RefreshCw, Trash2, Eye, Download, FileDown, Bot } from 'lucide-react';
import { AuditResult } from '../lib/auditEngine';
import { appendAuditTrailEvent } from '../lib/auditTrailService';
import { ExportPdfReportModal } from './ExportPdfReportModal';
import { downloadImageFile } from '../lib/pdfReportGenerator';

export default function AuditScanner() {
  const [text, setText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFromCamera, setIsFromCamera] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      setCameraError("Camera access unavailable. Please ensure permissions are granted, or upload a photo directly.");
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
  };

  const handleScan = async () => {
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
        mimeType = file.type;
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
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

      if (!response.ok) throw new Error('API error');
      
      const scanResult = await response.json();
      setResult(scanResult);
    } catch (e) {
      console.info("Using local analysis fallback.");
      const scanResult = analyzeDocumentLocally(text);
      setResult(scanResult);
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
      details: result.summary,
      documentRef: `${result.documentType} - ${result.keyMetrics.detectedVendor}`
    });
    
    setIsSaved(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'audittrail' } }));
    }, 1500);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'Moderate': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'Low': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <ScanSearch className="w-6 h-6 text-[#7C3AED]" />
            FOR-AI Forensic Scanner
          </h2>
          <p className="text-slate-300 text-sm mt-1">Paste invoice, contract, or receipt text below for instant AI forensic analysis.</p>
        </div>
        <div className="hidden sm:flex px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-bold items-center gap-1.5 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Engine Active
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Upload Document or Take Photo
              </label>
              {!isCameraActive && (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 rounded-lg hover:bg-[#7C3AED]/20 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {previewUrl && isFromCamera ? 'Retake Photo' : 'Use Camera'}
                </button>
              )}
            </div>

            {cameraError && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between gap-2">
                <span>{cameraError}</span>
                <button type="button" onClick={() => setCameraError(null)} className="text-amber-700 hover:text-amber-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="mb-4 relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full max-h-[400px] object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-4">
                  <button 
                    onClick={stopCamera}
                    className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-all"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 hover:border-white transition-all shadow-lg flex items-center justify-center"
                    title="Take Photo"
                  >
                    <Camera className="w-6 h-6 text-slate-800" />
                  </button>
                </div>
              </div>
            )}

            {/* Thumbnail Preview of Captured/Selected Image */}
            {previewUrl && file && !isCameraActive && (
              <div className="mb-4 p-4 rounded-2xl border border-purple-200 bg-purple-50/60 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={previewUrl} 
                        alt="Captured invoice thumbnail preview" 
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-purple-300 shadow-sm bg-white"
                      />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7C3AED] text-white shadow-sm">
                          {isFromCamera ? (
                            <>
                              <Camera className="w-3 h-3" />
                              Captured Photo
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              Document Image
                            </>
                          )}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Ready to Audit
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {(file.size / 1024).toFixed(1)} KB • {file.type || 'image/jpeg'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => file && downloadImageFile(file, file.name)}
                      className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#7C3AED] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      title="Download image file to your device"
                    >
                      <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
                      Download Scan
                    </button>
                    {isFromCamera && (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-[#7C3AED] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retake Photo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearCapturedImage}
                      className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isCameraActive && !previewUrl && (
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setPreviewUrl(URL.createObjectURL(f));
                      setIsFromCamera(false);
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED]/10 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/20 transition-all cursor-pointer"
                />
              </div>
            )}
            
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">Quick Test Samples:</span>
              <div className="flex flex-wrap items-center gap-1.5">
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
                    setFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    setIsFromCamera(false);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
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
                    setFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    setIsFromCamera(false);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Load invoice with math discrepancy & missing tax ID"
                >
                  <span>⚠️ Math & Tax Anomaly</span>
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
                    setFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                    setIsFromCamera(false);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Load clean, validated invoice"
                >
                  <span>✅ Clean Verified Invoice</span>
                </button>
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Optional: Paste raw invoice or document text here, or use one of the quick test samples above..."
              className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all resize-none text-sm font-mono text-slate-600"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleScan}
              disabled={isScanning || (!text.trim() && !file)}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ScanSearch className="w-5 h-5" />
                  Run Forensic Scan
                </>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {result && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 border-t border-slate-100 pt-8 space-y-6"
            >
              {/* Scan Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Risk Score</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{result.riskScore}</span>
                    <span className="text-sm font-bold text-slate-400">/100</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Risk Level</span>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRiskColor(result.riskLevel)}`}>
                      {result.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Detected Type</span>
                  <div className="mt-2 font-bold text-slate-900">
                    {result.documentType}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Key Metrics</span>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-bold text-slate-900">{result.keyMetrics.detectedAmount}</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Vendor:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[100px]">{result.keyMetrics.detectedVendor}</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[100px]">{result.keyMetrics.detectedDate || 'Not detected'}</span>
                    </div>
                    {result.keyMetrics.missingFields && result.keyMetrics.missingFields.length > 0 && (
                      <div className="text-xs flex flex-col pt-1 border-t border-slate-200 mt-1">
                        <span className="text-slate-500 font-semibold mb-1">Missing Elements:</span>
                        <div className="flex flex-wrap gap-1">
                          {result.keyMetrics.missingFields.map((field: string, idx: number) => (
                             <span key={idx} className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-100">{field}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {previewUrl && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 text-[#7C3AED]" />
                    Visual Anomaly Overlay
                  </h3>
                  <div className="relative inline-block w-full max-w-2xl border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <img src={previewUrl} alt="Document Preview" className="w-full h-auto object-contain" />
                    {result.findings.map((finding, idx) => {
                      if (finding.boundingBox) {
                        return (
                          <div 
                            key={idx}
                            className="absolute border-2 border-red-500 bg-red-500/20 cursor-pointer group"
                            style={{ 
                              left: `${finding.boundingBox.x}%`, 
                              top: `${finding.boundingBox.y}%`, 
                              width: `${finding.boundingBox.width}%`, 
                              height: `${finding.boundingBox.height}%` 
                            }}
                          >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              {finding.title}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
              {/* Findings */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#7C3AED]" />
                  Forensic Findings ({result.findings.length})
                </h3>
                <div className="space-y-3">
                  {result.findings.map((finding, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl flex gap-4">
                      <div className="mt-0.5">
                        {finding.severity === 'critical' || finding.severity === 'high' ? (
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                        ) : finding.severity === 'medium' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{finding.title}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-md">
                            {finding.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{finding.description}</p>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-900 block mb-1">Recommendation:</span>
                          <p className="text-xs text-slate-600">{finding.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
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
                      onClick={() => downloadImageFile(file || previewUrl!, file?.name || 'scanned_document.png')}
                      className="px-4 py-3 rounded-xl font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-all text-xs sm:text-sm shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      Download Scan File
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-dr-aria-chat', {
                        detail: { prompt: `Dr. Aria, please review this ${result.documentType} scan with risk score ${result.riskScore}/100. What remediation do you advise?` }
                      }));
                    }}
                    className="px-4 py-3 rounded-xl font-bold bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C3AED] flex items-center gap-2 transition-all text-xs sm:text-sm shadow-xs cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-[#7C3AED]" />
                    Consult Dr. Aria
                  </button>
                </div>

                <button
                  onClick={handleCommitToLedger}
                  disabled={isSaved}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-xs sm:text-sm cursor-pointer ${
                    isSaved 
                      ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
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
        />
      )}
    </div>
  );
}
