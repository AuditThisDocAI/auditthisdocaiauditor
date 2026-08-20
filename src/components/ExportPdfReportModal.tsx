import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Hash, 
  FileCheck2, 
  Sparkles,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { generateBrandedReportWindow, AuditReportData, AuditFindingItem } from '../lib/pdfReportGenerator';
import { getActiveFirm } from '../lib/multiTenantDb';

interface ExportPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  auditResult: {
    riskScore: number;
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    documentType: string;
    summary: string;
    findings: AuditFindingItem[];
    keyMetrics?: {
      detectedVendor?: string;
      detectedAmount?: string;
      detectedDate?: string;
      missingFields?: string[];
    };
  };
}

export function ExportPdfReportModal({
  isOpen,
  onClose,
  documentName,
  auditResult
}: ExportPdfReportModalProps) {
  const firm = getActiveFirm();

  const [clientName, setClientName] = useState('Acme Global Enterprises');
  const [clientCompany, setClientCompany] = useState('Accounting & Audit Committee');
  const [auditorName, setAuditorName] = useState('Dr. Aria Sterling, CPA / CFE');
  const [auditorTitle, setAuditorTitle] = useState('Lead Forensic Auditor');
  const [engagementRef, setEngagementRef] = useState(
    `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-F`
  );
  const [auditorNotes, setAuditorNotes] = useState(
    'Audit conducted under forensic accounting verification protocols. All flagged discrepancies require counterparty corroboration.'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePdf = () => {
    setIsExporting(true);

    const reportData: AuditReportData = {
      documentName: documentName || 'Submitted Financial Document',
      auditDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      riskScore: auditResult.riskScore,
      riskLevel: auditResult.riskLevel,
      documentType: auditResult.documentType,
      executiveSummary: auditResult.summary,
      clientName: clientName.trim() || 'Client Organization',
      clientCompany: clientCompany.trim() || 'Corporate Division',
      auditorName: auditorName.trim() || 'Senior Forensic Auditor',
      auditorTitle: auditorTitle.trim() || 'Forensic Engagement Lead',
      engagementRef: engagementRef.trim() || `AUD-${new Date().getFullYear()}-001`,
      auditorNotes: auditorNotes.trim(),
      findings: auditResult.findings || [],
      keyMetrics: auditResult.keyMetrics
    };

    generateBrandedReportWindow(reportData);

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                Export Client Audit PDF Report
                <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold uppercase">
                  Client Ready
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate a branded, certified forensic certificate for client delivery & stakeholders.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Certificate Metadata Highlights */}
          <div className="p-4 rounded-2xl bg-[#F8F9FC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Audited Document</span>
              <span className="font-extrabold text-[#1E293B] text-sm block truncate max-w-[280px]">
                {documentName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                auditResult.riskScore > 65
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : auditResult.riskScore > 35
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Risk Score: {auditResult.riskScore}/100 ({auditResult.riskLevel})
              </span>
              <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                {auditResult.findings?.length || 0} Observations
              </span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                Client / Organization Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., Acme Global Industries"
                className="w-full bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                Department / Recipient Division
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="e.g., Audit & Finance Committee"
                className="w-full bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                Lead Auditor / Signatory Name
              </label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                placeholder="e.g., Dr. Aria Sterling, CPA"
                className="w-full bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#7C3AED]" />
                Certificate / Engagement Code
              </label>
              <input
                type="text"
                value={engagementRef}
                onChange={(e) => setEngagementRef(e.target.value)}
                placeholder="e.g., AUD-2026-9812-F"
                className="w-full bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E293B] mb-1 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-[#7C3AED]" />
              Auditor Executive Memo & Delivery Scope
            </label>
            <textarea
              rows={2}
              value={auditorNotes}
              onChange={(e) => setAuditorNotes(e.target.value)}
              placeholder="Add tailored guidance or notes for client review..."
              className="w-full bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#1E293B] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {/* Delivery Inclusions summary */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs space-y-1.5">
            <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Included in this Client PDF Report:
            </span>
            <div className="grid grid-cols-2 gap-2 text-purple-800 text-[11px] pt-1">
              <div>✓ Executive summary & scope</div>
              <div>✓ Itemized forensic findings table</div>
              <div>✓ Digital signature & certified seal</div>
              <div>✓ Full {firm.name} branding & contact</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#E2E8F0] bg-[#F8F9FC] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#64748B]">
            Outputs a high-resolution printable PDF certificate.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#1E293B] hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Report Generated!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generating Report...' : 'Download & Print PDF'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
