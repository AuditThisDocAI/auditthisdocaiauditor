import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Paperclip, 
  Send, 
  Trash2, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Sparkles, 
  Inbox, 
  LogOut, 
  FileSearch,
  FileCheck2,
  Lock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { 
  signInWithGmailScopes, 
  getCachedGmailToken, 
  setCachedGmailToken, 
  disconnectGmail, 
  fetchGmailProfile, 
  listGmailMessages, 
  fetchGmailMessageDetails, 
  sendGmailMessage, 
  trashGmailMessage, 
  modifyGmailMessageLabels,
  GmailProfile, 
  GmailMessageSummary 
} from '../lib/gmailService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface GmailAuditorProps {
  onAuditDocument?: (docText: string, docName: string) => void;
}

export function GmailAuditor({ onAuditDocument }: GmailAuditorProps) {
  const [accessToken, setAccessToken] = useState<string | null>(getCachedGmailToken());
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('invoice OR receipt OR statement OR "wire transfer" OR payment');
  const [activeFilter, setActiveFilter] = useState<'financial' | 'suspicious' | 'attachments' | 'unread' | 'all'>('financial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Send Email Modal State
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [sendTo, setSendTo] = useState<string>('');
  const [sendSubject, setSendSubject] = useState<string>('');
  const [sendBody, setSendBody] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Destructive Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });

  const showToastSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showToastError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Check auth and token on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const cached = getCachedGmailToken();
      if (user && cached) {
        setAccessToken(cached);
        loadProfileAndMessages(cached);
      } else {
        setAccessToken(cached);
      }
    });
    return () => unsub();
  }, []);

  const loadProfileAndMessages = useCallback(async (token: string, customQuery?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch Profile
      const prof = await fetchGmailProfile(token);
      setProfile(prof);

      // 2. Fetch Messages
      const queryToRun = customQuery !== undefined ? customQuery : searchQuery;
      const listRes = await listGmailMessages(token, {
        query: queryToRun,
        maxResults: 15,
      });

      if (!listRes.messages || listRes.messages.length === 0) {
        setMessages([]);
        setSelectedMessage(null);
        setLoading(false);
        return;
      }

      // 3. Fetch Details for top messages in parallel
      const detailPromises = listRes.messages.map((m) =>
        fetchGmailMessageDetails(token, m.id).catch((e) => {
          console.warn(`Failed to fetch message ${m.id}`, e);
          return null;
        })
      );

      const resolved = await Promise.all(detailPromises);
      const validMessages = resolved.filter((m): m is GmailMessageSummary => m !== null);
      
      setMessages(validMessages);
      if (validMessages.length > 0) {
        setSelectedMessage(validMessages[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
      if (err.message?.includes('401') || err.message?.includes('UNAUTHENTICATED') || err.message?.includes('Invalid Credentials')) {
        setCachedGmailToken(null);
        setAccessToken(null);
        showToastError('Gmail authorization session expired. Please sign in again.');
      } else {
        showToastError(err.message || 'Failed to communicate with Gmail API.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleConnectGmail = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await signInWithGmailScopes();
      if (result) {
        setAccessToken(result.accessToken);
        showToastSuccess(`Connected to Gmail as ${result.user.email || 'User'}`);
        await loadProfileAndMessages(result.accessToken);
      }
    } catch (err: any) {
      console.error('Connect Gmail failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showToastError('Google Sign-In popup was closed before completing authorization.');
      } else if (err.code === 'auth/popup-blocked') {
        showToastError('Google Sign-In popup was blocked by your browser. Please enable popups.');
      } else {
        showToastError(err.message || 'Failed to authenticate with Google Gmail.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDisconnect = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Disconnect Gmail Account?',
      description: 'You will be disconnected from the Gmail API and your access token will be wiped from memory.',
      confirmText: 'Disconnect',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await disconnectGmail();
        setAccessToken(null);
        setProfile(null);
        setMessages([]);
        setSelectedMessage(null);
        showToastSuccess('Gmail account disconnected safely.');
      },
    });
  };

  const handleFilterChange = (filter: 'financial' | 'suspicious' | 'attachments' | 'unread' | 'all') => {
    setActiveFilter(filter);
    if (!accessToken) return;

    let query = '';
    if (filter === 'financial') {
      query = 'invoice OR receipt OR statement OR "wire transfer" OR payment OR bill';
    } else if (filter === 'suspicious') {
      query = '"bank details" OR "urgent wire" OR "confidential payment" OR "account changed" OR "new bank"';
    } else if (filter === 'attachments') {
      query = 'has:attachment (filename:pdf OR filename:csv OR filename:xlsx)';
    } else if (filter === 'unread') {
      query = 'is:unread';
    } else {
      query = '';
    }

    setSearchQuery(query);
    loadProfileAndMessages(accessToken, query);
  };

  const handleAuditSelectedEmail = (msg: GmailMessageSummary) => {
    const emailAuditText = `--- AUDITED FINANCIAL EMAIL CONTENT ---
Sender: ${msg.from}
Recipient: ${msg.to}
Date: ${msg.date}
Subject: ${msg.subject}
Has Attachments: ${msg.hasAttachments ? msg.attachments.map(a => a.filename).join(', ') : 'None'}

--- BODY & INVOICE DETAILS ---
${msg.bodyText}
`;

    if (onAuditDocument) {
      onAuditDocument(emailAuditText, `Gmail: ${msg.subject}`);
    } else {
      // Trigger navigation to document auditor and populate text
      sessionStorage.setItem('pending_gmail_audit_text', emailAuditText);
      sessionStorage.setItem('pending_gmail_audit_name', `Gmail: ${msg.subject}`);
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
      setTimeout(() => {
        const auditorElem = document.getElementById('document-auditor');
        if (auditorElem) {
          auditorElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  };

  const handleOpenSendModal = (msg?: GmailMessageSummary) => {
    if (msg) {
      // Extract clean email address from "Name <email@example.com>"
      const emailMatch = msg.from.match(/<([^>]+)>/) || [null, msg.from];
      const replyTo = emailMatch[1] || msg.from;
      setSendTo(replyTo);
      setSendSubject(`Audit Attestation & Review: ${msg.subject}`);
      setSendBody(`Dear Vendor/Client,

We have conducted a forensic compliance audit regarding your recent correspondence (${msg.subject}).

Status: Under Formal Review
Audit Engagement Code: AUD-${Date.now().toString().slice(-6)}

Please verify that all transaction amounts, VAT registration identifiers, and banking remittance codes match your certified accounts receivable record.

Sincerely,
Forensic Document Audit & Assurance Team`);
    } else {
      setSendTo('');
      setSendSubject('Forensic Document Audit Report & Clarification Request');
      setSendBody(`Dear Client,

Please find attached our formal auditor attestation and risk inquiry regarding your submitted ledger.

Sincerely,
Assurance & Forensic Audit Services`);
    }
    setShowSendModal(true);
  };

  const handleConfirmSendEmail = () => {
    if (!sendTo.trim() || !sendSubject.trim() || !sendBody.trim()) {
      showToastError('Please complete all email fields.');
      return;
    }

    // MANDATORY USER CONFIRMATION DIALOG BEFORE SENDING
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Outbound Email Dispatch',
      description: `You are about to send an official email to "${sendTo}" with subject "${sendSubject}" from your authorized Gmail address. Are you sure you want to proceed?`,
      confirmText: 'Send Email Now',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setIsSending(true);
        try {
          const htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1E293B; line-height: 1.6;">
            ${sendBody.replace(/\n/g, '<br/>')}
            <br/><br/>
            <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748B;">
              Verified through <strong>FORENSICDOC AUDIT</strong> Assurance Engine.
            </p>
          </div>`;

          await sendGmailMessage(accessToken, {
            to: sendTo.trim(),
            subject: sendSubject.trim(),
            bodyHtml: htmlBody,
          });

          setShowSendModal(false);
          showToastSuccess(`Email successfully sent to ${sendTo}!`);
        } catch (err: any) {
          console.error('Failed to send email:', err);
          showToastError(err.message || 'Failed to send email via Gmail.');
        } finally {
          setIsSending(false);
        }
      },
    });
  };

  const handleTrashMessage = (msg: GmailMessageSummary) => {
    // MANDATORY USER CONFIRMATION DIALOG BEFORE TRASHING
    setConfirmModal({
      isOpen: true,
      title: 'Move Email to Trash?',
      description: `Are you sure you want to move the email "${msg.subject}" to Gmail Trash? This action can be undone in Gmail.`,
      confirmText: 'Move to Trash',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        try {
          await trashGmailMessage(accessToken, msg.id);
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          if (selectedMessage?.id === msg.id) {
            setSelectedMessage(null);
          }
          showToastSuccess('Email moved to trash in Gmail.');
        } catch (err: any) {
          showToastError(err.message || 'Failed to move message to trash.');
        }
      },
    });
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
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#1E293B]">Gmail Financial Inbox Auditor</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                  Live API
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Ingest invoices, audit vendor payment correspondence, and detect wire-redirection fraud directly from Gmail.
              </p>
            </div>
          </div>

          {/* Auth State in Header */}
          {accessToken && profile ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{profile.emailAddress}</span>
              </div>
              <button
                onClick={() => loadProfileAndMessages(accessToken)}
                disabled={loading}
                className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Refresh Inbox"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              </button>
              <button
                onClick={() => handleOpenSendModal()}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose Audit Notice</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Disconnect Gmail"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleConnectGmail}
                disabled={isSigningIn}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 shadow-sm flex items-center gap-2 transition-all cursor-pointer hover:border-purple-400"
              >
                {/* Official Google GSI Icon */}
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting to Gmail...' : 'Connect Gmail Account'}</span>
              </button>
            </div>
          )}
        </div>

        {/* If Not Connected: Call to Action Banner */}
        {!accessToken ? (
          <div className="p-12 text-center max-w-xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 border border-purple-100 shadow-sm">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1E293B] mb-2">
              Connect Your Gmail to Audit Financial Emails
            </h3>
            <p className="text-sm text-[#64748B] mb-8 leading-relaxed">
              Enable real-time detection of payment tampering, wire fraud attempts, and unverified bank account changes with permission from your Google account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8 text-left">
              <div className="p-4 bg-[#F8F9FC] rounded-2xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B] mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Wire Fraud Radar</span>
                </div>
                <p className="text-[11px] text-[#64748B]">Detects sudden bank detail updates and fake CEO wire requests.</p>
              </div>
              <div className="p-4 bg-[#F8F9FC] rounded-2xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B] mb-1">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>1-Click Invoicing</span>
                </div>
                <p className="text-[11px] text-[#64748B]">Instantly import invoice PDFs into the Dr. Aria forensic scanner.</p>
              </div>
              <div className="p-4 bg-[#F8F9FC] rounded-2xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B] mb-1">
                  <Send className="w-4 h-4 text-indigo-600" />
                  <span>Audit Dispatch</span>
                </div>
                <p className="text-[11px] text-[#64748B]">Send verified audit certificates and vendor inquiries directly.</p>
              </div>
            </div>

            <button
              onClick={handleConnectGmail}
              disabled={isSigningIn}
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-purple-600/25 flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Authorize Gmail Access</span>
            </button>
          </div>
        ) : (
          /* Connected Interface: Split View */
          <div>
            {/* Filter and Search Bar */}
            <div className="p-4 bg-[#F8F9FC] border-b border-[#E2E8F0] flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
                <button
                  onClick={() => handleFilterChange('financial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'financial'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>Financial Invoices</span>
                </button>
                <button
                  onClick={() => handleFilterChange('suspicious')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'suspicious'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Suspicious & Wire Flags</span>
                </button>
                <button
                  onClick={() => handleFilterChange('attachments')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'attachments'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>PDF Attachments</span>
                </button>
                <button
                  onClick={() => handleFilterChange('unread')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeFilter === 'unread'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All Inbox
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && accessToken) {
                      loadProfileAndMessages(accessToken, searchQuery);
                    }
                  }}
                  placeholder="Search emails (press Enter)..."
                  className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                />
              </div>
            </div>

            {/* Main Email Browser Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px] divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0]">
              {/* Left Column: Email List (5 cols) */}
              <div className="lg:col-span-5 flex flex-col h-full max-h-[700px] overflow-y-auto bg-slate-50/40">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mb-2" />
                    <span className="text-xs font-bold">Scanning Gmail Inbox...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Inbox className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">No matching emails found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try broadening your search query or filter</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {messages.map((msg) => {
                      const isSelected = selectedMessage?.id === msg.id;
                      const hasRisk = msg.riskFlags && msg.riskFlags.length > 0;

                      return (
                        <div
                          key={msg.id}
                          onClick={() => setSelectedMessage(msg)}
                          className={`p-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-50/80 border-l-4 border-purple-600'
                              : 'hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                              {msg.from}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              {msg.date ? new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 mb-1 truncate">
                            {msg.subject || '(No Subject)'}
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                            {msg.snippet}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {hasRisk && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Flagged Risk
                              </span>
                            )}
                            {msg.hasAttachments && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1 border border-indigo-100">
                                <Paperclip className="w-3 h-3" />
                                {msg.attachments.length} file{msg.attachments.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {msg.isFinancial && !hasRisk && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Financial
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Message Detail & Auditor Tools (7 cols) */}
              <div className="lg:col-span-7 p-6 flex flex-col justify-between h-full max-h-[700px] overflow-y-auto bg-white">
                {selectedMessage ? (
                  <div className="space-y-6">
                    {/* Header & Quick Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                          {selectedMessage.subject || '(No Subject)'}
                        </h3>
                        <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                          <p><strong className="text-slate-700">From:</strong> {selectedMessage.from}</p>
                          <p><strong className="text-slate-700">To:</strong> {selectedMessage.to || profile?.emailAddress}</p>
                          <p><strong className="text-slate-700">Date:</strong> {selectedMessage.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start shrink-0">
                        <button
                          onClick={() => handleAuditSelectedEmail(selectedMessage)}
                          className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Import into Forensic Audit Scanner"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Audit in Dr. Aria</span>
                        </button>
                        <button
                          onClick={() => handleOpenSendModal(selectedMessage)}
                          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                          title="Reply / Send Inquiry"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTrashMessage(selectedMessage)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Fraud & Security Alert Banner */}
                    {selectedMessage.riskFlags && selectedMessage.riskFlags.length > 0 && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-800 mb-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Forensic Fraud & Risk Indicators Detected:</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedMessage.riskFlags.map((flag, idx) => (
                            <li key={idx} className="text-xs font-semibold text-rose-700">
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Attachments Card */}
                    {selectedMessage.hasAttachments && (
                      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                        <div className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-indigo-600" />
                          <span>Attached Invoices & Documents ({selectedMessage.attachments.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedMessage.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-white border border-indigo-200 rounded-xl flex items-center justify-between gap-2 shadow-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="text-xs font-semibold text-slate-800 truncate" title={att.filename}>
                                  {att.filename}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAuditSelectedEmail(selectedMessage)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                Audit File
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Content Body */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Message Body
                      </div>
                      <div className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        {selectedMessage.bodyText || selectedMessage.snippet || 'No message content available.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 my-auto">
                    <Mail className="w-12 h-12 text-slate-200 mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">Select an email to view</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Choose an email from the left pane to view financial details, analyze fraud flags, and run automated audits.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose & Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Compose Audit Message via Gmail</h3>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
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
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="vendor@company.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="Subject..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={6}
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendEmail}
                disabled={isSending}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Review & Send'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Destructive Action Confirmation Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {confirmModal.description}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
