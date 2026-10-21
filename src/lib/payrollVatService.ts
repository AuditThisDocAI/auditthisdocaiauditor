/**
 * Payroll & VAT Compliance and Forensic Service
 * Provides data models, forensic heuristics, and persistence for paid subscriber features.
 */

export interface PayrollDisbursement {
  id: string;
  employeeId: string;
  employeeName: string;
  department: 'Executive' | 'Finance' | 'Engineering' | 'Operations' | 'Sales' | 'HR';
  payPeriod: string;
  paymentDate: string;
  grossPay: number;
  payeTax: number;
  pensionDeduction: number;
  socialSecurity: number;
  otherDeductions: number;
  netPay: number;
  paymentMethod: 'Direct Deposit' | 'Wire Remittance' | 'Cheque' | 'Cash Equivalent';
  bankAccountNumber: string;
  routingNumber: string;
  taxIdOrSsn: string;
  status: 'Approved' | 'Flagged' | 'Paid';
  anomalyFlags: string[];
}

export interface VATTransaction {
  id: string;
  invoiceRef: string;
  date: string;
  counterparty: string;
  taxId: string;
  type: 'OUTPUT_SALES' | 'INPUT_PURCHASES';
  category: 'Standard Goods' | 'Consulting & Services' | 'Capital Assets' | 'Import / Cross-Border' | 'Zero-Rated / Exempt';
  netAmount: number;
  vatRate: number; // e.g. 15, 20
  vatAmount: number;
  grossAmount: number;
  jurisdiction: 'ZA_SARS' | 'UK_HMRC' | 'EU_STANDARD' | 'US_SALES' | 'CUSTOM';
  verificationStatus: 'Verified' | 'Flagged' | 'Pending';
  anomalyFlags: string[];
}

const PAYROLL_STORAGE_KEY = 'audit_this_doc_payroll_records';
const VAT_STORAGE_KEY = 'audit_this_doc_vat_records';

export const SAMPLE_PAYROLL_RECORDS: PayrollDisbursement[] = [
  {
    id: 'PR-2026-001',
    employeeId: 'EMP-1042',
    employeeName: 'Sarah Jenkins',
    department: 'Finance',
    payPeriod: 'October 2026',
    paymentDate: '2026-10-15',
    grossPay: 8500,
    payeTax: 2125,
    pensionDeduction: 510,
    socialSecurity: 255,
    otherDeductions: 0,
    netPay: 5610,
    paymentMethod: 'Direct Deposit',
    bankAccountNumber: '••••4892',
    routingNumber: '021000021',
    taxIdOrSsn: '942-88-1204',
    status: 'Approved',
    anomalyFlags: []
  },
  {
    id: 'PR-2026-002',
    employeeId: 'EMP-1088',
    employeeName: 'Marcus Vance',
    department: 'Engineering',
    payPeriod: 'October 2026',
    paymentDate: '2026-10-15',
    grossPay: 12500,
    payeTax: 3375,
    pensionDeduction: 750,
    socialSecurity: 375,
    otherDeductions: 100,
    netPay: 7900,
    paymentMethod: 'Direct Deposit',
    bankAccountNumber: '••••9120',
    routingNumber: '021000021',
    taxIdOrSsn: '811-20-4491',
    status: 'Approved',
    anomalyFlags: []
  },
  {
    id: 'PR-2026-003',
    employeeId: 'EMP-1190',
    employeeName: 'David K. Miller',
    department: 'Operations',
    payPeriod: 'October 2026',
    paymentDate: '2026-10-15',
    grossPay: 6200,
    payeTax: 1240,
    pensionDeduction: 310,
    socialSecurity: 186,
    otherDeductions: 0,
    netPay: 4464,
    paymentMethod: 'Direct Deposit',
    bankAccountNumber: '••••3319',
    routingNumber: '121000358',
    taxIdOrSsn: '455-90-1123',
    status: 'Approved',
    anomalyFlags: []
  },
  {
    id: 'PR-2026-004',
    employeeId: 'EMP-9904',
    employeeName: 'Apex Contractor Sub-Vendor',
    department: 'Operations',
    payPeriod: 'October 2026',
    paymentDate: '2026-10-15',
    grossPay: 9800,
    payeTax: 490, // Underwithheld tax
    pensionDeduction: 0,
    socialSecurity: 0,
    otherDeductions: 0,
    netPay: 9310,
    paymentMethod: 'Wire Remittance',
    bankAccountNumber: '••••3319', // Duplicate bank account matching David K. Miller!
    routingNumber: '121000358',
    taxIdOrSsn: '000-00-0000', // Invalid SSN
    status: 'Flagged',
    anomalyFlags: [
      'Ghost Employee Risk: Shares identical bank account (••••3319) with EMP-1190',
      'Tax Withholding Anomaly: Only 5% PAYE withheld on non-exempt compensation',
      'Invalid Tax Identification Number (000-00-0000)'
    ]
  },
  {
    id: 'PR-2026-005',
    employeeId: 'EMP-1120',
    employeeName: 'Elena Rostova',
    department: 'Sales',
    payPeriod: 'October 2026',
    paymentDate: '2026-10-15',
    grossPay: 7400,
    payeTax: 1850,
    pensionDeduction: 444,
    socialSecurity: 222,
    otherDeductions: 0,
    netPay: 4884,
    paymentMethod: 'Direct Deposit',
    bankAccountNumber: '••••5541',
    routingNumber: '026009593',
    taxIdOrSsn: '521-89-3382',
    status: 'Approved',
    anomalyFlags: []
  },
  {
    id: 'PR-2026-006',
    employeeId: 'EMP-1205',
    employeeName: 'Arthur Pendelton',
    department: 'Executive',
    payPeriod: 'October 2026',
    paymentDate: '2026-10-15',
    grossPay: 18000,
    payeTax: 5400,
    pensionDeduction: 1080,
    socialSecurity: 540,
    otherDeductions: 250,
    netPay: 10730,
    paymentMethod: 'Wire Remittance',
    bankAccountNumber: '••••7712',
    routingNumber: '021000021',
    taxIdOrSsn: '320-11-7788',
    status: 'Approved',
    anomalyFlags: []
  }
];

