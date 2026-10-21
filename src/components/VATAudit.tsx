import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Scale, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Lock, 
  Crown, 
  CreditCard, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  X, 
  Trash2, 
  AlertTriangle,
  Globe,
  Percent,
  Check,
  Building
} from 'lucide-react';
import { isUserPro } from '../lib/authUtils';
import { useCurrency } from '../lib/currency';
import { 
  VATTransaction, 
  getVATTransactions, 
  saveVATTransaction, 
  deleteVATTransaction, 
  resetVATTransactions, 
  runVATForensicAudit 
} from '../lib/payrollVatService';

export function VATAudit() {
  const [isPro, setIsPro] = useState(isUserPro());
  const { currencyConfig } = useCurrency();
  const [transactions, setTransactions] = useState<VATTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('ALL');
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditResult, setLastAuditResult] = useState<{
    totalRisks: number;
    outputVatTotal: number;
    inputVatTotal: number;
    netVatBalance: number;
    complianceScore: number;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<VATTransaction | null>(null);
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCounterparty, setFormCounterparty] = useState('');
  const [formTaxId, setFormTaxId] = useState('4920192831');
  const [formType, setFormType] = useState<VATTransaction['type']>('OUTPUT_SALES');
  const [formCategory, setFormCategory] = useState<VATTransaction['category']>('Standard Goods');
  const [formNetAmount, setFormNetAmount] = useState<number>(10000);
  const [formVatRate, setFormVatRate] = useState<number>(15);
  const [formJurisdiction, setFormJurisdiction] = useState<VATTransaction['jurisdiction']>('ZA_SARS');

  const computedVat = Number(((formNetAmount * formVatRate) / 100).toFixed(2));
  const computedGross = Number((formNetAmount + computedVat).toFixed(2));

  const loadData = () => {
    const list = getVATTransactions();
    setTransactions(list);
    const auditRes = runVATForensicAudit(list);
    setLastAuditResult({
      totalRisks: auditRes.totalRisks,
      outputVatTotal: auditRes.outputVatTotal,
      inputVatTotal: auditRes.inputVatTotal,
      netVatBalance: auditRes.netVatBalance,
      complianceScore: auditRes.complianceScore
    });
  };

  useEffect(() => {
    const checkPro = () => setIsPro(isUserPro());
    checkPro();
    loadData();

    window.addEventListener('pro-status-changed', checkPro);
    window.addEventListener('vat-records-updated', loadData);
    return () => {
      window.removeEventListener('pro-status-changed', checkPro);
      window.removeEventListener('vat-records-updated', loadData);
    };
  }, []);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const res = runVATForensicAudit(transactions);
      setTransactions(res.auditedTransactions);
      setLastAuditResult({
        totalRisks: res.totalRisks,
        outputVatTotal: res.outputVatTotal,
        inputVatTotal: res.inputVatTotal,
        netVatBalance: res.netVatBalance,
        complianceScore: res.complianceScore
      });
      setIsAuditing(false);
    }, 700);
  };

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setFormInvoiceRef(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCounterparty('');
    setFormTaxId(formJurisdiction === 'ZA_SARS' ? '4110829104' : 'GB982301948');
    setFormType('OUTPUT_SALES');
    setFormCategory('Standard Goods');
    setFormNetAmount(15000);
    setFormVatRate(formJurisdiction === 'ZA_SARS' ? 15 : 20);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCounterparty.trim()) return;

    const newTx: VATTransaction = {
      id: editingTx ? editingTx.id : `VAT-TX-${Math.floor(100 + Math.random() * 900)}`,
      invoiceRef: formInvoiceRef.trim() || `INV-${Date.now().toString().slice(-4)}`,
      date: formDate,
      counterparty: formCounterparty.trim(),
      taxId: formTaxId.trim(),
      type: formType,
      category: formCategory,
      netAmount: Number(formNetAmount) || 0,
      vatRate: Number(formVatRate) || 0,
      vatAmount: computedVat,
      grossAmount: computedGross,
      jurisdiction: formJurisdiction,
      verificationStatus: 'Verified',
      anomalyFlags: []
    };

    saveVATTransaction(newTx);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this VAT ledger entry?')) {
      deleteVATTransaction(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Invoice Ref',
      'Date',
      'Counterparty',
      'Tax ID / VAT No',
      'Type (Output vs Input)',
      'Category',
      'Net Amount',
      'VAT Rate %',
      'VAT Amount',
      'Gross Amount',
      'Jurisdiction',
      'Status',
      'Audit Flags'
    ];

    const rows = transactions.map(t => [
      t.id,
      t.invoiceRef,
      t.date,
      `"${t.counterparty.replace(/"/g, '""')}"`,
      t.taxId,
      t.type,
      `"${t.category}"`,
      t.netAmount,
      t.vatRate,
      t.vatAmount,
      t.grossAmount,
      t.jurisdiction,
      t.verificationStatus,
      `"${(t.anomalyFlags || []).join(' | ').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VAT_Tax_Return_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = 
        t.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.taxId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchType = selectedType === 'ALL' || t.type === selectedType;
      const matchJurisdiction = selectedJurisdiction === 'ALL' || t.jurisdiction === selectedJurisdiction;

      return matchSearch && matchType && matchJurisdiction;
    });
  }, [transactions, searchQuery, selectedType, selectedJurisdiction]);

  const outputVat = transactions.filter(t => t.type === 'OUTPUT_SALES').reduce((acc, t) => acc + t.vatAmount, 0);
  const inputVat = transactions.filter(t => t.type === 'INPUT_PURCHASES').reduce((acc, t) => acc + t.vatAmount, 0);
  const netVatBalance = outputVat - inputVat;
  const isRefundDue = netVatBalance < 0;
  const flaggedCount = transactions.filter(t => (t.anomalyFlags && t.anomalyFlags.length > 0) || t.verificationStatus === 'Flagged').length;

  const formatCurrency = (val: number) => {
    return `${currencyConfig.symbol}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // If user is not Pro, show subscriber paywall teaser
  if (!isPro) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-8 sm:p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Paid Subscriber Feature
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 tracking-tight">
            VAT & Sales Tax Forensic Reconciliation
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed max-w-2xl mx-auto">
            Input vs. Output tax reconciliation, statutory VAT number verification (SARS, HMRC, EU VIES), carousel fraud protection, and automated return filing schedules.
          </p>

          <div className="my-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Included on Pro & Business White Label Plan:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Output vs. Input VAT Net Return Calculator</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Statutory VAT Number & Tax Registration Checker</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Rate Mismatch & High-Value Zero-Rate Screening</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>One-Click VAT Return CSV & Worksheet Exports</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
              }}
              className="w-full sm:w-auto px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-purple-600/30 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span>Subscribe to Unlock VAT Audit</span>
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'pricing' } }));
              }}
              className="w-full sm:w-auto px-6 py-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Review Plan Details</span>
            </button>
          </div>

          {/* Blurred Teaser preview */}
          <div className="mt-10 rounded-2xl border border-slate-200 overflow-hidden opacity-60 filter blur-xs select-none pointer-events-none text-left">
            <div className="bg-slate-100 p-3 text-xs font-bold text-slate-500 flex justify-between">
              <span>PREVIEW: VAT RETURN WORKBOOK 2026</span>
              <span>LOCKED ACCESS</span>
            </div>
            <div className="divide-y divide-slate-100 p-4 space-y-2 bg-white">
              <div className="h-6 bg-slate-200 rounded w-4/5"></div>
              <div className="h-6 bg-slate-100 rounded w-full"></div>
              <div className="h-6 bg-slate-200 rounded w-3/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  VAT & Sales Tax Reconciliation
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  PRO SUBSCRIBER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Output vs Input tax reconciliation, statutory tax ID verification & MTIC screening.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing Invoices...' : 'Run VAT Forensic Scan'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record VAT Invoice</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Filing CSV</span>
          </button>

          <button
            onClick={() => resetVATTransactions()}
            className="px-3 py-2.5 text-slate-400 hover:text-slate-600 transition-colors"
            title="Reset to benchmark records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Output VAT (Sales)</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(outputVat)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total tax collected on taxable customer sales
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Input VAT (Purchases)</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(inputVat)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Deductible vendor & operational expense VAT
          </div>
        </div>

        <div className={`bg-white p-5 rounded-2xl border shadow-xs ${isRefundDue ? 'border-emerald-200 bg-emerald-50/20' : 'border-purple-200 bg-purple-50/20'}`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {isRefundDue ? 'Net VAT Refund Due' : 'Net VAT Payable'}
            </span>
            <Scale className={`w-4 h-4 ${isRefundDue ? 'text-emerald-600' : 'text-purple-600'}`} />
          </div>
          <div className={`text-2xl font-black font-mono ${isRefundDue ? 'text-emerald-700' : 'text-purple-700'}`}>
            {formatCurrency(netVatBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isRefundDue ? 'Credit claim from revenue authority' : 'Remittance due to tax authority'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tax Integrity Score</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${
              (lastAuditResult?.complianceScore || 100) >= 80 ? 'text-emerald-600' :
              (lastAuditResult?.complianceScore || 100) >= 50 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {lastAuditResult?.complianceScore ?? 84}/100
            </span>
            <span className="text-xs font-bold text-slate-400">
              {flaggedCount > 0 ? `${flaggedCount} Tax Risks` : 'Full Compliance'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            SARS / HMRC / EU VIES syntax verification
          </div>
        </div>
      </div>

      {/* Forensic Alerts Drawer if any risks found */}
      {flaggedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950">
          <div className="flex items-center gap-2 font-black text-sm mb-2 text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Statutory Tax Discrepancies Flagged ({lastAuditResult?.totalRisks || flaggedCount} items)</span>
          </div>
          <ul className="text-xs space-y-1.5 list-disc pl-5 text-rose-800">
            {transactions.flatMap(t => t.anomalyFlags || []).map((flag, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="font-semibold">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice ref, counterparty, tax ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">All Flows (Output & Input)</option>
            <option value="OUTPUT_SALES">Output VAT (Sales)</option>
            <option value="INPUT_PURCHASES">Input VAT (Purchases)</option>
          </select>

          <select
            value={selectedJurisdiction}
            onChange={(e) => setSelectedJurisdiction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">All Jurisdictions</option>
            <option value="ZA_SARS">South Africa (SARS - 15%)</option>
            <option value="UK_HMRC">United Kingdom (HMRC - 20%)</option>
            <option value="EU_STANDARD">European Union (VIES)</option>
            <option value="US_SALES">United States (Sales Tax)</option>
          </select>
        </div>
      </div>

      {/* VAT Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice / Date</th>
                <th className="py-3 px-4">Counterparty & Tax ID</th>
                <th className="py-3 px-4 text-center">Flow</th>
                <th className="py-3 px-4 text-right">Net Amount</th>
                <th className="py-3 px-4 text-center">VAT Rate</th>
                <th className="py-3 px-4 text-right">VAT Amount</th>
                <th className="py-3 px-4 text-right">Gross Total</th>
                <th className="py-3 px-4 text-center">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                    No VAT transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const hasRisks = (tx.anomalyFlags && tx.anomalyFlags.length > 0) || tx.verificationStatus === 'Flagged';
                  return (
                    <tr key={tx.id} className={`hover:bg-slate-50/70 transition-colors ${hasRisks ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{tx.invoiceRef}</div>
                        <div className="text-[10px] text-slate-400">{tx.date}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{tx.counterparty}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Tax ID: {tx.taxId}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {tx.type === 'OUTPUT_SALES' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Output (Sales)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            Input (Purchases)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                        {formatCurrency(tx.netAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                        {tx.vatRate}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                        {formatCurrency(tx.vatAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(tx.grossAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasRisks ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Flagged ({tx.anomalyFlags.length})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <span>Record VAT Transaction</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Reference</label>
                  <input
                    type="text"
                    required
                    value={formInvoiceRef}
                    onChange={(e) => setFormInvoiceRef(e.target.value)}
                    placeholder="INV-2026-9901"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Counterparty (Client / Vendor)</label>
                  <input
                    type="text"
                    required
                    value={formCounterparty}
                    onChange={(e) => setFormCounterparty(e.target.value)}
                    placeholder="Apex Technologies SA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">VAT / Tax ID</label>
                  <input
                    type="text"
                    required
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    placeholder="4110829104"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Flow</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    <option value="OUTPUT_SALES">Output (Sales)</option>
                    <option value="INPUT_PURCHASES">Input (Purchases)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jurisdiction</label>
                  <select
                    value={formJurisdiction}
                    onChange={(e) => {
                      const j = e.target.value as any;
                      setFormJurisdiction(j);
                      if (j === 'ZA_SARS') setFormVatRate(15);
                      else if (j === 'UK_HMRC') setFormVatRate(20);
                      else if (j === 'EU_STANDARD') setFormVatRate(21);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    <option value="ZA_SARS">South Africa (SARS)</option>
                    <option value="UK_HMRC">United Kingdom (HMRC)</option>
                    <option value="EU_STANDARD">European Union</option>
                    <option value="US_SALES">US Sales Tax</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    <option value="Standard Goods">Standard Goods</option>
                    <option value="Consulting & Services">Consulting & Services</option>
                    <option value="Capital Assets">Capital Assets</option>
                    <option value="Import / Cross-Border">Import / Cross-Border</option>
                    <option value="Zero-Rated / Exempt">Zero-Rated / Exempt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Net Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formNetAmount}
                    onChange={(e) => setFormNetAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">VAT Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formVatRate}
                    onChange={(e) => setFormVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calculated VAT</label>
                  <div className="py-2 px-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-purple-700">
                    {formatCurrency(computedVat)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                <span className="font-bold text-blue-900">Total Gross Invoice:</span>
                <span className="text-base font-black text-blue-900 font-mono">
                  {formatCurrency(computedGross)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-xs"
                >
                  Record Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
