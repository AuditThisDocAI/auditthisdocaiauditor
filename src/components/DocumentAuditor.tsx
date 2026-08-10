import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  Sparkles, 
  Upload, 
  Search, 
  Lock, 
  ArrowRight,
  RotateCcw,
  MessageSquare,
  Send,
  Building2,
  FileSpreadsheet,
  X,
  FileUp,
  FileType
} from 'lucide-react';
import { PaywallModal } from './PaywallModal';

const SAMPLES = [
  {
    title: 'Vendor Invoice #8920 (High Risk)',
    text: `INVOICE #8920
Vendor: Apex Global Consulting LLC
Date: October 12, 2026
Tax ID: MISSING
Bill To: Acme Enterprises Inc.

Line Items:
- Professional consulting services rendered: $12,500.00
- Miscellaneous expenses: $4,500.00
Total Due: $17,000.00

Payment Instructions:
Please wire funds directly to Crypto Escrow Account #994821 within 24 hours. URGENT PAYMENT REQUIRED.`
  },
  {
    title: 'Equipment Contract #204 (Moderate Risk)',
    text: `SERVICE AGREEMENT #204
Parties: TechSupply Co. & Acme Enterprises Inc.
Effective Date: November 1, 2026
Term: 12 Months

Scope of Work:
Supply of 25 High-Performance Server Racks.
Monthly Maintenance Fee: $3,200.00

Special Clause:
Early termination penalty equals 100% of remaining contract value. No line-item audit permitted during term.`
  },
  {
    title: 'Clean Travel Receipt (Low Risk)',
    text: `RECEIPT #TR-4491
Vendor: Hilton Hotels & Resorts
Date: July 15, 2026
Tax ID / VAT: US-99201482

Guest: John Smith
Room Nights (3 nights @ $180/night): $540.00
State Sales Tax (8%): $43.20
Total Paid (Visa ending *4920): $583.20`
  }
];