export const SAMPLE_VAT_TRANSACTIONS: VATTransaction[] = [
  {
    id: 'VAT-TX-001',
    invoiceRef: 'INV-2026-8801',
    date: '2026-10-02',
    counterparty: 'CloudStack Global Services Ltd',
    taxId: '4920192831',
    type: 'INPUT_PURCHASES',
    category: 'Consulting & Services',
    netAmount: 14500,
    vatRate: 15,
    vatAmount: 2175,
    grossAmount: 16675,
    jurisdiction: 'ZA_SARS',
    verificationStatus: 'Verified',
    anomalyFlags: []
  },
  {
    id: 'VAT-TX-002',
    invoiceRef: 'INV-2026-9041',
    date: '2026-10-05',
    counterparty: 'Acme Advisory Clients SA',
    taxId: '4110829104',
    type: 'OUTPUT_SALES',
    category: 'Standard Goods',
    netAmount: 42000,
    vatRate: 15,
    vatAmount: 6300,
    grossAmount: 48300,
    jurisdiction: 'ZA_SARS',
    verificationStatus: 'Verified',
    anomalyFlags: []
  },
  {
    id: 'VAT-TX-003',
    invoiceRef: 'INV-2026-9118',
    date: '2026-10-07',
    counterparty: 'Vanguard Systems UK',
    taxId: 'GB982301948',
    type: 'INPUT_PURCHASES',
    category: 'Standard Goods',
    netAmount: 8500,
    vatRate: 20,
    vatAmount: 1700,
    grossAmount: 10200,
    jurisdiction: 'UK_HMRC',
    verificationStatus: 'Verified',
    anomalyFlags: []
  },
  {
    id: 'VAT-TX-004',
    invoiceRef: 'INV-2026-9320',
    date: '2026-10-09',
    counterparty: 'Shenzhen FastTech Hardware',
    taxId: 'UNREGISTERED-99',
    type: 'INPUT_PURCHASES',
    category: 'Import / Cross-Border',
    netAmount: 18200,
    vatRate: 15,
    vatAmount: 3640, // Mismatched 20% applied to 15% rate!
    grossAmount: 21840,
    jurisdiction: 'ZA_SARS',
    verificationStatus: 'Flagged',
    anomalyFlags: [
      'Tax Calculation Mismatch: Computed VAT (3,640) exceeds statutory 15% rate (expected 2,730)',
      'Unregistered Foreign Entity: Missing valid SARS/VIES VAT registration number',
      'Import Reverse-Charge Documentation not attached'
    ]
  },
  {
    id: 'VAT-TX-005',
    invoiceRef: 'INV-2026-9450',
    date: '2026-10-10',
    counterparty: 'Metro Property Management',
    taxId: '4770198822',
    type: 'INPUT_PURCHASES',
    category: 'Standard Goods',
    netAmount: 9400,
    vatRate: 15,
    vatAmount: 1410,
    grossAmount: 10810,
    jurisdiction: 'ZA_SARS',
    verificationStatus: 'Verified',
    anomalyFlags: []
  },
  {
    id: 'VAT-TX-006',
    invoiceRef: 'INV-2026-9502',
    date: '2026-10-12',
    counterparty: 'Starlight Retail Outlets',
    taxId: '4029182390',
    type: 'OUTPUT_SALES',
    category: 'Standard Goods',
    netAmount: 31000,
    vatRate: 15,
    vatAmount: 4650,
    grossAmount: 35650,
    jurisdiction: 'ZA_SARS',
    verificationStatus: 'Verified',
    anomalyFlags: []
  }
];

