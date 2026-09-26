import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  Activity, 
  Search, 
  RefreshCw, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  Filter,
  Zap,
  Crown,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  LogOut,
  Palette,
  Flame,
  ScanSearch,
  Layers,
  UploadCloud,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { WhiteLabelModal } from './WhiteLabelModal';
import { ExportPdfReportModal } from './ExportPdfReportModal';
import { exportAuditAsCsv } from '../lib/pdfReportGenerator';
import { getWhiteLabelConfig, WhiteLabelConfig } from '../lib/whitelabel';
import { MonthlyUsageMeter } from './MonthlyUsageMeter';
import { DiscrepancyTrendAnalytics } from './DiscrepancyTrendAnalytics';
import { SessionSecurityWidget } from './SessionSecurityWidget';
import { performLogout } from '../lib/sessionManager';
import DocumentHeatmapOverlay from './DocumentHeatmapOverlay';

interface AuditLog {
  id: string;
  timestamp: string;
  documentName: string;
  documentType: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  summary: string;
  findingsCount: number;
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
  ip?: string;
}

interface DashboardData {
  totalAudits: number;
  highRiskCount: number;
  avgRiskScore: number;
  activeSessions: number;
  riskDistribution: {
    Low: number;
    Moderate: number;
    High: number;
    Critical: number;
  };
  documentTypes: Record<string, number>;
  recentAudits: AuditLog[];
}

