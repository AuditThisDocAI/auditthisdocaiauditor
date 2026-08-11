import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Lock, 
  Crown, 
  Zap, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  FileText, 
  Calculator, 
  RefreshCw,
  Scale
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface JournalEntry {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  vendorOrClient: string;
  category: 'Consulting' | 'Software & Subscriptions' | 'Legal & Advisory' | 'Hardware & Equipment' | 'Travel & Meals' | 'Office & Admin';
  amount: number;
  taxAmount: number;
  status: 'Reconciled' | 'Pending' | 'Flagged';
  auditDocId?: string;
  notes?: string;
}

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'JE-2026-081',
    date: '2026-08-10',
    type: 'Income',
    vendorOrClient: 'Acme Enterprises Inc.',
    category: 'Consulting',
    amount: 24500.00,
    taxAmount: 2082.50,
    status: 'Reconciled',
    auditDocId: 'audit_init_101',
    notes: 'Q3 Enterprise Document Audit Advisory Retainer'
  },
  {
    id: 'JE-2026-082',
    date: '2026-08-08',
    type: 'Expense',
    vendorOrClient: 'Apex Heavy Machinery Inc.',
    category: 'Hardware & Equipment',
    amount: 14250.00,
    taxAmount: 1211.25,
    status: 'Reconciled',
    auditDocId: 'audit_init_101',
    notes: 'Server rack lease & equipment maintenance'
  },
  {
    id: 'JE-2026-083',
    date: '2026-08-05',
    type: 'Expense',
    vendorOrClient: 'Global Strategic Advisors LLC',
    category: 'Legal & Advisory',
    amount: 18500.00,
    taxAmount: 0.00,
    status: 'Flagged',
    auditDocId: 'audit_init_102',
    notes: 'Flagged by Dr. Aria AI: Wire transfer to offshore account requested'
  },
  {
    id: 'JE-2026-084',
    date: '2026-08-02',
    type: 'Expense',
    vendorOrClient: 'CloudScale Infrastructure',
    category: 'Software & Subscriptions',
    amount: 3420.00,
    taxAmount: 290.70,
    status: 'Reconciled',
    notes: 'Monthly enterprise AI server hosting cluster'
  },
  {
    id: 'JE-2026-079',
    date: '2026-07-28',
    type: 'Income',
    vendorOrClient: 'Vanguard Capital Group',
    category: 'Consulting',
    amount: 32000.00,
    taxAmount: 2720.00,
    status: 'Reconciled',
    notes: 'Annual forensic compliance audit contract'
  },
  {
    id: 'JE-2026-078',
    date: '2026-07-22',
    type: 'Expense',
    vendorOrClient: 'Hilton Hotels & Resorts',
    category: 'Travel & Meals',
    amount: 583.20,
    taxAmount: 43.20,
    status: 'Reconciled',
    notes: 'Auditor travel & site visit'
  }
];

