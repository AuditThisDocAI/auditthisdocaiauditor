export interface FirmProfile {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  website: string;
  supportEmail: string;
  supportPhone?: string;
  address?: string;
  senderName: string;
  senderEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  dataOwnershipAgreed: boolean;
  agreedAt?: string;
  plan: 'starter_firm' | 'growth_firm' | 'enterprise_firm';
  monthlyAuditLimit: number;
  customDomain?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  firmId: string;
  name: string;
  email: string;
  role: 'owner' | 'auditor' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  createdAt: string;
}

export interface FirmClient {
  id: string;
  firmId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  taxId?: string;
  status: 'active' | 'archived';
  auditCount: number;
  createdAt: string;
}

export interface MonthlyUsage {
  firmId: string;
  yearMonth: string; // e.g. "2026-08"
  auditsCount: number;
  lastAuditAt: string;
}

export interface MultiTenantAuditRecord {
  id: string;
  firmId: string;
  clientId?: string;
  clientName?: string;
  fileName: string;
  auditDate: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  duplicatePaymentsFound: number;
  roundNumbersFound: number;
  weekendPaymentsFound: number;
  totalFlaggedAmount: number;
  summary: string;
  auditedByStaffId: string;
  auditedByStaffName: string;
}

// Default initial firm
export const DEFAULT_FIRM: FirmProfile = {
  id: 'firm_apex_01',
  name: 'Apex Advisory & Accounting LLC',
  logoUrl: '',
  primaryColor: '#0F172A', // Corporate Slate Navy
  secondaryColor: '#2563EB', // Royal Accent
  backgroundColor: '#F8FAFC',
  website: 'https://apexadvisory.com',
  supportEmail: 'audits@apexadvisory.com',
  supportPhone: '+1 (800) 555-0199',
  address: '100 Financial Plaza, Suite 400, New York, NY 10005',
  senderName: 'Apex Advisory Audit Desk',
  senderEmail: 'notifications@apexadvisory.com',
  dataOwnershipAgreed: true,
  agreedAt: new Date().toISOString(),
  plan: 'growth_firm',
  monthlyAuditLimit: 500,
  customDomain: 'audit.apexadvisory.com',
  createdAt: '2026-01-15T08:00:00.000Z',
};

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: 'staff_1',
    firmId: 'firm_apex_01',
    name: 'Sarah Jenkins, CPA',
    email: 'sjenkins@apexadvisory.com',
    role: 'owner',
    status: 'active',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'staff_2',
    firmId: 'firm_apex_01',
    name: 'Michael Ross',
    email: 'mross@apexadvisory.com',
    role: 'auditor',
    status: 'active',
    createdAt: '2026-02-01T10:30:00.000Z',
  },
];

const DEFAULT_CLIENTS: FirmClient[] = [
  {
    id: 'client_101',
    firmId: 'firm_apex_01',
    companyName: 'Acme Logistics Corp',
    contactName: 'David Miller',
    contactEmail: 'david@acmelogistics.com',
    taxId: 'XX-1234567',
    status: 'active',
    auditCount: 14,
    createdAt: '2026-01-20T00:00:00.000Z',
  },
  {
    id: 'client_102',
    firmId: 'firm_apex_01',
    companyName: 'Vanguard Retail Ltd',
    contactName: 'Elena Rostova',
    contactEmail: 'elena@vanguardretail.com',
    taxId: 'XX-9876543',
    status: 'active',
    auditCount: 8,
    createdAt: '2026-02-10T00:00:00.000Z',
  },
];

// Helper to get active firm
export function getActiveFirm(): FirmProfile {
  try {
    const saved = localStorage.getItem('saas_active_firm_profile');
    if (saved) {
      return { ...DEFAULT_FIRM, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse active firm:', e);
  }
  return DEFAULT_FIRM;
}

export function saveActiveFirm(firm: FirmProfile): void {
  try {
    localStorage.setItem('saas_active_firm_profile', JSON.stringify(firm));
    window.dispatchEvent(new Event('firm-branding-changed'));
  } catch (e) {
    console.error('Failed to save firm profile:', e);
  }
}

// Helper to get staff list filtered by firmId
export function getFirmStaff(firmId: string): StaffMember[] {
  try {
    const saved = localStorage.getItem(`saas_firm_staff_${firmId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to get firm staff:', e);
  }
  return DEFAULT_STAFF.filter(s => s.firmId === firmId);
}

export function saveFirmStaff(firmId: string, staff: StaffMember[]): void {
  try {
    localStorage.setItem(`saas_firm_staff_${firmId}`, JSON.stringify(staff));
    window.dispatchEvent(new Event('firm-staff-changed'));
  } catch (e) {
    console.error('Failed to save firm staff:', e);
  }
}

// Helper to get clients filtered by firmId
export function getFirmClients(firmId: string): FirmClient[] {
  try {
    const saved = localStorage.getItem(`saas_firm_clients_${firmId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to get firm clients:', e);
  }
  return DEFAULT_CLIENTS.filter(c => c.firmId === firmId);
}

export function saveFirmClients(firmId: string, clients: FirmClient[]): void {
  try {
    localStorage.setItem(`saas_firm_clients_${firmId}`, JSON.stringify(clients));
    window.dispatchEvent(new Event('firm-clients-changed'));
  } catch (e) {
    console.error('Failed to save firm clients:', e);
  }
}

// Helper to get and increment monthly usage
export function getFirmMonthlyUsage(firmId: string): MonthlyUsage {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  try {
    const saved = localStorage.getItem(`saas_usage_${firmId}_${currentMonth}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load monthly usage:', e);
  }
  return {
    firmId,
    yearMonth: currentMonth,
    auditsCount: 18, // Default sample count
    lastAuditAt: new Date().toISOString(),
  };
}

export function recordFirmAuditUsage(firmId: string): MonthlyUsage {
  const usage = getFirmMonthlyUsage(firmId);
  const updated: MonthlyUsage = {
    ...usage,
    auditsCount: usage.auditsCount + 1,
    lastAuditAt: new Date().toISOString(),
  };
  localStorage.setItem(`saas_usage_${firmId}_${usage.yearMonth}`, JSON.stringify(updated));
  window.dispatchEvent(new Event('firm-usage-updated'));
  return updated;
}

// Export All Firm Data helper
export function exportAllFirmDataAsJson(firmId: string): void {
  const firm = getActiveFirm();
  const staff = getFirmStaff(firmId);
  const clients = getFirmClients(firmId);
  const usage = getFirmMonthlyUsage(firmId);

  const fullExport = {
    exportMeta: {
      generatedAt: new Date().toISOString(),
      firmId,
      firmName: firm.name,
      exportVersion: '1.0-SaaS',
      dataOwnershipClause: 'This dataset belongs strictly to the accounting firm.',
    },
    firmProfile: firm,
    staffMembers: staff,
    clients: clients,
    monthlyUsage: usage,
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullExport, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${firm.name.replace(/[^a-z0-9]/gi, '_')}_Full_Firm_Export_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
