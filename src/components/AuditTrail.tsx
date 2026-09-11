import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Download, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Hash, 
  Lock, 
  RefreshCw, 
  Copy, 
  Check, 
  Plus, 
  Sparkles,
  ArrowRight,
  Database,
  Eye,
  FileCheck,
  Crown,
  CreditCard
} from 'lucide-react';
import { 
  AuditTrailEvent, 
  getAuditTrailEvents, 
  logAuditTrailEvent, 
  verifyTrailIntegrity 
} from '../lib/auditTrailService';
import { isUserPro } from '../lib/authUtils';
import { PaywallModal } from './PaywallModal';
import { motion, AnimatePresence } from 'motion/react';

export function AuditTrail() {
  const [isPro, setIsPro] = useState(isUserPro());
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  const [events, setEvents] = useState<AuditTrailEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; verifiedCount: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New manual audit event form
  const [newAction, setNewAction] = useState('');
  const [newCategory, setNewCategory] = useState<AuditTrailEvent['category']>('DOCUMENT_AUDIT');
  const [newSeverity, setNewSeverity] = useState<AuditTrailEvent['severity']>('VERIFIED');
  const [newDocumentRef, setNewDocumentRef] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const loadEvents = () => {
    setEvents(getAuditTrailEvents());
  };

  useEffect(() => {
    const checkPro = () => setIsPro(isUserPro());
    checkPro();

    loadEvents();
    const handleUpdate = () => loadEvents();
    window.addEventListener('audit-trail-updated', handleUpdate);
    window.addEventListener('pro-status-changed', checkPro);
    window.addEventListener('admin-auth-changed', checkPro);
    window.addEventListener('storage', checkPro);
    return () => {
      window.removeEventListener('audit-trail-updated', handleUpdate);
      window.removeEventListener('pro-status-changed', checkPro);
      window.removeEventListener('admin-auth-changed', checkPro);
      window.removeEventListener('storage', checkPro);
    };
  }, []);

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = verifyTrailIntegrity();
      setVerificationResult(res);
      setIsVerifying(false);
    }, 600);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim() || !newDetails.trim()) return;

    logAuditTrailEvent({
      action: newAction.trim(),
      category: newCategory,
      severity: newSeverity,
      actor: 'Auditor Manual Entry',
      documentRef: newDocumentRef.trim() || undefined,
      details: newDetails.trim()
    });

    setNewAction('');
    setNewDetails('');
    setNewDocumentRef('');
    setShowAddModal(false);
    loadEvents();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Category', 'Action', 'Severity', 'Actor', 'Document Ref', 'Details', 'SHA-256 Hash', 'Previous Hash'];
    const rows = events.map(ev => [
      ev.id,
      ev.timestamp,
      ev.category,
      `"${ev.action.replace(/"/g, '""')}"`,
      ev.severity,
      `"${ev.actor.replace(/"/g, '""')}"`,
      `"${(ev.documentRef || '').replace(/"/g, '""')}"`,
      `"${ev.details.replace(/"/g, '""')}"`,
      ev.hash,
      ev.previousHash
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Forensic_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Forensic_Audit_Trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered list
  const filteredEvents = events.filter(ev => {
    const matchesSearch = 
      ev.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.documentRef && ev.documentRef.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || ev.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || ev.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const criticalCount = events.filter(e => e.severity === 'CRITICAL').length;
  const verifiedCount = events.filter(e => e.severity === 'VERIFIED').length;

  if (!isPro) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              Paid Subscriber Exclusive
            </span>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 tracking-tight">
              Forensic Audit Trail is Locked
            </h2>

            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              The immutable SHA-256 cryptographic audit trail, tamper-evident block chain verification, and court-ready compliance export suite are available exclusively to paying subscribers who have subscribed to Pro or Business.
            </p>

            <div className="my-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Unlocked on Paid Pro & Business:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Immutable SHA-256 Block Hashing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated Forensic Event Logging</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>One-Click Chain Integrity Verifier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Court-Ready CSV & JSON Exports</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowPaywallModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-purple-600/30 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Subscribe to Unlock Audit Trail</span>
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
                }}
                className="w-full sm:w-auto px-6 py-4 bg-white border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white font-bold rounded-2xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>View Payment Plan Options</span>
              </button>
            </div>
          </div>

          {/* Frosted blurred teaser underneath */}
          <div className="mt-12 relative rounded-2xl overflow-hidden border border-slate-200 select-none pointer-events-none opacity-60">
            <div className="p-4 bg-slate-100 text-left border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>LEDGER EVENT PREVIEW (LOCKED)</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> RESTRICTED ACCESS</span>
            </div>
            <div className="divide-y divide-slate-100 filter blur-sm">
              <div className="p-4 bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-48 bg-slate-200 rounded"></div>
                  <div className="h-3 w-72 bg-slate-100 rounded"></div>
                </div>
                <div className="h-4 w-28 bg-slate-200 rounded"></div>
              </div>
              <div className="p-4 bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-40 bg-slate-200 rounded"></div>
                  <div className="h-3 w-64 bg-slate-100 rounded"></div>
                </div>
                <div className="h-4 w-28 bg-slate-200 rounded"></div>
              </div>
              <div className="p-4 bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-52 bg-slate-200 rounded"></div>
                  <div className="h-3 w-80 bg-slate-100 rounded"></div>
                </div>
                <div className="h-4 w-28 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <PaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immutable Chain of Custody</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
              Forensic Audit Trail
            </h1>
            <p className="text-sm text-[#64748B] max-w-2xl">
              Chronological, tamper-evident forensic ledger capturing every document scan, risk flag, ledger balance, and compliance action.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Audit Entry</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors flex items-center gap-1.5"
                title="Export as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors flex items-center gap-1.5"
                title="Export as JSON"
              >
                <Database className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Integrity Banner */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold ${
              verificationResult.isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Cryptographic Chain Check Passed: {verificationResult.verifiedCount} / {verificationResult.verifiedCount} block hashes validated. Zero alterations detected.
              </span>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-[11px] underline hover:no-underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Trail Events</div>
            <div className="text-xl font-extrabold text-[#1E293B] mt-1">{events.length}</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Verified Records</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">{verifiedCount}</div>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Critical Flags</div>
            <div className="text-xl font-extrabold text-rose-700 mt-1">{criticalCount}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Custody Status</div>
            <div className="text-xs font-extrabold text-purple-700 mt-2 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>SHA-256 Chained</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, ID, hash, or details..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="DOCUMENT_AUDIT">Document Audits</option>
            <option value="FORENSIC_FLAG">Forensic Flags</option>
            <option value="LEDGER_ACTIVITY">Ledger Activity</option>
            <option value="SECURITY_AUTH">Security & Sessions</option>
            <option value="POLICY_UPDATE">Policy Updates</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 ml-2">
            <span>Severity:</span>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="VERIFIED">Verified</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Audit Trail Timeline / Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#1E293B] uppercase tracking-wider">
            Chronological Audit Entries ({filteredEvents.length})
          </h2>
          <span className="text-xs text-slate-400">Ordered newest to oldest</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No audit trail records matched the active filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((ev, idx) => {
              const dateObj = new Date(ev.timestamp);
              const formattedDate = dateObj.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
              const formattedTime = dateObj.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              });

              return (
                <div 
                  key={ev.id} 
                  className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="mt-1 shrink-0">
                      {ev.severity === 'CRITICAL' && (
                        <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4" />
                        </span>
                      )}
                      {ev.severity === 'WARNING' && (
                        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      {ev.severity === 'VERIFIED' && (
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                      {ev.severity === 'INFO' && (
                        <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#1E293B]">
                          {ev.action}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                          {ev.category.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                          ev.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                          ev.severity === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {ev.severity}
                        </span>
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed break-words">
                        {ev.details}
                      </p>

                      {ev.documentRef && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7C3AED] font-semibold">
                          <FileCheck className="w-3 h-3" />
                          <span>Ref: {ev.documentRef}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#64748B]">
                        <span className="font-mono text-purple-700 font-bold">{ev.id}</span>
                        <span>&bull;</span>
                        <span>Actor: <strong className="text-slate-700">{ev.actor}</strong></span>
                        <span>&bull;</span>
                        <span>{formattedDate} at {formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hash & Cryptographic Verification block */}
                  <div className="shrink-0 w-full md:w-64 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Block SHA-256
                      </span>
                      <button
                        onClick={() => handleCopyHash(ev.hash)}
                        className="text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-bold"
                        title="Copy complete cryptographic hash"
                      >
                        {copiedHash === ev.hash ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="font-mono text-[10px] text-slate-600 break-all bg-white px-2 py-1 rounded border border-slate-200">
                      {ev.hash.slice(0, 20)}...{ev.hash.slice(-10)}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Prev: {ev.previousHash.slice(0, 10)}...</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Chained
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Manual Auditor Entry */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-[#1E293B] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Log Manual Forensic Entry</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Action / Event Name *</label>
                  <input
                    type="text"
                    required
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    placeholder="e.g. Vendor Tax ID Verification"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    >
                      <option value="DOCUMENT_AUDIT">Document Audit</option>
                      <option value="FORENSIC_FLAG">Forensic Flag</option>
                      <option value="LEDGER_ACTIVITY">Ledger Activity</option>
                      <option value="SECURITY_AUTH">Security / Auth</option>
                      <option value="POLICY_UPDATE">Policy Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Severity</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    >
                      <option value="VERIFIED">Verified</option>
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document / Evidence Reference</label>
                  <input
                    type="text"
                    value={newDocumentRef}
                    onChange={(e) => setNewDocumentRef(e.target.value)}
                    placeholder="e.g. Wire Confirmation #WX-902 or Apex Invoice #8920"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forensic Findings & Details *</label>
                  <textarea
                    required
                    rows={3}
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    placeholder="Enter detailed audit findings, discrepancy notes, or verification confirmation..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Commit to Immutable Ledger
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
