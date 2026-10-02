import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Camera, 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Flame, 
  ArrowRight, 
  Lock, 
  RotateCcw, 
  CheckCircle2, 
  Eye, 
  Download, 
  Minimize2,
  Maximize2,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { isUserPro } from '../lib/authUtils';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aria';
  text: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: string;
  documentFile?: {
    name: string;
    size?: string;
    type?: string;
    previewUrl?: string;
  };
  auditResult?: {
    documentName: string;
    documentType: string;
    riskScore: number;
    riskLevel: string;
    summary: string;
    keyMetrics?: {
      detectedVendor?: string;
      detectedAmount?: string;
      detectedDate?: string;
      missingFields?: string[];
    };
    findings: Array<{
      category?: string;
      title: string;
      description: string;
      severity: string;
      recommendation?: string;
    }>;
  };
}

const FREE_ARIA_CHAT_LIMIT = 5;

export function DrAriaChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);
  const [isPro, setIsPro] = useState(isUserPro());
  
  // Track chat count in localStorage
  const [chatCount, setChatCount] = useState<number>(() => {
    const saved = localStorage.getItem('audit_dr_aria_chat_count');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-oss-120b');
  const [selectedRole, setSelectedRole] = useState<string>('dr-aria');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAuditingDoc, setIsAuditingDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Active AI Engine status
  const [aiStatus, setAiStatus] = useState<{
    connected: boolean;
    providerName: string;
    defaultModel: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => {
        setAiStatus(data);
        if (data.defaultModel) {
          setSelectedModel(data.defaultModel);
        }
      })
      .catch(e => console.warn('Could not load AI status', e));
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initial welcome message from Dr. Aria
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('audit_dr_aria_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved chat messages', e);
      }
    }
    return [
      {
        id: 'welcome-1',
        sender: 'aria',
        text: "Hello! I am Dr. Aria, your Senior AI Forensic Examiner. You can ask me any compliance or fraud questions, or attach an invoice, payslip, or prescription right here for an instant forensic audit scan.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Sync pro status and open-dr-aria-chat event
  useEffect(() => {
    const updatePro = () => setIsPro(isUserPro());
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      setIsMinimized(false);
      if (customEvent.detail && customEvent.detail.prompt) {
        setInputMessage(customEvent.detail.prompt);
      }
    };

    window.addEventListener('pro-status-changed', updatePro);
    window.addEventListener('storage', updatePro);
    window.addEventListener('open-dr-aria-chat', handleOpenChat);
    return () => {
      window.removeEventListener('pro-status-changed', updatePro);
      window.removeEventListener('storage', updatePro);
      window.removeEventListener('open-dr-aria-chat', handleOpenChat);
    };
  }, []);

  // Save messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('audit_dr_aria_messages', JSON.stringify(messages));
    } catch (e) {
      // Storage quota safety
    }
  }, [messages]);

  // Save chat count
  useEffect(() => {
    localStorage.setItem('audit_dr_aria_chat_count', chatCount.toString());
  }, [chatCount]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isAuditingDoc, isOpen, isMinimized]);

  // Dismiss tooltip after 10s or when opened
  useEffect(() => {
    if (isOpen) {
      setShowWelcomeTooltip(false);
    } else {
      const timer = setTimeout(() => setShowWelcomeTooltip(false), 12000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const remainingChats = Math.max(0, FREE_ARIA_CHAT_LIMIT - chatCount);
  const isLimitReached = !isPro && chatCount >= FREE_ARIA_CHAT_LIMIT;

  // Open Payment Portal (Freemius Checkout)
  const openPaymentPortal = () => {
    window.dispatchEvent(
      new CustomEvent('open-freemius-checkout', {
        detail: { plan: 'pro_monthly', interval: 'monthly' }
      })
    );
  };

  // Camera stream management
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error', err);
      setMessages(prev => [
        ...prev,
        {
          id: `aria-cam-err-${Date.now()}`,
          sender: 'aria',
          text: 'Camera access is currently unavailable. Please verify browser permissions, or upload your document directly using the attachment button.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            const capturedFile = new File([blob], `camera-doc-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(capturedFile);
            setFilePreviewUrl(URL.createObjectURL(capturedFile));
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  // Send message and/or scan document
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend && !selectedFile) return;

    // Check unpaid limit
    if (!isPro && chatCount >= FREE_ARIA_CHAT_LIMIT) {
      // Append blocked notification
      const limitMsg: ChatMessage = {
        id: `limit-${Date.now()}`,
        sender: 'aria',
        text: "🔒 You have reached your limit of 5 complimentary consultations with Dr. Aria. Please upgrade to Pro to continue unlimited conversations, deep forensic document audits, and certified compliance reports.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, limitMsg]);
      // Open payment portal immediately
      openPaymentPortal();
      return;
    }

    const currentFile = selectedFile;
    const currentPreview = filePreviewUrl;
    clearFileSelection();
    setInputMessage('');

    // Increment chat count
    const nextCount = chatCount + 1;
    setChatCount(nextCount);

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend || (currentFile ? `Please examine this document: ${currentFile.name}` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      documentFile: currentFile ? {
        name: currentFile.name,
        size: `${(currentFile.size / 1024).toFixed(0)} KB`,
        type: currentFile.type,
        previewUrl: currentPreview || undefined
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);

    // IF A DOCUMENT WAS ATTACHED: Run audit scanner
    if (currentFile) {
      setIsAuditingDoc(true);
      try {
        let base64Data = '';
        let mimeType = currentFile.type;

        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(currentFile);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.onerror = err => reject(err);
        });

        const auditResponse = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentText: textToSend,
            documentName: currentFile.name,
            fileData: { base64: base64Data, mimeType }
          })
        });

        let auditResult: any = null;
        if (auditResponse.ok) {
          auditResult = await auditResponse.json();
        }

        // Ask Dr. Aria to give a natural summary of the audit
        let ariaSummaryText = `I have finished the forensic examination of **${currentFile.name}**.`;
        if (auditResult) {
          ariaSummaryText += ` Detected **${auditResult.documentType || 'Document'}** with a **${auditResult.riskLevel} Risk Score of ${auditResult.riskScore}/100**. ${auditResult.summary || ''}`;
        }

        const ariaAuditMsg: ChatMessage = {
          id: `aria-${Date.now()}`,
          sender: 'aria',
          text: ariaSummaryText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          auditResult: auditResult ? {
            documentName: currentFile.name,
            documentType: auditResult.documentType || 'Document',
            riskScore: auditResult.riskScore || 0,
            riskLevel: auditResult.riskLevel || 'Low',
            summary: auditResult.summary || 'Forensic analysis completed.',
            keyMetrics: auditResult.keyMetrics,
            findings: auditResult.findings || []
          } : undefined
        };

        setMessages(prev => [...prev, ariaAuditMsg]);

        // Check if this was the 5th message for unpaid user
        if (!isPro && nextCount >= FREE_ARIA_CHAT_LIMIT) {
          setTimeout(() => {
            const finalNotice: ChatMessage = {
              id: `notice-${Date.now()}`,
              sender: 'aria',
              text: "⚠️ Note: You have used your 5th and final complimentary consultation. Further messages will require upgrading to Pro. Opening the payment portal now...",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, finalNotice]);
            openPaymentPortal();
          }, 1500);
        }

      } catch (err) {
        console.error('Audit in chat error', err);
        const errorMsg: ChatMessage = {
          id: `aria-err-${Date.now()}`,
          sender: 'aria',
          text: `I encountered an issue processing ${currentFile.name}. Please ensure the file is an image or PDF under 10MB, or try uploading in the main Audit Scanner.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsAuditingDoc(false);
      }
      return;
    }

    // REGULAR CONVERSATION: Call /api/chat
    setIsTyping(true);
    try {
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          model: selectedModel,
          role: selectedRole
        })
      });

      let replyText = "";
      let modelUsed = selectedModel;
      let roleUsed = selectedRole;

      if (res.ok) {
        const data = await res.json();
        if (data && data.text) replyText = data.text;
        if (data && data.model) modelUsed = data.model;
        if (data && data.role) roleUsed = data.role;
      } else {
        const errorData = await res.json().catch(() => ({}));
        replyText = errorData.text || errorData.error || "Dr. Aria AI was unable to generate a response. Please check your connection and try again.";
      }

      if (!replyText) {
        replyText = "Dr. Aria AI was unable to generate a response. Please try again in a moment.";
      }

      const ariaMsg: ChatMessage = {
        id: `aria-${Date.now()}`,
        sender: 'aria',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed,
        roleUsed
      };

      setMessages(prev => [...prev, ariaMsg]);

      // If user just reached 5
      if (!isPro && nextCount >= FREE_ARIA_CHAT_LIMIT) {
        setTimeout(() => {
          const finalNotice: ChatMessage = {
            id: `notice-${Date.now()}`,
            sender: 'aria',
            text: "⚠️ Note: You have reached your 5 complimentary consultations with Dr. Aria. Further forensic questions and scans require a Pro subscription. Opening the payment portal now...",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, finalNotice]);
          openPaymentPortal();
        }, 1200);
      }

    } catch (err) {
      console.error('Chat error', err);
      const errorMsg: ChatMessage = {
        id: `aria-err-${Date.now()}`,
        sender: 'aria',
        text: "Dr. Aria AI connection error. Please verify network connectivity or check that your Gemini API key is configured.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    if (confirm('Clear conversation history with Dr. Aria?')) {
      const initial: ChatMessage[] = [
        {
          id: 'welcome-reset',
          sender: 'aria',
          text: "Conversation cleared. Hello! I am Dr. Aria, your Senior AI Forensic Examiner. How can I assist with your document auditing and compliance verification today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      localStorage.setItem('audit_dr_aria_messages', JSON.stringify(initial));
    }
  };

  const handleExportChat = () => {
    const transcript = messages.map(m => {
      const roleLabel = m.sender === 'user' ? 'YOU' : 'DR. ARIA (Lead AI Forensic Auditor)';
      return `[${m.timestamp}] ${roleLabel}:\n${m.text}\n\n----------------------------------------\n`;
    }).join('\n');

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dr_Aria_Forensic_Consultation_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-500 text-white border-red-600';
      case 'high': return 'bg-orange-500 text-white border-orange-600';
      case 'moderate': return 'bg-amber-500 text-white border-amber-600';
      default: return 'bg-emerald-500 text-white border-emerald-600';
    }
  };

  return (
    <>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera Capture Modal */}
      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden max-w-lg w-full p-4 relative"
            >
              <div className="flex items-center justify-between pb-3 text-white">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-400" />
                  <h4 className="font-bold text-sm">Snap Document for Dr. Aria</h4>
                </div>
                <button
                  onClick={stopCamera}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Capture & Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Chat Icon Launcher */}
      <div className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8 flex flex-col items-end">
        {/* Welcome Tooltip Popup */}
        <AnimatePresence>
          {!isOpen && showWelcomeTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="mb-3 bg-white text-[#1E293B] border border-[#E2E8F0] shadow-xl rounded-2xl p-3 pr-8 max-w-[260px] text-xs relative"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWelcomeTooltip(false);
                }}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-[#7C3AED]">Dr. Aria is Online</span>
              </div>
              <p className="text-slate-600 leading-tight">
                Ask forensic questions or <strong>scan documents in chat</strong> for instant fraud detection!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Launcher Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpen(!isOpen);
            setIsMinimized(false);
          }}
          className={`relative group rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer ${
            isOpen 
              ? 'w-14 h-14 bg-[#1E293B] text-white border-2 border-slate-700' 
              : 'w-16 h-16 bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] text-white shadow-purple-600/40 ring-4 ring-purple-100'
          }`}
          aria-label="Open Dr. Aria AI Chat"
          id="dr-aria-chat-launcher"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-8 h-8" />
              {/* Online Pulse Dot */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
              </span>
            </div>
          )}

          {/* Dr Aria Badge */}
          {!isOpen && (
            <span className="absolute -top-2 -left-2 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-400 shadow-xs">
              Dr. Aria
            </span>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-24 right-4 sm:right-8 z-50 bg-white border border-[#E2E8F0] shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-all ${
              isMinimized 
                ? 'w-80 h-16' 
                : 'w-[calc(100vw-2rem)] sm:w-[440px] h-[580px] sm:h-[640px] max-h-[85vh]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag & Drop Visual Overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 z-30 bg-purple-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center border-4 border-dashed border-purple-400 m-2 rounded-2xl animate-pulse">
                <Paperclip className="w-12 h-12 text-purple-200 mb-3 animate-bounce" />
                <h4 className="text-lg font-black">Drop Document for Dr. Aria</h4>
                <p className="text-xs text-purple-200 mt-1 max-w-xs">
                  Release PDF, PNG, or JPG here to run instant forensic scan and fraud risk analysis.
                </p>
              </div>
            )}

            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center text-white font-black shadow-md border border-purple-400/40">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1E293B] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-white">Dr. Aria</h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-[11px] text-slate-300">Senior AI Forensic Auditor</p>
                </div>
              </div>

              {/* Usage & Window Controls */}
              <div className="flex items-center gap-2">
                {/* Plan Badge */}
                {isPro ? (
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Pro
                  </span>
                ) : (
                  <button
                    onClick={openPaymentPortal}
                    className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1"
                    title="Click to upgrade to Pro"
                  >
                    <span>{remainingChats}/5 Free</span>
                    <Lock className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* Download Transcript */}
                <button
                  onClick={handleExportChat}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Download consultation transcript"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Reset Chat */}
                <button
                  onClick={handleResetChat}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Expand to Full Page Gemini Chat View */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'chat' } }));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-1.5 text-purple-400 hover:text-white rounded-lg hover:bg-purple-950/60 transition-colors"
                  title="Open Full Page Gemini Workspace"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* Minimize */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                {/* Compact Gemini Model & Role Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300 shrink-0 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model:</span>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-slate-800 text-purple-300 font-semibold rounded px-1.5 py-0.5 text-[11px] border border-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value="openai/gpt-oss-120b">Groq 120B (Ultra-Fast Active)</option>
                      <option value="openai/gpt-oss-20b">Groq 20B (Instant Triage)</option>
                      <option value="qwen/qwen3.8-27b">Groq Qwen 27B (Math & Logic)</option>
                      <option value="grok-2-latest">xAI Grok 2 (Complex)</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Instant Vision)</option>
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash (Default)</option>
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (General)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="bg-slate-800 text-emerald-300 font-semibold rounded px-1.5 py-0.5 text-[11px] border border-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value="dr-aria">Dr. Aria (Forensic)</option>
                      <option value="complex">Complex Reasoning</option>
                      <option value="general">General Audit</option>
                      <option value="fast">Rapid Triage</option>
                    </select>
                  </div>
                </div>

                {/* Free Limit Warning Banner if Reached */}
                {isLimitReached && (
                  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-semibold">Free chat limit reached (5/5).</span>
                    </div>
                    <button
                      onClick={openPaymentPortal}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                )}

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FC]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[85%]">
                        {msg.sender === 'aria' && (
                          <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shrink-0 mb-1 shadow-xs">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-[#7C3AED] text-white rounded-br-none shadow-md shadow-purple-500/10'
                              : 'bg-white text-[#1E293B] border border-[#E2E8F0] rounded-bl-none shadow-xs'
                          }`}
                        >
                          {/* Attached Document in User Message */}
                          {msg.documentFile && (
                            <div className="mb-2 p-2 bg-white/10 rounded-xl border border-white/20 flex items-center gap-2">
                              {msg.documentFile.previewUrl ? (
                                <img
                                  src={msg.documentFile.previewUrl}
                                  alt="Preview"
                                  className="w-10 h-10 object-cover rounded-lg border border-white/30"
                                />
                              ) : (
                                <FileText className="w-8 h-8 text-white/80" />
                              )}
                              <div className="overflow-hidden">
                                <p className="font-bold text-xs truncate max-w-[180px]">{msg.documentFile.name}</p>
                                <p className="text-[10px] text-purple-200">{msg.documentFile.size}</p>
                              </div>
                            </div>
                          )}

                          {/* Message Text */}
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          {/* In-Chat Forensic Report Card */}
                          {msg.auditResult && (
                            <div className="mt-3 p-3 rounded-xl bg-[#F8F9FC] border border-[#E2E8F0] space-y-2.5 text-[#1E293B]">
                              <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                                <span className="font-extrabold text-xs text-[#7C3AED] flex items-center gap-1">
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  {msg.auditResult.documentType} Audit
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getRiskBadgeColor(msg.auditResult.riskLevel)}`}>
                                  {msg.auditResult.riskLevel} ({msg.auditResult.riskScore}/100)
                                </span>
                              </div>

                              {/* Key Metrics */}
                              {msg.auditResult.keyMetrics && (
                                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                                  <div>
                                    <span className="text-slate-500">Vendor:</span>
                                    <p className="font-bold truncate">{msg.auditResult.keyMetrics.detectedVendor || 'Verified'}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Amount:</span>
                                    <p className="font-bold text-emerald-600">{msg.auditResult.keyMetrics.detectedAmount || 'N/A'}</p>
                                  </div>
                                </div>
                              )}

                              {/* Top Findings */}
                              {msg.auditResult.findings && msg.auditResult.findings.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Red Flag Findings ({msg.auditResult.findings.length})
                                  </span>
                                  {msg.auditResult.findings.slice(0, 3).map((finding, idx) => (
                                    <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 text-xs">
                                      <div className="flex items-center justify-between font-bold text-[11px] text-slate-800">
                                        <span className="flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                                          {finding.title}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                          {finding.severity}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 mt-0.5">{finding.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* In-Chat Action Buttons */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'dashboard' } }));
                                    setIsOpen(false);
                                  }}
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1.5 rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Flame className="w-3.5 h-3.5 text-red-500" />
                                  Visual Heatmap
                                </button>
                                <button
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'audittrail' } }));
                                    setIsOpen(false);
                                  }}
                                  className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1.5 rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                                  Audit Trail
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {/* Typing & Auditing Indicators */}
                  {isAuditingDoc && (
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-2xl rounded-bl-none text-xs text-slate-600 space-y-2 max-w-xs shadow-xs">
                        <div className="flex items-center gap-2 font-bold text-[#7C3AED]">
                          <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
                          Dr. Aria is auditing document...
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Extracting OCR text, calculating discrepancy matrix, and testing tax credentials.
                        </p>
                      </div>
                    </div>
                  )}

                  {isTyping && !isAuditingDoc && (
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-[#E2E8F0] px-4 py-3 rounded-2xl rounded-bl-none text-xs text-slate-500 flex items-center gap-1.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-150" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce delay-300" />
                        <span className="text-[11px] font-medium ml-1">Dr. Aria is typing...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Carousel */}
                {messages.length < 4 && !isLimitReached && (
                  <div className="p-2.5 bg-white border-t border-[#E2E8F0] flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
                    <button
                      onClick={() => handleSendMessage("How do I check if an invoice is forged or tampered?")}
                      className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] hover:bg-purple-100 rounded-full font-semibold border border-purple-100 whitespace-nowrap transition-colors"
                    >
                      🔍 Forgery Signs
                    </button>
                    <button
                      onClick={() => handleSendMessage("What are the key audit requirements for payslips?")}
                      className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] hover:bg-purple-100 rounded-full font-semibold border border-purple-100 whitespace-nowrap transition-colors"
                    >
                      📄 Payslip Audit
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] hover:bg-purple-100 rounded-full font-semibold border border-purple-100 whitespace-nowrap transition-colors"
                    >
                      📎 Upload Document
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-[#E2E8F0] shrink-0">
                  {/* Selected File Preview Chip */}
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        {filePreviewUrl ? (
                          <img src={filePreviewUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-purple-200" />
                        ) : (
                          <FileText className="w-6 h-6 text-purple-600" />
                        )}
                        <div className="truncate">
                          <p className="font-bold text-[#1E293B] truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-[10px] text-[#64748B]">Ready for Dr. Aria to scan</p>
                        </div>
                      </div>
                      <button
                        onClick={clearFileSelection}
                        className="p-1 hover:bg-purple-200/50 rounded-lg text-slate-500 hover:text-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Text Input Row */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition-colors shrink-0"
                      title="Attach document for audit (PDF, PNG, JPG)"
                      disabled={isLimitReached}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="p-2 text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition-colors shrink-0"
                      title="Snap photo with camera"
                      disabled={isLimitReached}
                    >
                      <Camera className="w-5 h-5" />
                    </button>

                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        isLimitReached 
                          ? "Free limit reached (5/5). Upgrade to continue." 
                          : selectedFile 
                            ? "Add audit notes or click send..." 
                            : "Ask Dr. Aria or attach document..."
                      }
                      disabled={isLimitReached || isAuditingDoc}
                      className="flex-1 bg-[#F8F9FC] border border-[#E2E8F0] focus:border-[#7C3AED] focus:bg-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none text-[#1E293B] placeholder:text-slate-400 disabled:opacity-60 transition-all"
                    />

                    {isLimitReached ? (
                      <button
                        onClick={openPaymentPortal}
                        className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white p-2.5 rounded-xl font-bold transition-all shadow-md shadow-purple-500/20 shrink-0"
                        title="Upgrade to Pro"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={(!inputMessage.trim() && !selectedFile) || isTyping || isAuditingDoc}
                        className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white p-2.5 rounded-xl font-bold transition-all shadow-md shadow-purple-500/20 shrink-0 cursor-pointer"
                        title="Send to Dr. Aria"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Footer micro-legend */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span>Drop files anytime into chat</span>
                    {isPro ? (
                      <span className="text-[#7C3AED] font-bold">PRO Active • Unlimited Chats</span>
                    ) : (
                      <span>{remainingChats} of {FREE_ARIA_CHAT_LIMIT} free chats remaining</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default DrAriaChatPopup;