export function DocumentAuditor() {
  const [docText, setDocText] = useState('');
  const [docName, setDocName] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileData, setFileData] = useState<{ name: string; mimeType: string; base64: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditCount, setAuditCount] = useState<number>(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'aria' | 'user'; text: string }>>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAskingAria, setIsAskingAria] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedCount = localStorage.getItem('audit_this_doc_free_count');
    if (savedCount) {
      setAuditCount(parseInt(savedCount, 10));
    }
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setDocName(file.name.replace(/\.[^/.]+$/, ""));

    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json');

    if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setDocText(result);
          setFileData(null);
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && result.startsWith('data:')) {
          const matches = result.match(/^data:(.*?);base64,(.*)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64 = matches[2];
            setFileData({ name: file.name, mimeType, base64 });
            setDocText(`[Uploaded Document File Attached: ${file.name} (${Math.round(file.size / 1024)} KB)]\nFile type: ${mimeType}\n\nDr. Aria AI will OCR and inspect image/PDF contents directly for forensic auditing.`);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRunAudit = async () => {
    if (!docText.trim() && !fileData) {
      alert('Please enter text or upload a document to audit.');
      return;
    }

    // Check limit
    if (auditCount >= 10) {
      setShowPaywall(true);
      return;
    }

    setIsAuditing(true);
    setAuditResult(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: docText,
          documentName: docName || uploadedFileName || 'Submitted Document',
          fileData
        })
      });

      const responseText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error('Server returned invalid response format.');
      }

      if (!response.ok || data.error) {
        alert(data?.error || 'Error analyzing document. Please try a smaller text sample or file.');
        return;
      }
      
      // Increment audit count
      const newCount = auditCount + 1;
      setAuditCount(newCount);
      localStorage.setItem('audit_this_doc_free_count', newCount.toString());

      setAuditResult(data);
      setChatMessages([
        {
          sender: 'aria',
          text: `Hello, I'm Dr. Aria (PhD in Forensic Auditing). I've completed the audit for "${docName || uploadedFileName || 'Submitted Document'}". Our calculated Risk Score is ${data.riskScore}/100 (${data.riskLevel} Risk). Feel free to ask me any questions about our findings!`
        }
      ]);

      if (newCount >= 10) {
        setTimeout(() => setShowPaywall(true), 1500);
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to Dr. Aria audit engine.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAskDrAria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isAskingAria) return;

    const userQ = inputQuestion.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setInputQuestion('');
    setIsAskingAria(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Document Audit Context: Risk Score ${auditResult?.riskScore}/100, Type: ${auditResult?.documentType}]\nUser Question: ${userQ}`,
          history: []
        })
      });

      const data = await response.json();
      setChatMessages(prev => [
        ...prev,
        { sender: 'aria', text: data.text || "I have noted your inquiry and recommend cross-referencing vendor tax filings." }
      ]);
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'aria', text: "An error occurred while analyzing your query. Please try again." }
      ]);
    } finally {
      setIsAskingAria(false);
    }
  };

  return (
    <div id="document-auditor" className="max-w-6xl mx-auto px-4 py-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center shrink-0">
            <Bot className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-[#1E293B]">Dr. Aria's Forensic Auditor</h2>
              <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                PhD Certified
              </span>
            </div>
            <p className="text-[#64748B] text-sm mt-1">
              Automated document auditing, fraud detection, and compliance risk scoring.
            </p>
          </div>
        </div>

        {/* Free Tier Usage Badge */}
        <div className="bg-[#F8F9FC] border border-[#E2E8F0] p-4 rounded-2xl w-full md:w-auto min-w-[240px]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-[#64748B] uppercase tracking-wider">Free Plan Usage</span>
            <span className={auditCount >= 10 ? "text-red-500 font-extrabold" : "text-[#7C3AED]"}>
              {auditCount} / 10 Audits
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${auditCount >= 10 ? 'bg-red-500' : 'bg-[#7C3AED]'}`}
              style={{ width: `${Math.min((auditCount / 10) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[11px]">
            {auditCount >= 10 ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Free limit reached
              </span>
            ) : (
              <span className="text-[#64748B]">
                {10 - auditCount} free audit{10 - auditCount === 1 ? '' : 's'} remaining
              </span>
            )}
            <button
              onClick={() => setShowPaywall(true)}
              className="text-[#7C3AED] font-bold hover:underline"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Main Auditor Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Form & File Upload */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1E293B] text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7C3AED]" />
                Upload or Paste Document
              </h3>
              <span className="text-xs text-[#64748B] font-medium">PDF, TXT, CSV, JPG, PNG</span>
            </div>

            {/* Drag and Drop File Upload Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-6 p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-[#7C3AED] bg-[#7C3AED]/5' 
                  : 'border-[#E2E8F0] hover:border-[#7C3AED]/50 bg-[#F8F9FC]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt,.csv,.json,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
                <FileUp className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-[#1E293B]">
                {uploadedFileName ? (
                  <span className="text-[#7C3AED] flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Loaded: {uploadedFileName}
                  </span>
                ) : (
                  'Click to upload or drag and drop document'
                )}
              </div>
              <div className="text-xs text-[#64748B] mt-1">
                Upload invoices, receipts, contracts, or financial statements
              </div>
            </div>

            {/* Sample Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                Or Try a Sample Document:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDocName(s.title);
                      setDocText(s.text);
                      setUploadedFileName('');
                      setFileData(null);
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#7C3AED] hover:bg-[#F8F9FC] transition-all text-xs font-medium text-[#1E293B] flex items-center justify-between"
                  >
                    <span>{s.title}</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1.5">Document Reference Name</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g., Invoice #8920 - Apex Consulting"
                  className="w-full px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-1.5">Document Raw Content</label>
                <textarea
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  rows={7}
                  placeholder="Paste text directly or edit loaded file contents..."
                  className="w-full px-4 py-3 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all font-mono text-xs text-[#1E293B] leading-relaxed"
                />
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing || !docText.trim()}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                  auditCount >= 10
                    ? 'bg-[#1E293B] hover:bg-[#0F172A]'
                    : 'bg-[#7C3AED] hover:bg-[#6D28D9] shadow-purple-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAuditing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Dr. Aria is Auditing Document...
                  </>
                ) : auditCount >= 10 ? (
                  <>
                    <Lock className="w-5 h-5 text-amber-400" />
                    Free Limit Reached (10/10) - Upgrade
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Run Audit with Dr. Aria ({auditCount}/10 Free)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audit Results & Chat */}
        <div className="lg:col-span-6 space-y-6">
          {!auditResult && !isAuditing && (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#E2E8F0] shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-[#F8F9FC] text-[#94A3B8] border border-[#E2E8F0] flex items-center justify-center mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Awaiting Document Audit</h3>
              <p className="text-sm text-[#64748B] max-w-sm leading-relaxed mb-6">
                Upload or paste a document on the left to run Dr. Aria's forensic auditing scan.
              </p>
              <div className="text-xs font-semibold text-[#7C3AED] bg-[#7C3AED]/10 px-4 py-2 rounded-full">
                10 Free Audits Available Per Device
              </div>
            </div>
          )}

          {isAuditing && (
            <div className="bg-white p-12 rounded-3xl border border-[#E2E8F0] shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <Bot className="w-12 h-12 text-[#7C3AED] animate-bounce mb-4" />
              <h3 className="text-xl font-bold text-[#1E293B]">Scanning Document Structure</h3>
              <p className="text-sm text-[#64748B] mt-2">
                Dr. Aria is inspecting amounts, compliance rules, duplicate indicators, and red flags...
              </p>
            </div>
          )}

          {auditResult && !isAuditing && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6">
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Document Audit Report</span>
                    <h3 className="text-xl font-bold text-[#1E293B] mt-1">{docName || uploadedFileName || 'Audited Document'}</h3>
                    <div className="text-xs text-[#64748B] mt-0.5">Type: {auditResult.documentType}</div>
                  </div>

                  {/* Risk Badge */}
                  <div className={`px-4 py-2 rounded-2xl text-center border ${
                    auditResult.riskScore > 65 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : auditResult.riskScore > 35 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    <div className="text-2xl font-black">{auditResult.riskScore}/100</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">{auditResult.riskLevel} Risk</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-[#1E293B] tracking-wider mb-2">Dr. Aria's Summary:</h4>
                  <p className="text-sm text-[#475569] leading-relaxed bg-[#F8F9FC] p-4 rounded-xl border border-[#E2E8F0]">
                    "{auditResult.summary}"
                  </p>
                </div>

                {/* Findings List */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-[#1E293B] tracking-wider mb-3">Key Audit Observations:</h4>
                  <div className="space-y-3">
                    {auditResult.findings.map((finding: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-start gap-3">
                        {finding.severity === 'high' || finding.severity === 'critical' ? (
                          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        ) : finding.severity === 'medium' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#1E293B]">{finding.title}</span>
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gray-100 text-[#64748B]">
                              {finding.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] mt-1">{finding.description}</p>
                          {finding.recommendation && (
                            <div className="text-xs font-semibold text-[#7C3AED] mt-2 flex items-center gap-1">
                              <span>Action: {finding.recommendation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat with Dr. Aria */}
              <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E2E8F0]">
                  <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-xs">
                    DA
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1E293B]">Consult Dr. Aria on this Audit</h4>
                    <p className="text-[10px] text-[#64748B]">PhD Forensic Auditing Assistant</p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 p-2 bg-[#F8F9FC] rounded-2xl mb-4 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl ${
                        msg.sender === 'user' 
                          ? 'bg-[#7C3AED] text-white rounded-tr-none' 
                          : 'bg-white text-[#1E293B] border border-[#E2E8F0] rounded-tl-none shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAskingAria && (
                    <div className="text-[#64748B] italic text-[11px] px-2">Dr. Aria is typing...</div>
                  )}
                </div>

                <form onSubmit={handleAskDrAria} className="flex gap-2">
                  <input
                    type="text"
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    placeholder="Ask Dr. Aria about risk score, tax rules, or findings..."
                    className="flex-1 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuestion.trim() || isAskingAria}
                    className="bg-[#7C3AED] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#6D28D9] disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        auditCount={auditCount}
      />
    </div>
  );
}