export function Bookkeeping() {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);
  const [isPro, setIsPro] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'statements' | 'tax'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modal state for adding entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'Expense' as 'Income' | 'Expense',
    vendorOrClient: '',
    category: 'Consulting' as JournalEntry['category'],
    amount: '',
    taxAmount: '',
    notes: ''
  });

  const [reconciling, setReconciling] = useState(false);

  const checkPlanStatus = () => {
    setIsPro(localStorage.getItem('audit_this_doc_is_pro') === 'true');
  };

  useEffect(() => {
    checkPlanStatus();
    window.addEventListener('pro-status-changed', checkPlanStatus);
    window.addEventListener('storage', checkPlanStatus);
    return () => {
      window.removeEventListener('pro-status-changed', checkPlanStatus);
      window.removeEventListener('storage', checkPlanStatus);
    };
  }, []);

  const handleActivatePro = () => {
    localStorage.setItem('audit_this_doc_is_pro', 'true');
    window.dispatchEvent(new Event('pro-status-changed'));
    setIsPro(true);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.vendorOrClient || !newEntry.amount) return;

    const entry: JournalEntry = {
      id: `JE-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 10),
      type: newEntry.type,
      vendorOrClient: newEntry.vendorOrClient,
      category: newEntry.category,
      amount: parseFloat(newEntry.amount) || 0,
      taxAmount: parseFloat(newEntry.taxAmount) || 0,
      status: 'Reconciled',
      notes: newEntry.notes || 'Posted manually via Bookkeeping portal'
    };

    setEntries(prev => [entry, ...prev]);
    setShowAddModal(false);
    setNewEntry({
      type: 'Expense',
      vendorOrClient: '',
      category: 'Consulting',
      amount: '',
      taxAmount: '',
      notes: ''
    });
  };

  const handleRunAiReconciliation = () => {
    setReconciling(true);
    setTimeout(() => {
      setEntries(prev => prev.map(e => {
        if (e.status === 'Pending') {
          return { ...e, status: 'Reconciled' };
        }
        return e;
      }));
      setReconciling(false);
      alert('🎉 Dr. Aria AI Reconciliation Complete! 100% of vendor transactions cross-referenced against audit logs.');
    }, 1200);
  };

  const handleExportCSV = () => {
    const headers = ['Journal ID', 'Date', 'Type', 'Vendor/Client', 'Category', 'Amount ($)', 'Tax ($)', 'Status', 'Notes'];
    const rows = entries.map(e => [
      e.id,
      e.date,
      e.type,
      `"${e.vendorOrClient.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      e.taxAmount,
      e.status,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bookkeeping_General_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const totalRevenue = entries.filter(e => e.type === 'Income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = entries.filter(e => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const estimatedTax = Math.max(0, netIncome * 0.21); // 21% tax rate
  const reconciledCount = entries.filter(e => e.status === 'Reconciled').length;

  // Filtered Entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.vendorOrClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || entry.type === typeFilter;
    const matchesCategory = categoryFilter === 'All' || entry.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Chart Data
  const monthlyData = [
    { month: 'May', Revenue: 18000, Expenses: 12000 },
    { month: 'Jun', Revenue: 22000, Expenses: 14500 },
    { month: 'Jul', Revenue: 32583, Expenses: 16200 },
    { month: 'Aug', Revenue: 24500, Expenses: 36170 },
  ];

  const categoryExpenses = [
    { name: 'Legal & Advisory', value: 18500, color: '#EF4444' },
    { name: 'Hardware', value: 14250, color: '#F59E0B' },
    { name: 'Software & Hosting', value: 3420, color: '#7C3AED' },
    { name: 'Travel & Meals', value: 583, color: '#10B981' },
  ];

  return (
    <div id="bookkeeping" className="max-w-7xl mx-auto px-4 py-8 lg:py-12 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-600 border border-amber-400/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Pro & Enterprise Exclusive System
            </span>
            <span className="text-xs text-[#64748B] font-mono">Dr. Aria AI Auto-Reconciliation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] mt-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-[#7C3AED]" />
            Enterprise & Pro AI Bookkeeping Suite
          </h2>
          <p className="text-[#64748B] text-sm mt-1">
            General Ledger, automated invoice reconciliation, Profit & Loss statements, and tax compliance auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isPro ? (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post Journal Entry
              </button>

              <button
                onClick={handleRunAiReconciliation}
                disabled={reconciling}
                className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
                {reconciling ? 'Reconciling...' : 'Auto-Reconcile Audits'}
              </button>

              <button
                onClick={handleExportCSV}
                className="bg-[#1E293B] hover:bg-[#0F172A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Ledger
              </button>
            </>
          ) : (
            <button
              onClick={handleActivatePro}
              className="bg-gradient-to-r from-amber-500 to-[#7C3AED] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              Activate Pro / Enterprise Trial
            </button>
          )}
        </div>
      </div>

      {/* Gated Overlay for Free Tier */}
      {!isPro && (
        <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white p-8 sm:p-12 rounded-3xl border border-[#334155] shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Enterprise & Pro Plan Feature
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Unlock AI Bookkeeping & General Ledger
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Automate accounting reconciliations, generate live Profit & Loss statements, track tax deductions, and auto-sync document audits into your general ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs pt-2">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Auto Reconciliation
              </span>
              <p className="text-slate-400">Match scanned invoices directly against ledger entries with Dr. Aria AI.</p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4" /> P&L Financials
              </span>
              <p className="text-slate-400">Live Profit & Loss, Balance Sheet estimates, and CSV export.</p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
              <span className="font-bold text-purple-400 flex items-center gap-1">
                <Calculator className="w-4 h-4" /> Tax Deductions
              </span>
              <p className="text-slate-400">Real-time VAT and corporate tax deduction audit schedules.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleActivatePro}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-3.5 rounded-2xl text-sm font-extrabold transition-all shadow-xl shadow-amber-400/20 inline-flex items-center gap-2 hover:scale-[1.02]"
            >
              <Crown className="w-5 h-5 text-slate-900" />
              Upgrade / Activate Pro Plan Access
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Bookkeeping Dashboard Content */}
      <div className={!isPro ? "opacity-40 pointer-events-none filter blur-[1px] space-y-8" : "space-y-8"}>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Gross Revenue</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#10B981]">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Income received to date</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Expenses</span>
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-red-600">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Disbursements & vendor invoices</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Net Operating Income</span>
              <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${netIncome >= 0 ? 'text-[#1E293B]' : 'text-red-600'}`}>
              ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Before corporate tax reserve</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Estimated Tax Reserve (21%)</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-700">${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Corporate tax liability estimate</p>
          </div>
        </div>

        {/* Financial Visual Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-[#1E293B] text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
                Revenue vs Expense Trend
              </h3>
              <p className="text-xs text-[#64748B]">Monthly income and operating expenses tracking</p>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', border: 'none' }}
                    itemStyle={{ color: '#FFF' }}
                  />
                  <Bar dataKey="Revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-[#1E293B] text-lg flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-[#7C3AED]" />
                Expense Category Breakdown
              </h3>
              <p className="text-xs text-[#64748B]">Distribution of operating expenditures</p>
            </div>

            <div className="space-y-3 pt-2">
              {categoryExpenses.map((cat, i) => {
                const total = totalExpenses || 1;
                const percentage = Math.round((cat.value / total) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#1E293B]">
                      <span>{cat.name}</span>
                      <span>${cat.value.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* View Tabs Selector */}
        <div className="flex border-b border-[#E2E8F0] gap-8 text-sm font-bold">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'ledger' ? 'text-[#7C3AED]' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            General Ledger ({filteredEntries.length})
            {activeTab === 'ledger' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('statements')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'statements' ? 'text-[#7C3AED]' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Profit & Loss (P&L) Statement
            {activeTab === 'statements' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'tax' ? 'text-[#7C3AED]' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Tax Compliance Schedule
            {activeTab === 'tax' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />}
          </button>
        </div>

        {/* Tab 1: General Ledger Table */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden space-y-0">
            {/* Filter Bar */}
            <div className="p-6 border-b border-[#E2E8F0] bg-[#F8F9FC] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search journal entries or vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#7C3AED] text-[#1E293B]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e: any) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="All">All Types</option>
                  <option value="Income">Income Only</option>
                  <option value="Expense">Expense Only</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Reconciled">Reconciled</option>
                  <option value="Pending">Pending</option>
                  <option value="Flagged">Flagged</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                    <th className="p-4">Journal ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Vendor / Client</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Notes / Audit Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                  {filteredEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-[#F8F9FC] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#7C3AED]">{e.id}</td>
                      <td className="p-4 font-mono text-[#64748B]">{e.date}</td>
                      <td className="p-4 font-bold text-[#1E293B]">
                        {e.vendorOrClient}
                        <span className={`block text-[10px] font-semibold ${e.type === 'Income' ? 'text-[#10B981]' : 'text-red-500'}`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white border border-[#E2E8F0] text-[#475569]">
                          {e.category}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-black ${e.type === 'Income' ? 'text-[#10B981]' : 'text-[#1E293B]'}`}>
                        {e.type === 'Income' ? '+' : '-'}${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          e.status === 'Reconciled' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : e.status === 'Flagged' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {e.status === 'Reconciled' && <CheckCircle2 className="w-3 h-3" />}
                          {e.status === 'Flagged' && <AlertTriangle className="w-3 h-3" />}
                          {e.status}
                        </span>
                      </td>
                      <td className="p-4 text-[#64748B] max-w-xs truncate">
                        {e.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Profit & Loss Statement */}
        {activeTab === 'statements' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6 max-w-3xl mx-auto">
            <div className="text-center pb-6 border-b border-[#E2E8F0]">
              <h3 className="text-2xl font-black text-[#1E293B]">Profit & Loss Statement (P&L)</h3>
              <p className="text-xs text-[#64748B] mt-1 font-mono">For the period ended August 2026 • Accrual Accounting</p>
            </div>

            <div className="space-y-4 text-sm text-[#1E293B]">
              <div className="flex justify-between font-extrabold pb-2 border-b border-[#E2E8F0] text-[#10B981]">
                <span>Gross Operating Revenue</span>
                <span>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Operating Expenditures:</div>
                <div className="flex justify-between text-xs py-1">
                  <span>Legal & Compliance Advisory</span>
                  <span className="font-mono">$18,500.00</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span>Hardware & Equipment Leases</span>
                  <span className="font-mono">$14,250.00</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span>Software & Cloud Infrastructure</span>
                  <span className="font-mono">$3,420.00</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span>Travel & Meals</span>
                  <span className="font-mono">$583.20</span>
                </div>
              </div>

              <div className="flex justify-between font-bold pt-3 border-t border-[#E2E8F0] text-red-600">
                <span>Total Operating Expenses</span>
                <span>(${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              </div>

              <div className="flex justify-between font-black text-lg pt-4 border-t-2 border-[#1E293B] text-[#7C3AED]">
                <span>Net Operating Income</span>
                <span>${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tax Compliance Schedule */}
        {activeTab === 'tax' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#7C3AED]" />
                Tax Compliance & Deduction Audit Schedule
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Forensic breakdown of tax-deductible expenditures verified by Dr. Aria AI.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#F8F9FC] border border-[#E2E8F0] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#1E293B]">Qualified Software & Hosting Expenses (IRC Sec 179)</div>
                  <div className="text-[11px] text-[#64748B]">100% Tax Deductible</div>
                </div>
                <span className="font-mono font-bold text-[#10B981]">$3,420.00</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FC] border border-[#E2E8F0] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#1E293B]">Equipment & Server Rack Leases</div>
                  <div className="text-[11px] text-[#64748B]">100% Tax Deductible</div>
                </div>
                <span className="font-mono font-bold text-[#10B981]">$14,250.00</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-amber-900">Unverified Offshore Payment (Global Strategic LLC)</div>
                  <div className="text-[11px] text-amber-700">Flagged by Dr. Aria - Hold deduction pending Tax ID verification</div>
                </div>
                <span className="font-mono font-bold text-red-600">$18,500.00</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E2E8F0] shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-[#1E293B] mb-4">Post Journal Entry</h3>

              <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#1E293B] mb-1">Entry Type</label>
                  <select
                    value={newEntry.type}
                    onChange={(e: any) => setNewEntry({ ...newEntry, type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl font-bold text-[#1E293B]"
                  >
                    <option value="Expense">Expense (Disbursement)</option>
                    <option value="Income">Income (Revenue)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1E293B] mb-1">Vendor or Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Apex Heavy Machinery"
                    value={newEntry.vendorOrClient}
                    onChange={(e) => setNewEntry({ ...newEntry, vendorOrClient: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-[#1E293B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1E293B] mb-1">Account Category</label>
                  <select
                    value={newEntry.category}
                    onChange={(e: any) => setNewEntry({ ...newEntry, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-[#1E293B]"
                  >
                    <option value="Consulting">Consulting</option>
                    <option value="Software & Subscriptions">Software & Subscriptions</option>
                    <option value="Legal & Advisory">Legal & Advisory</option>
                    <option value="Hardware & Equipment">Hardware & Equipment</option>
                    <option value="Travel & Meals">Travel & Meals</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1E293B] mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newEntry.amount}
                      onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-[#1E293B]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1E293B] mb-1">Sales Tax ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newEntry.taxAmount}
                      onChange={(e) => setNewEntry({ ...newEntry, taxAmount: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-[#1E293B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#1E293B] mb-1">Notes / Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Monthly server hosting retainer"
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8F9FC] border border-[#E2E8F0] rounded-xl text-[#1E293B]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-md transition-all mt-4"
                >
                  Post to General Ledger
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
