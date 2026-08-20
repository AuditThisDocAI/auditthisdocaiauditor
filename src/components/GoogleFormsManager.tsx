import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  Lock, 
  LogOut, 
  Copy, 
  Check, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  Building2, 
  FileCheck, 
  MessageSquare,
  ClipboardList,
  Eye,
  Trash2
} from 'lucide-react';
import { 
  signInWithFormsScopes, 
  getCachedFormsToken, 
  setCachedFormsToken, 
  listUserGoogleForms, 
  getGoogleForm, 
  getGoogleFormResponses, 
  createGoogleForm, 
  AUDIT_FORM_TEMPLATES,
  GoogleFormSummary, 
  GoogleFormDetail, 
  FormResponseItem 
} from '../lib/googleFormsService';
import { sendGmailMessage, getCachedGmailToken } from '../lib/gmailService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface GoogleFormsManagerProps {
  onAuditFormResponses?: (auditText: string, title: string) => void;
}

export function GoogleFormsManager({ onAuditFormResponses }: GoogleFormsManagerProps) {
  const [accessToken, setAccessToken] = useState<string | null>(getCachedFormsToken());
  const [formsList, setFormsList] = useState<GoogleFormSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  
  // Selected Form View / Responses
  const [selectedFormDetail, setSelectedFormDetail] = useState<GoogleFormDetail | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponseItem[]>([]);
  const [loadingResponses, setLoadingResponses] = useState<boolean>(false);
  const [showResponsesModal, setShowResponsesModal] = useState<boolean>(false);

  // Custom Form Builder Modal
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('Vendor Compliance & Invoicing Inquiries');
  const [customDesc, setCustomDesc] = useState<string>('Formal auditor clarification regarding pending transaction invoices and payment schedules.');
  const [customQuestions, setCustomQuestions] = useState<Array<{
    title: string;
    type: 'TEXT' | 'PARAGRAPH' | 'CHOICE' | 'CHECKBOX';
    options?: string[];
    required: boolean;
  }>>([
    { title: 'Company / Vendor Legal Entity Name', type: 'TEXT', required: true },
    { title: 'Invoice Number(s) Under Review', type: 'TEXT', required: true },
    { title: 'Are the banking coordinates unchanged from prior periods?', type: 'CHOICE', options: ['Yes - Verified', 'No - Changed recently', 'Unsure'], required: true },
    { title: 'Additional Clarifications or Discrepancy Explanations', type: 'PARAGRAPH', required: false },
  ]);
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);

  // Email Sharing Modal
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    form: GoogleFormSummary | null;
    recipientEmail: string;
    subject: string;
    message: string;
    isSending: boolean;
  }>({
    isOpen: false,
    form: null,
    recipientEmail: '',
    subject: '',
    message: '',
    isSending: false,
  });

  // Feedback Toasts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToastSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  const showToastError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Sync token from Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const cached = getCachedFormsToken();
      if (user && cached) {
        setAccessToken(cached);
        loadForms(cached);
      } else {
        setAccessToken(cached);
      }
    });
    return () => unsub();
  }, []);

  const loadForms = useCallback(async (token: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const forms = await listUserGoogleForms(token);
      setFormsList(forms);
    } catch (err: any) {
      console.error('Failed to load Google Forms:', err);
      if (err.message?.includes('401') || err.message?.includes('UNAUTHENTICATED')) {
        setCachedFormsToken(null);
        setAccessToken(null);
        showToastError('Google session expired. Please connect your Google account again.');
      } else {
        showToastError(err.message || 'Failed to list Google Forms.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnectGoogle = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await signInWithFormsScopes();
      if (result) {
        setAccessToken(result.accessToken);
        showToastSuccess(`Connected with Google Forms & Drive`);
        await loadForms(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Forms Auth failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showToastError('Authorization popup was closed before completion.');
      } else {
        showToastError(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDisconnect = () => {
    setCachedFormsToken(null);
    setAccessToken(null);
    setFormsList([]);
    setSelectedFormDetail(null);
    setFormResponses([]);
    showToastSuccess('Google account disconnected.');
  };

  const handleCreateFromTemplate = async (tmpl: typeof AUDIT_FORM_TEMPLATES[0]) => {
    if (!accessToken) {
      showToastError('Please connect your Google account first.');
      return;
    }

    setCreatingTemplateId(tmpl.id);
    try {
      const newForm = await createGoogleForm(
        accessToken,
        tmpl.title,
        tmpl.description,
        tmpl.questions
      );

      showToastSuccess(`Created Google Form: "${newForm.info?.title || tmpl.title}"`);
      await loadForms(accessToken);
    } catch (err: any) {
      console.error('Template creation error:', err);
      showToastError(err.message || 'Failed to generate Google Form from template.');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const handleCreateCustomForm = async () => {
    if (!accessToken) return;
    if (!customTitle.trim()) {
      showToastError('Please provide a form title.');
      return;
    }

    setIsCreatingCustom(true);
    try {
      const newForm = await createGoogleForm(
        accessToken,
        customTitle.trim(),
        customDesc.trim(),
        customQuestions
      );

      setShowCustomModal(false);
      showToastSuccess(`Custom form "${newForm.info?.title || customTitle}" created successfully!`);
      await loadForms(accessToken);
    } catch (err: any) {
      console.error('Custom form creation error:', err);
      showToastError(err.message || 'Failed to create custom Google Form.');
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const handleInspectResponses = async (form: GoogleFormSummary) => {
    if (!accessToken) return;
    setLoadingResponses(true);
    setShowResponsesModal(true);
    try {
      // 1. Fetch form structure
      const detail = await getGoogleForm(accessToken, form.id);
      setSelectedFormDetail(detail);

      // 2. Fetch responses
      const responses = await getGoogleFormResponses(accessToken, form.id, detail.items);
      setFormResponses(responses);
    } catch (err: any) {
      console.error('Failed to load form responses:', err);
      showToastError(err.message || 'Failed to fetch form responses from Google Forms API.');
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showToastSuccess('Form link copied to clipboard!');
  };

  const handleSendFormEmail = (form: GoogleFormSummary) => {
    const formUrl = form.responderUri || form.webViewLink || `https://docs.google.com/forms/d/${form.id}/viewform`;
    setShareModal({
      isOpen: true,
      form,
      recipientEmail: '',
      subject: `Action Required: ${form.name} (Forensic Audit Verification)`,
      message: `Dear Client / Vendor Representative,

In accordance with our formal assurance and forensic compliance audit procedures, please complete the following verification form:

Form Title: ${form.name}
Secure Submission Link: ${formUrl}

Your timely response ensures proper ledger verification, vendor bank detail authentication, and prevents unauthorized remittance holds.

Sincerely,
Forensic Document Audit & Assurance Services`,
      isSending: false,
    });
  };

  const handleConfirmSendFormEmail = async () => {
    const token = accessToken || getCachedGmailToken();
    if (!token) {
      showToastError('No active Google authorization token found to send email.');
      return;
    }
    if (!shareModal.recipientEmail.trim() || !shareModal.subject.trim()) {
      showToastError('Please specify the recipient email address.');
      return;
    }

    setShareModal((prev) => ({ ...prev, isSending: true }));
    try {
      const htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1E293B; line-height: 1.6;">
        ${shareModal.message.replace(/\n/g, '<br/>')}
        <br/><br/>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${shareModal.form?.responderUri || shareModal.form?.webViewLink || '#'}" style="background-color: #7C3AED; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Open & Complete Verification Form
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748B;">
          Certified via <strong>FORENSICDOC AUDIT</strong> Google Forms & Assurance Engine.
        </p>
      </div>`;

      await sendGmailMessage(token, {
        to: shareModal.recipientEmail.trim(),
        subject: shareModal.subject.trim(),
        bodyHtml: htmlBody,
      });

      setShareModal((prev) => ({ ...prev, isOpen: false, isSending: false }));
      showToastSuccess(`Form link emailed to ${shareModal.recipientEmail}!`);
    } catch (err: any) {
      console.error('Failed to send form via Gmail:', err);
      showToastError(err.message || 'Failed to dispatch form email.');
      setShareModal((prev) => ({ ...prev, isSending: false }));
    }
  };

  const handleIngestIntoForensicScanner = () => {
    if (!selectedFormDetail || formResponses.length === 0) return;

    let auditText = `--- AUDITED GOOGLE FORM SUBMISSION REPORT ---
Form Title: ${selectedFormDetail.info?.title || 'Form Assessment'}
Description: ${selectedFormDetail.info?.description || 'N/A'}
Total Submissions Collected: ${formResponses.length}
Date of Ingestion: ${new Date().toLocaleDateString()}

`;

    formResponses.forEach((resp, idx) => {
      auditText += `\n=== SUBMISSION #${idx + 1} (${resp.respondentEmail || 'Anonymous Respondent'}) ===\n`;
      auditText += `Submitted At: ${resp.lastSubmittedTime || resp.createTime || 'Recorded'}\n`;
      
      Object.keys(resp.answers).forEach((qId) => {
        const item = resp.answers[qId];
        auditText += `* ${item.questionTitle}:\n  Answer: ${item.answers.join(', ') || '(No Answer)'}\n`;
      });
    });

    if (onAuditFormResponses) {
      onAuditFormResponses(auditText, `Google Form: ${selectedFormDetail.info?.title}`);
    } else {
      sessionStorage.setItem('pending_gmail_audit_text', auditText);
      sessionStorage.setItem('pending_gmail_audit_name', `Google Form: ${selectedFormDetail.info?.title}`);
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
      setTimeout(() => {
        const auditorElem = document.getElementById('document-auditor');
        if (auditorElem) {
          auditorElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
    setShowResponsesModal(false);
    showToastSuccess('Form responses transferred to Dr. Aria Forensic Auditor!');
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-8">
        {/* Top Header */}
        <div className="p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-700/20">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#1E293B]">Google Forms Audit Intake Engine</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                  Live API
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Generate vendor bank coordinate questionnaires, client audit intake forms, and ingest real-time responses into the forensic engine.
              </p>
            </div>
          </div>

          {/* Right Action / Auth Controls */}
          {accessToken ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => loadForms(accessToken)}
                disabled={loading}
                className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Refresh Forms from Drive"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              </button>
              <button
                onClick={() => setShowCustomModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom Audit Form</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Disconnect Google Forms"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleConnectGoogle}
                disabled={isSigningIn}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 shadow-sm flex items-center gap-2 transition-all cursor-pointer hover:border-purple-400"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting Google...' : 'Connect Google Forms'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 1-Click Forensic Templates Section */}
        <div className="p-6 bg-slate-50/60 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1E293B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Forensic Pre-Built Audit Questionnaires</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                Deploy standardized questionnaires to Google Forms in one click to collect verified audit evidence.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AUDIT_FORM_TEMPLATES.map((tmpl) => {
              const isCreating = creatingTemplateId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100">
                        {tmpl.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {tmpl.questions.length} questions
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mb-1 leading-snug">
                      {tmpl.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      {tmpl.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCreateFromTemplate(tmpl)}
                    disabled={isCreating}
                    className="w-full py-2 bg-slate-900 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deploying to Google Forms...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Deploy Template</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Google Forms Library */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#1E293B]">
                Your Connected Google Forms Library ({formsList.length})
              </h3>
              <p className="text-xs text-[#64748B]">
                Audit forms created via the Google Forms API or accessible in your Google Drive.
              </p>
            </div>
          </div>

          {!accessToken ? (
            <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
              <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Connect Google to View & Audit Your Google Forms</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Authorize read and creation access for Forms and Drive.</p>
              <button
                onClick={handleConnectGoogle}
                disabled={isSigningIn}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Connect Google Account
              </button>
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
              <span className="text-xs font-bold">Fetching Google Forms from Drive...</span>
            </div>
          ) : formsList.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No Google Forms Found</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                Click a template above to generate your first client verification questionnaire.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formsList.map((form) => {
                const formUrl = form.responderUri || form.webViewLink || `https://docs.google.com/forms/d/${form.id}/viewform`;
                const isCopied = copiedId === form.id;

                return (
                  <div
                    key={form.id}
                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-purple-300 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                            <ClipboardList className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            Form ID: {form.id.slice(-6)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {form.modifiedTime ? new Date(form.modifiedTime).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 mb-2 line-clamp-2">
                        {form.name}
                      </h4>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleInspectResponses(form)}
                          className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Responses</span>
                        </button>
                        <button
                          onClick={() => handleSendFormEmail(form)}
                          className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Email Form</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleCopyLink(formUrl, form.id)}
                          className="text-[11px] font-bold text-slate-500 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                        </button>

                        <a
                          href={`https://docs.google.com/forms/d/${form.id}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          <span>Open in Google</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inspect Responses Modal */}
      {showResponsesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedFormDetail?.info?.title || 'Form Responses'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live responses collected through Google Forms API ({formResponses.length} submissions)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResponsesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Responses List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingResponses ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
                  <span className="text-xs font-bold">Querying Google Forms Responses API...</span>
                </div>
              ) : formResponses.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Responses Submitted Yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Share the form link with your client or vendor. Once they submit their answers, click Refresh to review them here.
                  </p>
                </div>
              ) : (
                formResponses.map((resp, idx) => (
                  <div key={resp.responseId} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                      <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                        Submission #{idx + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {resp.respondentEmail || 'Anonymous'} • {new Date(resp.lastSubmittedTime || resp.createTime).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {Object.keys(resp.answers).map((qId) => {
                        const ansItem = resp.answers[qId];
                        return (
                          <div key={qId} className="text-xs">
                            <div className="font-bold text-slate-800">{ansItem.questionTitle}</div>
                            <div className="text-slate-600 mt-0.5 font-medium bg-white p-2.5 rounded-xl border border-slate-200">
                              {ansItem.answers.join(', ') || '(No response provided)'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <button
                onClick={() => setShowResponsesModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              {formResponses.length > 0 && (
                <button
                  onClick={handleIngestIntoForensicScanner}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ingest into Dr. Aria Forensic Auditor</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Form Builder Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Custom Google Form Builder</h3>
                  <p className="text-xs text-slate-500">Configure questions and publish directly to Google Forms API.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Form Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Q3 Vendor Compliance Verification"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Instructions for respondents..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 font-sans"
                />
              </div>

              {/* Questions Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">Questions ({customQuestions.length})</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomQuestions((prev) => [
                        ...prev,
                        { title: 'New Question Title', type: 'TEXT', required: true },
                      ]);
                    }}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {customQuestions.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={q.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomQuestions((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, title: val } : item))
                            );
                          }}
                          placeholder={`Question #${idx + 1}`}
                          className="flex-1 px-3 py-1.5 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomQuestions((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                          title="Remove Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const type = e.target.value as any;
                            setCustomQuestions((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      type,
                                      options:
                                        type === 'CHOICE' || type === 'CHECKBOX'
                                          ? item.options || ['Option 1', 'Option 2']
                                          : undefined,
                                    }
                                  : item
                              )
                            );
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                        >
                          <option value="TEXT">Short Text</option>
                          <option value="PARAGRAPH">Paragraph Text</option>
                          <option value="CHOICE">Multiple Choice (Radio)</option>
                          <option value="CHECKBOX">Checkboxes</option>
                        </select>

                        <label className="flex items-center gap-1.5 font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => {
                              const req = e.target.checked;
                              setCustomQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, required: req } : item))
                              );
                            }}
                            className="rounded text-purple-600"
                          />
                          <span>Required</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomForm}
                disabled={isCreatingCustom}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingCustom ? 'Creating in Google...' : 'Deploy Form to Google'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Form via Gmail Modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Email Google Form to Client/Vendor</h3>
              </div>
              <button
                onClick={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email (To:)</label>
                <input
                  type="email"
                  value={shareModal.recipientEmail}
                  onChange={(e) => setShareModal((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="client@firm.com or supplier@vendor.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={shareModal.subject}
                  onChange={(e) => setShareModal((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={6}
                  value={shareModal.message}
                  onChange={(e) => setShareModal((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendFormEmail}
                disabled={shareModal.isSending}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{shareModal.isSending ? 'Sending via Gmail...' : 'Send Form Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
