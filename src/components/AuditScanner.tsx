import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, FileText, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, Save } from 'lucide-react';
import { analyzeDocumentLocally, AuditResult } from '../lib/auditEngine';
import { appendAuditTrailEvent } from '../lib/auditTrailService';

export default function AuditScanner() {
  const [text, setText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleScan = async () => {
    if (!text.trim()) return;
    
    setIsScanning(true);
    setResult(null);
    setIsSaved(false);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text })
      });

      if (!response.ok) throw new Error('API error');
      
      const scanResult = await response.json();
      setResult(scanResult);
    } catch (e) {
      console.warn("Falling back to local heuristic analysis:", e);
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

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <ScanSearch className="w-6 h-6 text-[#7C3AED]" />
            Dr. Aria Forensic Scanner
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
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Raw Document Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the raw text of an invoice, receipt, or contract here..."
              className="w-full h-48 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all resize-none text-sm font-mono text-slate-600"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleScan}
              disabled={isScanning || !text.trim()}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Text...
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
                  </div>
                </div>
              </div>

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
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleCommitToLedger}
                  disabled={isSaved}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${
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
    </div>
  );
}
