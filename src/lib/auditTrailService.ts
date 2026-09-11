export interface AuditTrailEvent {
  id: string;
  timestamp: string;
  category: 'DOCUMENT_AUDIT' | 'FORENSIC_FLAG' | 'LEDGER_ACTIVITY' | 'SECURITY_AUTH' | 'POLICY_UPDATE';
  action: string;
  severity: 'VERIFIED' | 'INFO' | 'WARNING' | 'CRITICAL';
  actor: string;
  documentRef?: string;
  details: string;
  hash: string;
  previousHash: string;
  status: 'Tamper-Evident' | 'Verified' | 'Flagged';
}

const STORAGE_KEY = 'audit_this_doc_trail_events';

// Compute simple deterministic SHA-256 style hex hash
function computeHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Generate 64-char simulated SHA-256 based on contents
  let result = hex;
  for (let j = 0; j < 7; j++) {
    hash = ((hash << 7) - hash) + (j * 31);
    result += Math.abs(hash).toString(16).padStart(8, '0');
  }
  return result.slice(0, 64);
}

const INITIAL_EVENTS: AuditTrailEvent[] = [
  {
    id: 'TRL-9841',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    category: 'SECURITY_AUTH',
    action: 'Administrator Session Initialized',
    severity: 'VERIFIED',
    actor: 'System Watchdog',
    details: 'Encrypted admin session authenticated with full VIP forensic auditing privileges.',
    hash: '8f92a1c4b72e90f1d43a88c2b5e7d911a34f0c829e1a74d2b0e914fc8291aa02',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    status: 'Verified'
  },
  {
    id: 'TRL-9842',
    timestamp: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
    category: 'DOCUMENT_AUDIT',
    action: 'Invoice #8920 Forensic Analysis',
    severity: 'CRITICAL',
    actor: 'Dr. Aria AI Forensic Engine',
    documentRef: 'Vendor Invoice #8920 (Apex Global)',
    details: 'Altered SWIFT wire instruction detected. Mismatched vendor tax ID and duplicate billing sequence flagged (Risk Score: 88/100).',
    hash: '3d4e92a1c7b80f1d52a89c2b4e6d8100a12f9c819e0a63d1b9e803fb7180bb14',
    previousHash: '8f92a1c4b72e90f1d43a88c2b5e7d911a34f0c829e1a74d2b0e914fc8291aa02',
    status: 'Flagged'
  },
  {
    id: 'TRL-9843',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    category: 'FORENSIC_FLAG',
    action: 'Vendor Bank Wire Verification',
    severity: 'WARNING',
    actor: 'Google Contacts & Registry Sync',
    documentRef: 'Apex Global Consulting LLC',
    details: 'Wire routing number diverges from authenticated vendor ledger record. Remediation notification triggered.',
    hash: '5a2b1c9e8f70d3e4b1a87c1a3d5f7099e01f8b708d9e52c0a8d792ea6070cc25',
    previousHash: '3d4e92a1c7b80f1d52a89c2b4e6d8100a12f9c819e0a63d1b9e803fb7180bb14',
    status: 'Tamper-Evident'
  },
  {
    id: 'TRL-9844',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    category: 'LEDGER_ACTIVITY',
    action: 'General Ledger Reconciliation',
    severity: 'VERIFIED',
    actor: 'Forensic Bookkeeper',
    details: 'Double-entry trial balance checked: Debits $142,500.00 match Credits $142,500.00. Variance $0.00.',
    hash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    previousHash: '5a2b1c9e8f70d3e4b1a87c1a3d5f7099e01f8b708d9e52c0a8d792ea6070cc25',
    status: 'Verified'
  },
  {
    id: 'TRL-9845',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    category: 'POLICY_UPDATE',
    action: 'Chain of Custody Rules Enforced',
    severity: 'INFO',
    actor: 'Compliance Director',
    details: 'Firm-wide white-label compliance policies updated to enforce 256-bit hash verification on all client exports.',
    hash: '9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    previousHash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    status: 'Tamper-Evident'
  }
];

export function getAuditTrailEvents(): AuditTrailEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EVENTS;
  } catch (e) {
    return INITIAL_EVENTS;
  }
}

export function logAuditTrailEvent(event: Omit<AuditTrailEvent, 'id' | 'timestamp' | 'hash' | 'previousHash' | 'status'>): AuditTrailEvent {
  const currentEvents = getAuditTrailEvents();
  const previousHash = currentEvents.length > 0 ? currentEvents[0].hash : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();
  const id = `TRL-${Math.floor(1000 + Math.random() * 9000)}`;
  const hashString = `${id}:${timestamp}:${event.category}:${event.action}:${event.details}:${previousHash}`;
  const hash = computeHash(hashString);

  const newEvent: AuditTrailEvent = {
    ...event,
    id,
    timestamp,
    hash,
    previousHash,
    status: event.severity === 'CRITICAL' ? 'Flagged' : 'Verified'
  };

  const updated = [newEvent, ...currentEvents];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('audit-trail-updated', { detail: newEvent }));
  } catch (e) {
    console.error('Failed to persist audit trail event', e);
  }
  return newEvent;
}

export const appendAuditTrailEvent = logAuditTrailEvent;

export function verifyTrailIntegrity(): { isValid: boolean; verifiedCount: number; brokenIndex?: number } {
  const events = getAuditTrailEvents();
  if (events.length === 0) return { isValid: true, verifiedCount: 0 };

  // Traverse and check backward linking
  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const previous = events[i + 1];
    if (current.previousHash !== previous.hash) {
      return { isValid: false, verifiedCount: i, brokenIndex: i };
    }
  }
  return { isValid: true, verifiedCount: events.length };
}