import { isCurrentAdmin, isUserPro, isSuperAdminEmail, FREE_AUDIT_LIMIT } from '../lib/authUtils';
import AuditScanner from './AuditScanner';
import { SecureDocumentUploader } from './SecureDocumentUploader';
import { FinancialTools } from './FinancialTools';

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [scannerMode, setScannerMode] = useState<'secure-upload' | 'quick-scanner'>('secure-upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [exportingAudit, setExportingAudit] = useState<AuditLog | null>(null);
  const [selectedHeatmapAuditId, setSelectedHeatmapAuditId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'heatmap' | 'report'>('heatmap');
  const [activeFindingIndex, setActiveFindingIndex] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const [showWhiteLabelModal, setShowWhiteLabelModal] = useState(false);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(getWhiteLabelConfig());

  const syncQuotaState = () => {
    const adminActive = isCurrentAdmin();
    const proActive = isUserPro();
    setIsAdmin(adminActive);
    setIsPro(proActive);
    const count = parseInt(localStorage.getItem('audit_this_doc_free_count') || '0', 10);
    setUsedCount(count);
    setWhiteLabelConfig(getWhiteLabelConfig());
  };

  useEffect(() => {
    syncQuotaState();
    window.addEventListener('pro-status-changed', syncQuotaState);
    window.addEventListener('admin-auth-changed', syncQuotaState);
    window.addEventListener('whitelabel-updated', syncQuotaState);
    window.addEventListener('storage', syncQuotaState);
    return () => {
      window.removeEventListener('pro-status-changed', syncQuotaState);
      window.removeEventListener('admin-auth-changed', syncQuotaState);
      window.removeEventListener('whitelabel-updated', syncQuotaState);
      window.removeEventListener('storage', syncQuotaState);
    };
  }, []);

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
  };

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.warn('Dashboard stats returned non-200 status code:', res.status);
      }
    } catch (err) {
      console.info('Transient network or restart when fetching dashboard stats:', err);
      // Graceful fallback to avoid empty or broken dashboard view during network transitions
      setData(prev => prev || {
        totalAudits: 0,
        highRiskCount: 0,
        avgRiskScore: 0,
        activeSessions: 1,
        riskDistribution: { Low: 0, Moderate: 0, High: 0, Critical: 0 },
        documentTypes: { 'General': 0 },
        recentAudits: []
      });
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDashboardData();
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all recorded audit history logs?')) {
      try {
        await fetch('/api/admin/clear-audits', { method: 'POST' });
        fetchDashboardData(true);
      } catch (err) {
        console.warn('Failed to clear logs:', err);
      }
    }
  };

  const handleExportCSV = () => {
    const list = data?.recentAudits || [];
    if (!list.length) {
      return;
    }

    const headers = ['Audit ID', 'Timestamp', 'Document Name', 'Type', 'Risk Score', 'Risk Level', 'Detected Vendor', 'Detected Amount', 'Findings Count'];
    const rows = list.map(a => [
      a.id,
      new Date(a.timestamp).toLocaleString(),
      `"${(a.documentName || '').replace(/"/g, '""')}"`,
      a.documentType || 'General',
      a.riskScore,
      a.riskLevel,
      `"${(a.keyMetrics?.detectedVendor || 'N/A').replace(/"/g, '""')}"`,
      `"${(a.keyMetrics?.detectedAmount || 'N/A').replace(/"/g, '""')}"`,
      a.findingsCount || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ForensicDocAudit_Live_Audit_Log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter audits
  const filteredAudits = (data?.recentAudits || []).filter(audit => {
    const matchesSearch = 
      audit.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (audit.keyMetrics?.detectedVendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === 'All' || audit.riskLevel === riskFilter;
    const matchesType = typeFilter === 'All' || audit.documentType === typeFilter;

    return matchesSearch && matchesRisk && matchesType;
  });

  const activeHeatmapAudit = 
    data?.recentAudits.find(a => a.id === selectedHeatmapAuditId) ||
    data?.recentAudits.find(a => a.riskLevel === 'Critical' || a.riskLevel === 'High') ||
    data?.recentAudits[0] ||
    null;

  // Prepare Chart Data
  const riskChartData = [
    { name: 'Low Risk', count: data?.riskDistribution?.Low || 0, color: '#10B981' },
    { name: 'Moderate Risk', count: data?.riskDistribution?.Moderate || 0, color: '#F59E0B' },
    { name: 'High Risk', count: data?.riskDistribution?.High || 0, color: '#EF4444' },
    { name: 'Critical Risk', count: data?.riskDistribution?.Critical || 0, color: '#7F1D1D' },
  ];

  const typeChartData = Object.entries(data?.documentTypes || {}).map(([type, count]) => ({
    name: type,
    count: Number(count) || 0
  }));

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Moderate': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const monthlyLimit = isPro ? 1000 : FREE_AUDIT_LIMIT;
  const currentUsed = Math.min(monthlyLimit, usedCount);
  const remainingAudits = Math.max(0, monthlyLimit - currentUsed);
  const usagePercent = Math.min(100, Math.round((currentUsed / monthlyLimit) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 min-h-[85vh] space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              Live Monitoring System
            </span>
            <span className="text-xs font-mono text-[#64748B]">Updated real-time</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] mt-2">
            Real-Time Audit Tracking Dashboard
          </h2>
          <p className="text-[#64748B] text-sm mt-1">
            Live stream of documents scanned by FOR-AI AI across all user sessions and devices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border ${
              autoRefresh 
                ? 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30' 
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Auto-Sync: {autoRefresh ? 'ON (4s)' : 'OFF'}
          </button>

          {isPro && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'audittrail' } }))}
              className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Audit Trail
            </button>
          )}

          {isPro && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'whitelabel' } }))}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              title="Configure Business White Label Branding"
            >
              <Crown className="w-4 h-4 text-amber-600" />
              Branding Settings
            </button>
          )}

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'contacts' } }))}
            className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-600" />
            Google Contacts
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'tasks' } }))}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Google Tasks
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'staff' } }))}
            className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-purple-600" />
            Staff Team
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'clients' } }))}
            className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-purple-600" />
            Firm Clients
          </button>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="bg-[#F8F9FC] hover:bg-[#E2E8F0] text-[#1E293B] border border-[#E2E8F0] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#7C3AED]' : ''}`} />
            Sync Now
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'bookkeeping' } }))}
            className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            Bookkeeping Suite
          </button>

          <button
            id="btn-header-download-report"
            onClick={() => {
              const target = selectedAudit || activeHeatmapAudit || (data?.recentAudits && data.recentAudits[0]) || null;
              if (target) {
                setExportingAudit(target);
              } else {
                handleExportCSV();
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer"
            title="Download signed forensic report as PDF or CSV"
          >
            <FileDown className="w-4 h-4" />
            Download Report
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-slate-100 text-[#1E293B] border border-[#E2E8F0] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2"
            title="Export entire activity log history as CSV"
          >
            <Download className="w-4 h-4 text-[#7C3AED]" />
            Export CSV Log
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
            className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            Portal
          </button>

          <button
            onClick={() => performLogout('User logged out from dashboard.')}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Compliance Session Security Widget */}
      <SessionSecurityWidget />

      {/* Forensic Scanning & Document Attachment Suite */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Forensic Ingestion Mode:
            </span>
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                id="btn-mode-secure-upload"
                type="button"
                onClick={() => setScannerMode('secure-upload')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scannerMode === 'secure-upload'
                    ? 'bg-white text-[#7C3AED] shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Secure File Attachment (PDF / Images)</span>
              </button>

              <button
                id="btn-mode-quick-scanner"
                type="button"
                onClick={() => setScannerMode('quick-scanner')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scannerMode === 'quick-scanner'
                    ? 'bg-white text-[#7C3AED] shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ScanSearch className="w-3.5 h-3.5" />
                <span>Interactive OCR & Camera Scanner</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time Gemini 3.8 Flash Neural Engine Active</span>
          </div>
        </div>

        {scannerMode === 'secure-upload' ? (
          <SecureDocumentUploader
            onScanComplete={() => {
              fetchDashboardData(true);
              syncQuotaState();
            }}
            onViewHeatmap={(audit) => {
              if (audit?.id) {
                setSelectedHeatmapAuditId(audit.id);
              }
              const elem = document.getElementById('heatmap-analytics-section');
              if (elem) {
                elem.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        ) : (
          <AuditScanner />
        )}
      </div>

      <FinancialTools />

      {/* Monthly Audit Quota Progress Bar Component */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white p-6 sm:p-8 rounded-3xl border border-[#334155] shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/20 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl flex items-center justify-center font-bold ${
                isAdmin 
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-400/40' 
                  : isPro 
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                  : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              }`}>
                {isAdmin ? <ShieldCheck className="w-5 h-5" /> : isPro ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                    isAdmin 
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                      : isPro 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                      : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                  }`}>
                    {isAdmin ? 'Super Admin VIP Access' : isPro ? 'Pro Membership Plan' : 'Free Tier Plan'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Monthly Quota Tracker</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Remaining Monthly Audit Quota
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                  Unlimited VIP Access
                </span>
              ) : isPro ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  1,000 Audits / Month
                </span>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/30 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  Upgrade to Pro (1,000 Audits)
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Main Progress Bar Container */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">Quota Usage:</span>
                <span className="text-white text-sm font-mono font-extrabold">
                  {currentUsed.toLocaleString()} <span className="text-slate-400 text-xs font-normal">/ {monthlyLimit.toLocaleString()} audits used</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Remaining Quota:</span>
                <span className={`text-sm font-extrabold font-mono ${
                  remainingAudits === 0 ? 'text-red-400' : remainingAudits < (monthlyLimit * 0.2) ? 'text-amber-300' : 'text-emerald-400'
                }`}>
                  {remainingAudits.toLocaleString()} audits remaining
                </span>
              </div>
            </div>

            {/* Visual Progress Bar Track */}
            <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700 relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                  usagePercent >= 90
                    ? 'bg-gradient-to-r from-red-600 to-red-500'
                    : usagePercent >= 70
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-[#7C3AED] to-[#10B981]'
                }`}
                style={{ width: `${usagePercent}%` }}
              >
                {usagePercent > 0 && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />}
              </div>
            </div>

            {/* Bottom info row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Monthly quota resets on the 1st of next month ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
              <span className="font-mono text-slate-300 font-bold">
                {usagePercent}% of monthly limit consumed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Tenant Billing Telemetry Meter */}
      <MonthlyUsageMeter />

      {/* Primary Realtime Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Feed
            </span>
          </div>
          <h3 className="text-[#64748B] font-bold text-xs uppercase tracking-wider">Total Audits Tracked</h3>
          <p className="text-3xl font-black text-[#1E293B] mt-1">{loading ? '...' : data?.totalAudits || 0}</p>
          <p className="text-xs text-[#64748B] mt-2 font-medium">Scanned by FOR-AI AI</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              {data?.totalAudits ? Math.round(((data?.highRiskCount || 0) / data.totalAudits) * 100) : 0}% High Risk
            </span>
          </div>
          <h3 className="text-[#64748B] font-bold text-xs uppercase tracking-wider">High Risk / Fraud Red Flags</h3>
          <p className="text-3xl font-black text-red-600 mt-1">{loading ? '...' : data?.highRiskCount || 0}</p>
          <p className="text-xs text-[#64748B] mt-2 font-medium">Requiring immediate audit review</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Score / 100
            </span>
          </div>
          <h3 className="text-[#64748B] font-bold text-xs uppercase tracking-wider">Avg Fraud Risk Score</h3>
          <p className="text-3xl font-black text-[#1E293B] mt-1">{loading ? '...' : `${data?.avgRiskScore || 0} / 100`}</p>
          <p className="text-xs text-[#64748B] mt-2 font-medium">System-wide mean risk level</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
              Active
            </span>
          </div>
          <h3 className="text-[#64748B] font-bold text-xs uppercase tracking-wider">Active Scanning Sessions</h3>
          <p className="text-3xl font-black text-[#1E293B] mt-1">{loading ? '...' : data?.activeSessions || 1}</p>
          <p className="text-xs text-[#64748B] mt-2 font-medium">Current active user sessions</p>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Level Distribution Chart */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-[#1E293B] text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#7C3AED]" />
                Risk Level Distribution
              </h3>
              <p className="text-xs text-[#64748B]">Breakdown of scanned documents by forensic risk rating</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', border: 'none' }}
                  itemStyle={{ color: '#FFF' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Type Distribution Chart */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-[#1E293B] text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#7C3AED]" />
              Document Categories
            </h3>
            <p className="text-xs text-[#64748B]">Document classification metrics</p>
          </div>

          <div className="space-y-3 pt-2">
            {typeChartData.length === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-10">No categories recorded yet.</p>
            ) : (
              typeChartData.map((item, i) => {
                const total = data?.totalAudits || 1;
                const percentage = Math.round((item.count / total) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#1E293B]">
                      <span>{item.name}</span>
                      <span>{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#7C3AED] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Flagged Discrepancies & Document Audit Trends Visualization */}
      <DiscrepancyTrendAnalytics 
        audits={data?.recentAudits || []}
        totalAudits={data?.totalAudits || 0}
        highRiskCount={data?.highRiskCount || 0}
        avgRiskScore={data?.avgRiskScore || 0}
      />

      {/* Visual Document Fraud Heatmap Showcase */}
      <div id="heatmap-analytics-section" className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-extrabold text-[#1E293B] text-xl">
                AI Visual Document Heatmap
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                SVG Fraud Overlays
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
              Real-time SVG heat dissipation and high-risk target overlays on audited documents, highlighting sections flagged for forgery, tax non-compliance, and wire tampering.
            </p>
          </div>

          {/* Document Switcher Selector & Download Report Button */}
          {data?.recentAudits && data.recentAudits.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#64748B] whitespace-nowrap">Select Scan:</span>
              <select
                value={activeHeatmapAudit?.id || ''}
                onChange={(e) => {
                  const target = data.recentAudits.find(a => a.id === e.target.value);
                  if (target) {
                    setSelectedHeatmapAuditId(target.id);
                    setActiveFindingIndex(null);
                  }
                }}
                className="bg-[#F8F9FC] border border-[#E2E8F0] text-[#1E293B] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#7C3AED] max-w-xs truncate shadow-xs"
              >
                {data.recentAudits.map(audit => (
                  <option key={audit.id} value={audit.id}>
                    {audit.documentName} ({audit.riskScore}/100 - {audit.riskLevel} Risk)
                  </option>
                ))}
              </select>

              {activeHeatmapAudit && (
                <button
                  id="btn-heatmap-download-report"
                  type="button"
                  onClick={() => setExportingAudit(activeHeatmapAudit)}
                  className="bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Download signed forensic report or CSV for this document"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Download Report</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Heatmap Component */}
        {activeHeatmapAudit ? (
          <div className="space-y-3">
            <DocumentHeatmapOverlay
              documentName={activeHeatmapAudit.documentName}
              documentType={activeHeatmapAudit.documentType}
              riskScore={activeHeatmapAudit.riskScore}
              riskLevel={activeHeatmapAudit.riskLevel}
              summary={activeHeatmapAudit.summary}
              findings={activeHeatmapAudit.findings}
              keyMetrics={activeHeatmapAudit.keyMetrics}
              imageUrl={activeHeatmapAudit.imageUrl}
              onFindingSelect={(f, idx) => {
                setActiveFindingIndex(idx);
              }}
              selectedFindingIndex={activeFindingIndex}
            />
          </div>
        ) : (
          <div className="p-10 text-center bg-[#F8F9FC] rounded-2xl border border-dashed border-[#CBD5E1] text-[#64748B]">
            <Flame className="w-10 h-10 mx-auto text-[#94A3B8] mb-2" />
            <p className="font-bold text-sm">No audit documents available for heatmap visualization yet.</p>
            <p className="text-xs mt-1">Upload an invoice or document to generate visual SVG heatmap overlays.</p>
          </div>
        )}
      </div>

      {/* Main Realtime Audit Activity Table */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-6 border-b border-[#E2E8F0] bg-[#F8F9FC] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-[#1E293B] text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#7C3AED]" />
              Live Audit Activity Log
            </h3>
            <span className="text-xs font-bold bg-[#7C3AED]/10 text-[#7C3AED] px-2.5 py-0.5 rounded-full">
              {filteredAudits.length} Records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search document title or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#7C3AED] transition-all text-[#1E293B]"
              />
            </div>

            {/* Risk Level Filter */}
            <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] p-1 rounded-xl text-xs font-bold">
              <Filter className="w-3.5 h-3.5 ml-1.5 text-[#64748B]" />
              {['All', 'Critical', 'High', 'Moderate', 'Low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    riskFilter === level 
                      ? 'bg-[#7C3AED] text-white' 
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Clear Logs Button */}
            <button
              onClick={handleClearLogs}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
              title="Clear Activity Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Document Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Risk Score</th>
                <th className="p-4">Detected Vendor / Amount</th>
                <th className="p-4">Red Flags</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#64748B]">
                    <FileText className="w-10 h-10 mx-auto text-[#CBD5E1] mb-2" />
                    <p className="font-bold">No audited document logs match your filter criteria.</p>
                    <p className="text-xs mt-1">Try resetting search filters or scanning a new document on the front page scanner.</p>
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-[#F8F9FC] transition-colors">
                    <td className="p-4 font-mono text-[#64748B] whitespace-nowrap">
                      {new Date(audit.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <div className="text-[10px] text-[#94A3B8]">{new Date(audit.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-bold text-[#1E293B]">
                      <div className="max-w-xs truncate">{audit.documentName || 'Untitled Document'}</div>
                      <div className="text-[10px] font-mono text-[#94A3B8]">ID: {audit.id}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white border border-[#E2E8F0] text-[#475569]">
                        {audit.documentType || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-xs border ${getRiskBadgeColor(audit.riskLevel)}`}>
                        {audit.riskScore} / 100 ({audit.riskLevel})
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[#1E293B]">{audit.keyMetrics?.detectedVendor || 'Vendor Check Complete'}</div>
                      <div className="text-[11px] font-semibold text-[#10B981]">{audit.keyMetrics?.detectedAmount || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      {audit.findingsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {audit.findingsCount} Flags
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Clean
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAudit(audit);
                            setModalTab('heatmap');
                            setActiveFindingIndex(null);
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                          title="View visual SVG fraud heatmap"
                        >
                          <Flame className="w-3.5 h-3.5 text-red-500" />
                          Heatmap
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAudit(audit);
                            setModalTab('report');
                          }}
                          className="bg-[#7C3AED]/10 hover:bg-[#7C3AED] text-[#7C3AED] hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                          title="Inspect full audit report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Report
                        </button>
                        <button
                          id={`btn-table-download-${audit.id}`}
                          onClick={() => setExportingAudit(audit)}
                          className="bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Download signed PDF certificate or CSV report for this document"
                        >
                          <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Audit Detail Modal with Visual Heatmap */}
      <AnimatePresence>
        {selectedAudit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 border border-[#E2E8F0] shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedAudit(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">FOR-AI Forensic Report & Heatmap</span>
                <span className="text-xs text-[#94A3B8]">• {new Date(selectedAudit.timestamp).toLocaleString()}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pr-10">
                <h3 className="text-2xl font-black text-[#1E293B] truncate">
                  {selectedAudit.documentName}
                </h3>

                {/* Tab Switcher */}
                <div className="flex items-center p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] text-xs font-bold shrink-0">
                  <button
                    onClick={() => setModalTab('heatmap')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      modalTab === 'heatmap'
                        ? 'bg-white text-red-600 shadow-xs border border-red-200'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-red-500" />
                    Visual Heatmap
                  </button>
                  <button
                    onClick={() => setModalTab('report')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      modalTab === 'report'
                        ? 'bg-white text-[#7C3AED] shadow-xs border border-[#E2E8F0]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Executive Findings ({selectedAudit.findings.length})
                  </button>
                </div>
              </div>

              {/* Modal Body Container with Scroll */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-6">
                {modalTab === 'heatmap' ? (
                  <div className="space-y-4">
                    <DocumentHeatmapOverlay
                      documentName={selectedAudit.documentName}
                      documentType={selectedAudit.documentType}
                      riskScore={selectedAudit.riskScore}
                      riskLevel={selectedAudit.riskLevel}
                      summary={selectedAudit.summary}
                      findings={selectedAudit.findings}
                      keyMetrics={selectedAudit.keyMetrics}
                      imageUrl={selectedAudit.imageUrl}
                      onFindingSelect={(f, idx) => {
                        setActiveFindingIndex(idx);
                      }}
                      selectedFindingIndex={activeFindingIndex}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Banners */}
                    <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-[#F8F9FC] border border-[#E2E8F0]">
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase">Calculated Risk Score</span>
                        <div className="text-2xl font-extrabold text-[#1E293B]">
                          {selectedAudit.riskScore} <span className="text-xs text-[#64748B]">/ 100</span>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-[#E2E8F0]" />

                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase">Forensic Classification</span>
                        <div className="mt-0.5">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs border ${getRiskBadgeColor(selectedAudit.riskLevel)}`}>
                            {selectedAudit.riskLevel} Risk
                          </span>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-[#E2E8F0]" />

                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase">Document Type</span>
                        <div className="text-sm font-bold text-[#1E293B] mt-0.5">{selectedAudit.documentType}</div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    {selectedAudit.keyMetrics && (
                      <div className="grid grid-cols-2 gap-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
                        <div>
                          <span className="font-bold text-[#64748B]">Detected Vendor:</span>
                          <p className="font-extrabold text-[#1E293B] text-sm">{selectedAudit.keyMetrics.detectedVendor || 'Verified'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-[#64748B]">Detected Amount:</span>
                          <p className="font-extrabold text-[#10B981] text-sm">{selectedAudit.keyMetrics.detectedAmount || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div>
                      <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-2">Executive Audit Summary</h4>
                      <p className="text-sm text-[#475569] leading-relaxed bg-[#F8F9FC] p-4 rounded-2xl border border-[#E2E8F0]">
                        {selectedAudit.summary}
                      </p>
                    </div>

                    {/* Findings List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                        Itemized Forensic Findings ({selectedAudit.findings.length})
                      </h4>
                      {selectedAudit.findings.map((f, i) => (
                        <div key={i} className="p-4 rounded-2xl border border-[#E2E8F0] bg-white space-y-1.5 shadow-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-[#1E293B] flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              {f.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getSeverityBadge(f.severity)}`}>
                              {f.severity}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B]">{f.description}</p>
                          <div className="text-xs text-[#7C3AED] font-semibold pt-1 border-t border-gray-100 flex items-center justify-between">
                            <span><strong>Remediation:</strong> {f.recommendation}</span>
                            <button
                              onClick={() => {
                                setModalTab('heatmap');
                                setActiveFindingIndex(i);
                              }}
                              className="text-red-600 hover:text-red-700 font-bold text-[11px] underline ml-2"
                            >
                              View on Heatmap →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[#E2E8F0] mt-4">
                <div className="text-xs text-[#64748B]">
                  {modalTab === 'heatmap' ? (
                    <span className="flex items-center gap-1 text-red-600 font-medium">
                      <Flame className="w-3.5 h-3.5" /> High-risk sections highlighted with SVG gradients & targets
                    </span>
                  ) : (
                    <span>Audit Log ID: <span className="font-mono text-[#1E293B] font-bold">{selectedAudit.id}</span></span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    id="btn-inspect-export-csv"
                    type="button"
                    onClick={() => {
                      exportAuditAsCsv({
                        documentName: selectedAudit.documentName,
                        timestamp: selectedAudit.timestamp,
                        riskScore: selectedAudit.riskScore,
                        riskLevel: selectedAudit.riskLevel,
                        documentType: selectedAudit.documentType,
                        summary: selectedAudit.summary,
                        findings: selectedAudit.findings,
                        keyMetrics: selectedAudit.keyMetrics
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Export itemized audit analysis as CSV spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    id="btn-inspect-download-pdf"
                    type="button"
                    onClick={() => setExportingAudit(selectedAudit)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
                    title="Generate and download certified signed PDF report"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Signed PDF</span>
                  </button>

                  <button
                    onClick={() => setSelectedAudit(null)}
                    className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Signed PDF / CSV Report Modal */}
      {exportingAudit && (
        <ExportPdfReportModal
          isOpen={Boolean(exportingAudit)}
          onClose={() => setExportingAudit(null)}
          documentName={exportingAudit.documentName}
          auditResult={{
            riskScore: exportingAudit.riskScore,
            riskLevel: (['Low', 'Moderate', 'High', 'Critical'].includes(exportingAudit.riskLevel) ? (exportingAudit.riskLevel as any) : 'Low'),
            documentType: exportingAudit.documentType || 'Financial Document',
            summary: exportingAudit.summary || 'Forensic examination completed.',
            findings: (exportingAudit.findings || []).map(f => ({
              category: f.category || 'Forensic Finding',
              title: f.title,
              description: f.description,
              severity: (['low', 'medium', 'high', 'critical'].includes(f.severity?.toLowerCase()) ? (f.severity.toLowerCase() as any) : 'medium'),
              recommendation: f.recommendation || 'Verify documentation with issuing counterparty.'
            })),
            keyMetrics: exportingAudit.keyMetrics
          }}
        />
      )}

      {/* White Label Branding Modal */}
      <WhiteLabelModal
        isOpen={showWhiteLabelModal}
        onClose={() => setShowWhiteLabelModal(false)}
      />
    </div>
  );
}
