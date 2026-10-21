import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  AlertOctagon, 
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
  Building2, 
  Sparkles, 
  X, 
  Trash2, 
  AlertTriangle,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { isUserPro } from '../lib/authUtils';
import { useCurrency } from '../lib/currency';
import { 
  PayrollDisbursement, 
  getPayrollRecords, 
  savePayrollRecord, 
  deletePayrollRecord, 
  resetPayrollRecords, 
  runPayrollForensicAudit 
} from '../lib/payrollVatService';

export function PayrollAudit() {
  const [isPro, setIsPro] = useState(isUserPro());
  const { currencyConfig } = useCurrency();
  const [records, setRecords] = useState<PayrollDisbursement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditResult, setLastAuditResult] = useState<{
    totalRisks: number;
    ghostEmployeeCount: number;
    underwithheldCount: number;
    overallScore: number;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollDisbursement | null>(null);
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formEmployeeName, setFormEmployeeName] = useState('');
  const [formDept, setFormDept] = useState<PayrollDisbursement['department']>('Operations');
  const [formPayPeriod, setFormPayPeriod] = useState('October 2026');
  const [formGrossPay, setFormGrossPay] = useState<number>(6500);
  const [formPayeTax, setFormPayeTax] = useState<number>(1400);
  const [formPension, setFormPension] = useState<number>(320);
  const [formSocialSecurity, setFormSocialSecurity] = useState<number>(180);
  const [formOtherDeductions, setFormOtherDeductions] = useState<number>(0);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PayrollDisbursement['paymentMethod']>('Direct Deposit');
  const [formBankAccount, setFormBankAccount] = useState('••••6721');
  const [formRoutingNumber, setFormRoutingNumber] = useState('021000021');
  const [formTaxId, setFormTaxId] = useState('440-12-8890');

  const computedNet = Math.max(0, formGrossPay - (formPayeTax + formPension + formSocialSecurity + formOtherDeductions));

  const loadData = () => {
    const list = getPayrollRecords();
    setRecords(list);
    const auditRes = runPayrollForensicAudit(list);
    setLastAuditResult({
      totalRisks: auditRes.totalRisks,
      ghostEmployeeCount: auditRes.ghostEmployeeCount,
      underwithheldCount: auditRes.underwithheldCount,
      overallScore: auditRes.overallScore
    });
  };

  useEffect(() => {
    const checkPro = () => setIsPro(isUserPro());
    checkPro();
    loadData();

    window.addEventListener('pro-status-changed', checkPro);
    window.addEventListener('payroll-records-updated', loadData);
    return () => {
      window.removeEventListener('pro-status-changed', checkPro);
      window.removeEventListener('payroll-records-updated', loadData);
    };
  }, []);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const res = runPayrollForensicAudit(records);
      setRecords(res.auditedRecords);
      setLastAuditResult({
        totalRisks: res.totalRisks,
        ghostEmployeeCount: res.ghostEmployeeCount,
        underwithheldCount: res.underwithheldCount,
        overallScore: res.overallScore
      });
      setIsAuditing(false);
    }, 700);
  };

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormEmployeeName('');
    setFormDept('Operations');
    setFormPayPeriod('October 2026');
    setFormGrossPay(6500);
    setFormPayeTax(1430);
    setFormPension(325);
    setFormSocialSecurity(195);
    setFormOtherDeductions(0);
    setFormPaymentMethod('Direct Deposit');
    setFormBankAccount(`••••${Math.floor(1000 + Math.random() * 9000)}`);
    setFormRoutingNumber('021000021');
    setFormTaxId('440-12-8890');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeName.trim()) return;

    const newRecord: PayrollDisbursement = {
      id: editingRecord ? editingRecord.id : `PR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: formEmployeeId.trim() || `EMP-${Date.now().toString().slice(-4)}`,
      employeeName: formEmployeeName.trim(),
      department: formDept,
      payPeriod: formPayPeriod,
      paymentDate: new Date().toISOString().split('T')[0],
      grossPay: Number(formGrossPay) || 0,
      payeTax: Number(formPayeTax) || 0,
      pensionDeduction: Number(formPension) || 0,
      socialSecurity: Number(formSocialSecurity) || 0,
      otherDeductions: Number(formOtherDeductions) || 0,
      netPay: computedNet,
      paymentMethod: formPaymentMethod,
      bankAccountNumber: formBankAccount,
      routingNumber: formRoutingNumber,
      taxIdOrSsn: formTaxId,
      status: 'Approved',
      anomalyFlags: []
    };

    savePayrollRecord(newRecord);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this payroll disbursement record?')) {
      deletePayrollRecord(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Disbursement ID',
      'Employee ID',
      'Employee Name',
      'Department',
      'Pay Period',
      'Gross Pay',
      'PAYE Tax',
      'Pension',
      'Social Security',
      'Other Deductions',
      'Net Pay',
      'Payment Method',
      'Bank Account',
      'Status',
      'Risk Flags'
    ];

    const rows = records.map(r => [
      r.id,
      r.employeeId,
      `"${r.employeeName.replace(/"/g, '""')}"`,
      r.department,
      `"${r.payPeriod}"`,
      r.grossPay,
      r.payeTax,
      r.pensionDeduction,
      r.socialSecurity,
      r.otherDeductions,
      r.netPay,
      r.paymentMethod,
      r.bankAccountNumber,
      r.status,
      `"${(r.anomalyFlags || []).join(' | ').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Forensic_Payroll_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = 
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.bankAccountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchDept = selectedDept === 'ALL' || r.department === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [records, searchQuery, selectedDept, selectedStatus]);

  const totalGross = records.reduce((acc, r) => acc + r.grossPay, 0);
  const totalTaxes = records.reduce((acc, r) => acc + r.payeTax, 0);
  const totalNet = records.reduce((acc, r) => acc + r.netPay, 0);
  const flaggedCount = records.filter(r => (r.anomalyFlags && r.anomalyFlags.length > 0) || r.status === 'Flagged').length;

  const formatCurrency = (val: number) => {
    return `${currencyConfig.symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            Forensic Payroll & Compensation Audit
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed max-w-2xl mx-auto">
            Detect ghost employees, unauthorized salary inflation, tax withholding underpayments, and duplicate bank remittances across all company disbursements under SAS 99 and AU-C 240 audit standards.
          </p>

          <div className="my-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Included on Pro & Business White Label Plan:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ghost Employee & Duplicate Account Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Statutory PAYE / Tax Withholding Sanity Checks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Overtime & Net Pay Arithmetic Cross-Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Court-Ready CSV & Statutory Payroll Reports</span>
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
              <span>Subscribe to Unlock Payroll Audit</span>
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
              <span>PREVIEW: PAYROLL RUN OCT 2026</span>
              <span>LOCKED REGISTRATION</span>
            </div>
            <div className="divide-y divide-slate-100 p-4 space-y-2 bg-white">
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-6 bg-slate-100 rounded w-full"></div>
              <div className="h-6 bg-slate-200 rounded w-2/3"></div>
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
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Forensic Payroll Audit
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  PRO SUBSCRIBER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghost employee screening, statutory PAYE verification & compensation integrity.
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
            <span>{isAuditing ? 'Auditing Heuristics...' : 'Run Forensic Scan'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payroll Item</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => resetPayrollRecords()}
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
            <span className="text-xs font-bold uppercase tracking-wider">Gross Payroll</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalGross)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {records.length} active employee disbursements
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Statutory Deductions (PAYE)</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalTaxes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tax, pension & social security withheld
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net Disbursed</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(totalNet)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total net direct deposit & wire total
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Payroll Risk Score</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${
              (lastAuditResult?.overallScore || 100) >= 80 ? 'text-emerald-600' :
              (lastAuditResult?.overallScore || 100) >= 50 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {lastAuditResult?.overallScore ?? 88}/100
            </span>
            <span className="text-xs font-bold text-slate-400">
              {flaggedCount > 0 ? `${flaggedCount} Flagged` : 'Clean Audit'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            SAS 99 / AU-C 240 algorithmic verification
          </div>
        </div>
      </div>

      {/* Forensic Alerts Drawer if any risks found */}
      {flaggedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950">
          <div className="flex items-center gap-2 font-black text-sm mb-2 text-rose-900">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Forensic Payroll Anomalies Detected ({lastAuditResult?.totalRisks || flaggedCount} items)</span>
          </div>
          <ul className="text-xs space-y-1.5 list-disc pl-5 text-rose-800">
            {records.flatMap(r => r.anomalyFlags || []).map((flag, idx) => (
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
            placeholder="Search employee, ID, bank account..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">All Departments</option>
            <option value="Executive">Executive</option>
            <option value="Finance">Finance</option>
            <option value="Engineering">Engineering</option>
            <option value="Operations">Operations</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Flagged">Flagged Risks</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Dept / Period</th>
                <th className="py-3 px-4 text-right">Gross Pay</th>
                <th className="py-3 px-4 text-right">PAYE & Tax</th>
                <th className="py-3 px-4 text-right">Net Remitted</th>
                <th className="py-3 px-4">Bank / Routing</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                    No payroll disbursements match your criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const hasRisks = (r.anomalyFlags && r.anomalyFlags.length > 0) || r.status === 'Flagged';
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50/70 transition-colors ${hasRisks ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.employeeName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.employeeId} • Tax ID: {r.taxIdOrSsn}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{r.department}</div>
                        <div className="text-[10px] text-slate-400">{r.payPeriod}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(r.grossPay)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        <div>{formatCurrency(r.payeTax)}</div>
                        <div className="text-[10px] text-slate-400">Pension: {formatCurrency(r.pensionDeduction)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                        {formatCurrency(r.netPay)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-700 font-bold">{r.bankAccountNumber}</div>
                        <div className="text-[10px] text-slate-400">{r.paymentMethod}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasRisks ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Flagged ({r.anomalyFlags.length})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <span>Add Payroll Disbursement</span>
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
                  <label className="block font-bold text-slate-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={formEmployeeName}
                    onChange={(e) => setFormEmployeeName(e.target.value)}
                    placeholder="e.g. Jessica Sterling"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Executive">Executive</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pay Period</label>
                  <input
                    type="text"
                    value={formPayPeriod}
                    onChange={(e) => setFormPayPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gross Pay</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formGrossPay}
                    onChange={(e) => setFormGrossPay(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAYE Tax</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formPayeTax}
                    onChange={(e) => setFormPayeTax(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pension</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formPension}
                    onChange={(e) => setFormPension(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Social Sec / UIF</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formSocialSecurity}
                    onChange={(e) => setFormSocialSecurity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100">
                <span className="font-bold text-purple-900">Computed Net Pay:</span>
                <span className="text-base font-black text-purple-900 font-mono">
                  {formatCurrency(computedNet)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Account (Masked or Full)</label>
                  <input
                    type="text"
                    value={formBankAccount}
                    onChange={(e) => setFormBankAccount(e.target.value)}
                    placeholder="••••5512"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax ID / SSN</label>
                  <input
                    type="text"
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    placeholder="440-12-8890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
