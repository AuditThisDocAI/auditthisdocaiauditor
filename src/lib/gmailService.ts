import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from './firebase';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

// In-memory access token cache (NEVER stored in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function getCachedGmailToken(): string | null {
  return cachedAccessToken;
}

export function setCachedGmailToken(token: string | null) {
  cachedAccessToken = token;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailAttachmentInfo {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  timestamp: number;
  labelIds: string[];
  unread: boolean;
  hasAttachments: boolean;
  attachments: GmailAttachmentInfo[];
  bodyText: string;
  bodyHtml?: string;
  isFinancial: boolean;
  riskFlags: string[];
}

export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGmailScopes = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => {
      provider.addScope(scope);
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token for Gmail API.');
    }

    cachedAccessToken = credential.accessToken;
    
    // Save authentication state
    localStorage.setItem('audit-this-doc-cms-auth', 'true');
    localStorage.setItem('audit-this-doc-user-email', result.user.email || '');

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Gmail Sign-In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const disconnectGmail = async () => {
  cachedAccessToken = null;
  await auth.signOut();
};

export async function fetchGmailProfile(accessToken: string): Promise<GmailProfile> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Gmail profile (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * List financial or general emails from Gmail with optional query filter
 */
export async function listGmailMessages(
  accessToken: string,
  options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}
): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string; resultSizeEstimate: number }> {
  const max = options.maxResults || 20;
  let q = options.query || '';
  
  const params = new URLSearchParams({
    maxResults: String(max),
  });

  if (q.trim()) {
    params.set('q', q.trim());
  }

  if (options.pageToken) {
    params.set('pageToken', options.pageToken);
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list Gmail messages (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate || 0,
  };
}

function parseHeaders(headers: Array<{ name: string; value: string }>) {
  const headerMap: Record<string, string> = {};
  headers?.forEach((h) => {
    headerMap[h.name.toLowerCase()] = h.value;
  });
  return {
    subject: headerMap['subject'] || '(No Subject)',
    from: headerMap['from'] || 'Unknown Sender',
    to: headerMap['to'] || '',
    date: headerMap['date'] || '',
  };
}

function decodeBase64Url(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    try {
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

function extractBodyAndAttachments(payload: any) {
  let bodyText = '';
  let bodyHtml = '';
  const attachments: GmailAttachmentInfo[] = [];

  function traverseParts(part: any) {
    if (!part) return;

    if (part.filename && part.body && part.body.attachmentId) {
      attachments.push({
        attachmentId: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body.size || 0,
      });
    }

    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += decodeBase64Url(part.body.data) + '\n';
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml += decodeBase64Url(part.body.data) + '\n';
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(traverseParts);
    }
  }

  if (payload) {
    traverseParts(payload);
    if (!bodyText && payload.body?.data) {
      bodyText = decodeBase64Url(payload.body.data);
    }
  }

  return { bodyText: bodyText.trim(), bodyHtml: bodyHtml.trim(), attachments };
}

/**
 * Checks for forensic wire fraud and discrepancy risk flags in financial emails
 */
function analyzeEmailRiskFlags(subject: string, bodyText: string, from: string): string[] {
  const flags: string[] = [];
  const text = `${subject} ${bodyText}`.toLowerCase();

  if (text.includes('bank details changed') || text.includes('new banking details') || text.includes('updated payment details')) {
    flags.push('High Risk: Vendor Bank Details Change Detected');
  }
  if (text.includes('urgent wire transfer') || text.includes('immediate transfer required') || text.includes('urgent payment today')) {
    flags.push('Suspicious: Urgent Wire Pressure Tactic');
  }
  if (text.includes('confidential request') || text.includes('do not inform other staff')) {
    flags.push('Critical: Executive Impersonation / CEO Fraud Signature');
  }
  if (text.includes('overdue payment') && (text.includes('click here to pay') || text.includes('verify wallet'))) {
    flags.push('Phishing Warning: Suspicious Payment Verification Link');
  }
  if (text.includes('tax invoice') || text.includes('invoice') || text.includes('receipt') || text.includes('remittance advice') || text.includes('statement')) {
    // Normal financial document tag
  }

  return flags;
}

export async function fetchGmailMessageDetails(accessToken: string, messageId: string): Promise<GmailMessageSummary> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch message details (HTTP ${res.status})`);
  }

  const data = await res.json();
  const headers = parseHeaders(data.payload?.headers || []);
  const { bodyText, bodyHtml, attachments } = extractBodyAndAttachments(data.payload);
  const unread = (data.labelIds || []).includes('UNREAD');
  const timestamp = parseInt(data.internalDate || '0', 10);
  const riskFlags = analyzeEmailRiskFlags(headers.subject, bodyText, headers.from);
  
  const isFinancial = 
    headers.subject.toLowerCase().includes('invoice') ||
    headers.subject.toLowerCase().includes('receipt') ||
    headers.subject.toLowerCase().includes('payment') ||
    headers.subject.toLowerCase().includes('bill') ||
    headers.subject.toLowerCase().includes('statement') ||
    headers.subject.toLowerCase().includes('wire') ||
    bodyText.toLowerCase().includes('invoice') ||
    bodyText.toLowerCase().includes('total amount') ||
    attachments.some(a => a.filename.toLowerCase().endsWith('.pdf') || a.filename.toLowerCase().endsWith('.csv'));

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    subject: headers.subject,
    from: headers.from,
    to: headers.to,
    date: headers.date,
    timestamp,
    labelIds: data.labelIds || [],
    unread,
    hasAttachments: attachments.length > 0,
    attachments,
    bodyText: bodyText || data.snippet || '',
    bodyHtml,
    isFinancial,
    riskFlags,
  };
}

/**
 * Download attachment data (Base64) from a message
 */
export async function fetchGmailAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<{ data: string; size: number }> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch attachment (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Send an email via Gmail API
 * Required format: RFC 2822 base64url-encoded message string
 */
export async function sendGmailMessage(
  accessToken: string,
  payload: {
    to: string;
    subject: string;
    bodyHtml: string;
    fromEmail?: string;
    cc?: string;
  }
): Promise<{ id: string; threadId: string; labelIds: string[] }> {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`;
  
  const emailLines: string[] = [
    `To: ${payload.to}`,
    ...(payload.cc ? [`Cc: ${payload.cc}`] : []),
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    payload.bodyHtml,
  ];

  const rawEmail = emailLines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email via Gmail (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Move a message to Trash
 */
export async function trashGmailMessage(accessToken: string, messageId: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to trash message (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Mark a message as read or add/remove labels
 */
export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addLabelIds,
      removeLabelIds,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to modify message labels (HTTP ${res.status})`);
  }

  return res.json();
}