export function getPayrollRecords(): PayrollDisbursement[] {
  if (typeof window === 'undefined') return SAMPLE_PAYROLL_RECORDS;
  try {
    const raw = localStorage.getItem(PAYROLL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(SAMPLE_PAYROLL_RECORDS));
      return SAMPLE_PAYROLL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SAMPLE_PAYROLL_RECORDS;
  } catch {
    return SAMPLE_PAYROLL_RECORDS;
  }
}

export function savePayrollRecord(record: PayrollDisbursement): PayrollDisbursement[] {
  const current = getPayrollRecords();
  const existingIdx = current.findIndex(r => r.id === record.id);
  let updated: PayrollDisbursement[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = record;
  } else {
    updated = [record, ...current];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('payroll-records-updated'));
  }
  return updated;
}

export function deletePayrollRecord(id: string): PayrollDisbursement[] {
  const current = getPayrollRecords();
  const updated = current.filter(r => r.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('payroll-records-updated'));
  }
  return updated;
}

export function resetPayrollRecords(): PayrollDisbursement[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(SAMPLE_PAYROLL_RECORDS));
    window.dispatchEvent(new Event('payroll-records-updated'));
  }
  return SAMPLE_PAYROLL_RECORDS;
}

export function runPayrollForensicAudit(records: PayrollDisbursement[]): {
  auditedRecords: PayrollDisbursement[];
  totalRisks: number;
  ghostEmployeeCount: number;
  underwithheldCount: number;
  overallScore: number;
} {
  // Track bank accounts to detect ghost employees
  const bankAccountMap = new Map<string, string[]>();
  records.forEach(r => {
    if (r.bankAccountNumber && r.bankAccountNumber.length > 3) {
      const existing = bankAccountMap.get(r.bankAccountNumber) || [];
      existing.push(r.employeeName);
      bankAccountMap.set(r.bankAccountNumber, existing);
    }
  });

  let totalRisks = 0;
  let ghostEmployeeCount = 0;
  let underwithheldCount = 0;

  const auditedRecords = records.map(record => {
    const flags: string[] = [];
    
    // Check 1: Duplicate bank account / Ghost employee
    const bankMatches = bankAccountMap.get(record.bankAccountNumber) || [];
    if (bankMatches.length > 1) {
      const others = bankMatches.filter(n => n !== record.employeeName);
      if (others.length > 0) {
        flags.push(`Ghost Employee / Remittance Anomaly: Shares bank account (${record.bankAccountNumber}) with ${others.join(', ')}`);
        ghostEmployeeCount++;
      }
    }

    // Check 2: Tax withholding sanity (PAYE < 10% on > $5000 compensation)
    if (record.grossPay > 5000 && record.payeTax / record.grossPay < 0.10) {
      flags.push(`Statutory Tax Underwithholding: Only ${((record.payeTax / record.grossPay) * 100).toFixed(1)}% PAYE withheld on high wage`);
      underwithheldCount++;
    }

    // Check 3: Net pay arithmetic verification
    const expectedNet = record.grossPay - (record.payeTax + record.pensionDeduction + record.socialSecurity + record.otherDeductions);
    if (Math.abs(expectedNet - record.netPay) > 0.5) {
      flags.push(`Arithmetic Discrepancy: Expected Net $${expectedNet.toFixed(2)} vs recorded Net $${record.netPay.toFixed(2)}`);
    }

    // Check 4: Tax ID structure
    if (record.taxIdOrSsn.includes('000-00') || record.taxIdOrSsn.length < 8) {
      flags.push(`Non-Compliant Tax ID / SSN format: ${record.taxIdOrSsn}`);
    }

    const hasAnomalies = flags.length > 0;
    if (hasAnomalies) totalRisks += flags.length;

    return {
      ...record,
      status: (hasAnomalies ? 'Flagged' : record.status) as 'Approved' | 'Flagged' | 'Paid',
      anomalyFlags: flags
    };
  });

  const overallScore = Math.max(10, Math.min(100, Math.round(100 - (totalRisks * 14))));

  return {
    auditedRecords,
    totalRisks,
    ghostEmployeeCount,
    underwithheldCount,
    overallScore
  };
}

