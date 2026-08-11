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
  ShieldCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

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
    category: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }>;
  keyMetrics?: {
    detectedVendor?: string;
    detectedAmount?: string;
    detectedDate?: string;
    missingFields?: string[];
  };
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

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [usedCount, setUsedCount] = useState(0);

  const syncQuotaState = () => {
    const proStatus = localStorage.getItem('audit_this_doc_is_pro') === 'true';
    setIsPro(proStatus);
    const count = parseInt(localStorage.getItem('audit_this_doc_free_count') || '0', 10);
    setUsedCount(count);
  };

  useEffect(() => {
    syncQuotaState();
    window.addEventListener('pro-status-changed', syncQuotaState);
    window.addEventListener('storage', syncQuotaState);
    return () => {
      window.removeEventListener('pro-status-changed', syncQuotaState);
      window.removeEventListener('storage', syncQuotaState);
    };
  }, []);

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: 'monthly', plan: 'pro_monthly' })
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard stats:', err);
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
        console.error('Failed to clear logs:', err);
      }
    }
  };

  const handleExportCSV = () => {
    if (!data || !data.recentAudits.length) {
      alert('No audit log records available to export.');
      return;
    }

    const headers = ['Audit ID', 'Timestamp', 'Document Name', 'Type', 'Risk Score', 'Risk Level', 'Detected Vendor', 'Detected Amount', 'Findings Count'];
    const rows = data.recentAudits.map(a => [
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
    link.setAttribute('download', `AuditThisDoc_Live_Audit_Log_${new Date().toISOString().slice(0,10)}.csv`);
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

  const monthlyLimit = isPro ? 1000 : 10;
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
            Live stream of documents scanned by Dr. Aria AI across all user sessions and devices.
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

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="bg-[#F8F9FC] hover:bg-[#E2E8F0] text-[#1E293B] border border-[#E2E8F0] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#7C3AED]' : ''}`} />
            Sync Now
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV Log
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
            className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            Back to Portal
          </button>
        </div>
      </div>

      {/* Monthly Audit Quota Progress Bar Component */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white p-6 sm:p-8 rounded-3xl border border-[#334155] shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/20 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl flex items-center justify-center font-bold ${
                isPro ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              }`}>
                {isPro ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                    isPro ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                  }`}>
                    {isPro ? 'Pro Membership Plan' : 'Free Tier Plan'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Monthly Quota Tracker</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Remaining Monthly Audit Quota
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isPro ? (
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
                style={{ width: `${Math.max(3, usagePercent)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
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
          <p className="text-xs text-[#64748B] mt-2 font-medium">Scanned by Dr. Aria AI</p>
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
                      <button
                        onClick={() => setSelectedAudit(audit)}
                        className="bg-[#7C3AED]/10 hover:bg-[#7C3AED] text-[#7C3AED] hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Audit Detail Modal */}
      <AnimatePresence>
        {selectedAudit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#E2E8F0] shadow-2xl relative my-8"
            >
              <button
                onClick={() => setSelectedAudit(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">Dr. Aria Forensic Report</span>
                <span className="text-xs text-[#94A3B8]">• {new Date(selectedAudit.timestamp).toLocaleString()}</span>
              </div>

              <h3 className="text-2xl font-black text-[#1E293B] mb-4">
                {selectedAudit.documentName}
              </h3>

              {/* Banners */}
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-[#F8F9FC] border border-[#E2E8F0] mb-6">
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
                <div className="grid grid-cols-2 gap-3 mb-6 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
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
              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-2">Executive Audit Summary</h4>
                <p className="text-sm text-[#475569] leading-relaxed bg-[#F8F9FC] p-4 rounded-2xl border border-[#E2E8F0]">
                  {selectedAudit.summary}
                </p>
              </div>

              {/* Findings List */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  Itemized Forensic Findings ({selectedAudit.findings.length})
                </h4>
                {selectedAudit.findings.map((f, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-[#E2E8F0] bg-white space-y-1.5">
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
                    <div className="text-xs text-[#7C3AED] font-semibold pt-1 border-t border-gray-100">
                      <strong>Remediation:</strong> {f.recommendation}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
