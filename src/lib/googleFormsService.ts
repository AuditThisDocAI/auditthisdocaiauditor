import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { auth } from './firebase';
import { getCachedGmailToken, setCachedGmailToken } from './gmailService';

export const FORMS_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];

let cachedFormsToken: string | null = null;

export function getCachedFormsToken(): string | null {
  return cachedFormsToken || getCachedGmailToken();
}

export function setCachedFormsToken(token: string | null) {
  cachedFormsToken = token;
  if (token) {
    setCachedGmailToken(token);
  }
}

export interface GoogleFormSummary {
  id: string;
  name: string;
  webViewLink?: string;
  responderUri?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface GoogleFormQuestionItem {
  itemId: string;
  title: string;
  description?: string;
  questionType: 'TEXT' | 'PARAGRAPH' | 'CHOICE' | 'CHECKBOX' | 'SCALE';
  options?: string[];
  required?: boolean;
}

export interface GoogleFormDetail {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  revisionId?: string;
  items?: any[];
}

export interface FormResponseItem {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers: Record<string, { questionTitle: string; answers: string[] }>;
}

export const signInWithFormsScopes = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    FORMS_SCOPES.forEach((scope) => {
      provider.addScope(scope);
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token for Forms & Drive API.');
    }

    setCachedFormsToken(credential.accessToken);
    localStorage.setItem('audit-this-doc-cms-auth', 'true');
    localStorage.setItem('audit-this-doc-user-email', result.user.email || '');

    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google Forms Sign-In error:', error);
    throw error;
  }
};

/**
 * List all Google Forms created by or accessible to the user via Drive API
 */
export async function listUserGoogleForms(accessToken: string): Promise<GoogleFormSummary[]> {
  const query = "mimeType='application/vnd.google-apps.form' and trashed=false";
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, webViewLink, createdTime, modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: '50',
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list Google Forms (HTTP ${res.status})`);
  }

  const data = await res.json();
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    webViewLink: file.webViewLink,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
  }));
}

/**
 * Fetch detailed form schema & question items
 */
export async function getGoogleForm(accessToken: string, formId: string): Promise<GoogleFormDetail> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Form details (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Fetch all submitted responses for a given Google Form
 */
export async function getGoogleFormResponses(
  accessToken: string,
  formId: string,
  formItems?: any[]
): Promise<FormResponseItem[]> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Form responses (HTTP ${res.status})`);
  }

  const data = await res.json();
  const responses = data.responses || [];

  // Map questionId -> question title for friendly display
  const questionMap: Record<string, string> = {};
  if (formItems && Array.isArray(formItems)) {
    formItems.forEach((item) => {
      if (item.questionItem?.question?.questionId) {
        questionMap[item.questionItem.question.questionId] = item.title || 'Untitled Question';
      }
    });
  }

  return responses.map((r: any) => {
    const answersObj: Record<string, { questionTitle: string; answers: string[] }> = {};
    if (r.answers) {
      Object.keys(r.answers).forEach((qId) => {
        const ans = r.answers[qId];
        const answersList = ans?.textAnswers?.answers?.map((a: any) => a.value) || [];
        answersObj[qId] = {
          questionTitle: questionMap[qId] || `Question ID: ${qId.slice(-6)}`,
          answers: answersList,
        };
      });
    }

    return {
      responseId: r.responseId,
      createTime: r.createTime,
      lastSubmittedTime: r.lastSubmittedTime,
      respondentEmail: r.respondentEmail,
      answers: answersObj,
    };
  });
}

/**
 * Create a new Google Form and configure initial questions via batchUpdate
 */