// VAT Functions

export function getVATTransactions(): VATTransaction[] {
  if (typeof window === 'undefined') return SAMPLE_VAT_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(VAT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VAT_STORAGE_KEY, JSON.stringify(SAMPLE_VAT_TRANSACTIONS));
      return SAMPLE_VAT_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SAMPLE_VAT_TRANSACTIONS;
  } catch {
    return SAMPLE_VAT_TRANSACTIONS;
  }
}

export function saveVATTransaction(tx: VATTransaction): VATTransaction[] {
  const current = getVATTransactions();
  const existingIdx = current.findIndex(t => t.id === tx.id);
  let updated: VATTransaction[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = tx;
  } else {
    updated = [tx, ...current];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(VAT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('vat-records-updated'));
  }
  return updated;
}

export function deleteVATTransaction(id: string): VATTransaction[] {
  const current = getVATTransactions();
  const updated = current.filter(t => t.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(VAT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('vat-records-updated'));
  }
  return updated;
}

export function resetVATTransactions(): VATTransaction[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VAT_STORAGE_KEY, JSON.stringify(SAMPLE_VAT_TRANSACTIONS));
    window.dispatchEvent(new Event('vat-records-updated'));
  }
  return SAMPLE_VAT_TRANSACTIONS;
}

export function runVATForensicAudit(transactions: VATTransaction[]): {
  auditedTransactions: VATTransaction[];
  totalRisks: number;
  outputVatTotal: number;
  inputVatTotal: number;
  netVatBalance: number;
  complianceScore: number;
} {
  let totalRisks = 0;
  let outputVatTotal = 0;
  let inputVatTotal = 0;

  const auditedTransactions = transactions.map(tx => {
    const flags: string[] = [];

    if (tx.type === 'OUTPUT_SALES') {
      outputVatTotal += tx.vatAmount;
    } else {
      inputVatTotal += tx.vatAmount;
    }

    // Check 1: Tax computation arithmetic
    const expectedVat = (tx.netAmount * tx.vatRate) / 100;
    if (Math.abs(expectedVat - tx.vatAmount) > 1.0) {
      flags.push(`Calculation Discrepancy: Recorded VAT (${tx.vatAmount.toFixed(2)}) deviates from ${tx.vatRate}% rate calculation (${expectedVat.toFixed(2)})`);
    }

    // Check 2: Tax registration number syntax
    const cleanTaxId = tx.taxId.trim();
    if (tx.jurisdiction === 'ZA_SARS') {
      // South Africa SARS VAT is 10 digits starting with 4
      if (!/^4\d{9}$/.test(cleanTaxId)) {
        flags.push(`Invalid SARS VAT Number: Must be a 10-digit number starting with 4 (Found: ${cleanTaxId})`);
      }
    } else if (tx.jurisdiction === 'UK_HMRC') {
      // UK VAT is GB + 9 digits or 9 digits
      if (!/^(GB)?\d{9}$/i.test(cleanTaxId)) {
        flags.push(`Invalid UK HMRC VAT Number format: ${cleanTaxId}`);
      }
    }

    // Check 3: High value zero-rate risk
    if (tx.vatRate === 0 && tx.netAmount > 10000 && tx.category !== 'Zero-Rated / Exempt') {
      flags.push(`Zero-Rate Audit Flag: High-value supply ($${tx.netAmount.toLocaleString()}) claimed at 0% without export declaration`);
    }

    const hasAnomalies = flags.length > 0;
    if (hasAnomalies) totalRisks += flags.length;

    return {
      ...tx,
      verificationStatus: (hasAnomalies ? 'Flagged' : 'Verified') as 'Verified' | 'Flagged' | 'Pending',
      anomalyFlags: flags
    };
  });

  const netVatBalance = outputVatTotal - inputVatTotal;
  const complianceScore = Math.max(10, Math.min(100, Math.round(100 - (totalRisks * 16))));

  return {
    auditedTransactions,
    totalRisks,
    outputVatTotal,
    inputVatTotal,
    netVatBalance,
    complianceScore
  };
}