export async function createGoogleForm(
  accessToken: string,
  title: string,
  description?: string,
  questions?: Array<{
    title: string;
    description?: string;
    type: 'TEXT' | 'PARAGRAPH' | 'CHOICE' | 'CHECKBOX';
    options?: string[];
    required?: boolean;
  }>
): Promise<GoogleFormDetail> {
  // 1. Create empty form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: title.trim(),
        documentTitle: title.trim(),
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Form (HTTP ${createRes.status})`);
  }

  const createdForm: GoogleFormDetail = await createRes.json();
  const formId = createdForm.formId;

  // 2. Prepare batchUpdate requests if questions or description provided
  const requests: any[] = [];

  if (description) {
    requests.push({
      updateFormInfo: {
        info: {
          description: description.trim(),
        },
        updateMask: 'description',
      },
    });
  }

  if (questions && questions.length > 0) {
    questions.forEach((q, index) => {
      let questionObject: any = {
        required: q.required ?? true,
      };

      if (q.type === 'TEXT') {
        questionObject.textQuestion = { paragraph: false };
      } else if (q.type === 'PARAGRAPH') {
        questionObject.textQuestion = { paragraph: true };
      } else if (q.type === 'CHOICE' || q.type === 'CHECKBOX') {
        questionObject.choiceQuestion = {
          type: q.type === 'CHOICE' ? 'RADIO' : 'CHECKBOX',
          options: (q.options || ['Yes', 'No', 'Under Review']).map((opt) => ({ value: opt })),
          shuffle: false,
        };
      }

      requests.push({
        createItem: {
          item: {
            title: q.title,
            description: q.description || undefined,
            questionItem: {
              question: questionObject,
            },
          },
          location: {
            index,
          },
        },
      });
    });
  }

  if (requests.length > 0) {
    const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!batchRes.ok) {
      const err = await batchRes.json().catch(() => ({}));
      console.warn('Form batchUpdate warning:', err);
    }
  }

  // Fetch updated form to get final items and responderUri
  return getGoogleForm(accessToken, formId);
}

/**
 * Pre-configured Forensic Audit Templates
 */
export const AUDIT_FORM_TEMPLATES = [
  {
    id: 'vendor_bank_confirmation',
    title: 'Vendor Banking Coordinates & Identity Confirmation',
    description: 'Mandatory supplier verification form to prevent business email compromise (BEC) and unauthorized remittance account alterations.',
    category: 'Fraud Prevention',
    questions: [
      { title: 'Official Registered Corporate Name', type: 'TEXT' as const, required: true },
      { title: 'Tax Identification / VAT Registration Number', type: 'TEXT' as const, required: true },
      { title: 'Authorized Finance Director / Controller Full Name', type: 'TEXT' as const, required: true },
      { title: 'Official Remittance Bank Name & SWIFT / BIC Code', type: 'TEXT' as const, required: true },
      { title: 'Bank Account Number / IBAN', type: 'TEXT' as const, required: true },
      { 
        title: 'Have your company banking coordinates changed within the last 90 days?', 
        type: 'CHOICE' as const, 
        options: ['No - Bank coordinates are unchanged', 'Yes - Coordinates were officially changed with bank letterhead proof', 'Pending Bank Transition'], 
        required: true 
      },
      { title: 'Attach / Describe Supporting Verification Details', type: 'PARAGRAPH' as const, required: false },
    ],
  },
  {
    id: 'client_intake_questionnaire',
    title: 'Client Financial Audit & Internal Controls Assessment',
    description: 'Preliminary assurance questionnaire assessing entity internal controls, segregation of duties, and statutory compliance status.',
    category: 'Assurance & Controls',
    questions: [
      { title: 'Audited Entity Full Legal Name', type: 'TEXT' as const, required: true },
      { title: 'Fiscal Year / Period Under Audit', type: 'TEXT' as const, required: true },
      { 
        title: 'Primary Accounting System Used', 
        type: 'CHOICE' as const, 
        options: ['QuickBooks Online / Desktop', 'Xero', 'Sage Intacct', 'NetSuite / SAP', 'Custom ERP / Other'], 
        required: true 
      },
      { 
        title: 'Are dual authorizations enforced for payments exceeding $5,000?', 
        type: 'CHOICE' as const, 
        options: ['Yes - Strictly Enforced', 'Partial - Only for Executive Payroll', 'No - Single Approver Authority'], 
        required: true 
      },
      { title: 'List of Authorized Bank Signatories & Approval Thresholds', type: 'PARAGRAPH' as const, required: true },
      { title: 'Known Discrepancies, Round-Number Retainers, or Unreconciled Items', type: 'PARAGRAPH' as const, required: false },
    ],
  },
  {
    id: 'sox_compliance_inquiry',
    title: 'SOX 404 / AML Anti-Fraud Control Certification',
    description: 'Annual corporate governance and anti-money laundering confirmation form for department heads and controllers.',
    category: 'Compliance & Governance',
    questions: [
      { title: 'Department / Operating Division', type: 'TEXT' as const, required: true },
      { title: 'Certifying Officer Name & Title', type: 'TEXT' as const, required: true },
      { 
        title: 'Are all vendor invoices cross-matched with approved Purchase Orders before release?', 
        type: 'CHOICE' as const, 
        options: ['100% 3-Way Matched (PO + Receipt + Invoice)', '2-Way Matched', 'Discretionary / No Formal PO'], 
        required: true 
      },
      { 
        title: 'Have any weekend or off-hour manual journal entries occurred in this quarter?', 
        type: 'CHOICE' as const, 
        options: ['No weekend ledger adjustments', 'Yes - Documented & Management Approved', 'Yes - Under Review'], 
        required: true 
      },
      { title: 'Details of Any Material Weaknesses or Suspected Fraud Incidents', type: 'PARAGRAPH' as const, required: false },
    ],
  },
];
