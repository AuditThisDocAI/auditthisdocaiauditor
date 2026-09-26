import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Camera, 
  Trash2, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Check, 
  Copy, 
  ChevronDown, 
  Zap, 
  Scale, 
  Cpu, 
  BookOpen, 
  RefreshCw,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { isUserPro } from '../lib/authUtils';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: string;
  attachment?: {
    name: string;
    type: string;
    size?: string;
    previewUrl?: string;
  };
}

export const GEMINI_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Recommended Default',
    desc: 'Balanced high-speed & deep forensic vision analysis.',
    speed: 'Ultra Fast',
    tier: 'Standard'
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'General Tasks',
    desc: 'Optimal for everyday invoice review, audit prep, and compliance checks.',
    speed: 'Fast',
    tier: 'General'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Instant Speed',
    desc: 'For tasks that must happen fast: rapid math, routing checks, and quick triage.',
    speed: 'Instant',
    tier: 'Fast'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    tag: 'Complex Reasoning',
    desc: 'For particularly complex tasks: cross-examining multi-clause contracts and intricate fraud.',
    speed: 'Deep Reasoning',
    tier: 'Complex'
  }
];

export const CHATBOT_ROLES = [
  {
    id: 'dr-aria',
    name: 'Dr. Aria (Chief Forensic Auditor)',
    icon: ShieldCheck,
    color: 'from-purple-600 to-indigo-600',
    desc: 'Micro-typography, font kerning, baseline shifts, metadata tampering, and court-grade reporting.'
  },
  {
    id: 'complex',
    name: 'Complex Legal & Logic Investigator',
    icon: Scale,
    color: 'from-blue-600 to-cyan-600',
    desc: 'Deep multi-clause contract analysis, conflicting terms, indemnity loopholes, and chain of custody.'
  },
  {
    id: 'general',
    name: 'General Compliance Advisor',
    icon: BookOpen,
    color: 'from-emerald-600 to-teal-600',
    desc: 'Day-to-day invoice verification, bookkeeping reconciliation, SOX, and standard audit checklists.'
  },
  {
    id: 'fast',
    name: 'Rapid Fraud Triage Agent',
    icon: Zap,
    color: 'from-amber-600 to-orange-600',
    desc: 'Lightning-fast sanity checks: arithmetic recalculated, tax ID formatting, and routing anomalies.'
  }
];

const SAMPLE_PROMPTS = [
  {
    role: 'dr-aria',
    model: 'gemini-3.8-flash',
    label: 'Detect Invoice Typography Anomalies',
    prompt: 'How do I detect altered totals on an invoice using font kerning, baseline shifts, and raster layer anomalies?'
  },
  {
    role: 'fast',
    model: 'gemini-3.1-flash-lite',
    label: 'Rapid Arithmetic & Math Check',
    prompt: 'What are the top 3 high-speed sanity checks to immediately spot an inflated vendor invoice total?'
  },
  {
    role: 'general',
    model: 'gemini-3.5-flash',
    label: 'Statutory VAT & Tax ID Verification',
    prompt: 'Explain the mandatory statutory tax details required on commercial invoices under EU VIES, UK HMRC, and US IRS W-9.'
  },
  {
    role: 'complex',
    model: 'gemini-3.1-pro-preview',
    label: 'Deep Multi-Party Contract Review',
    prompt: 'What forensic audit protocol should be followed when two versions of a commercial contract have conflicting indemnity and liability clauses?'
  }
];

export function GeminiChatView() {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<string>('dr-aria');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // File attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Multi-turn conversation messages
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    const saved = localStorage.getItem('audit_gemini_full_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse full chat messages', e);
      }
    }
    return [
      {
        id: 'init-1',
        sender: 'model',
        text: `### Welcome to the Gemini AI Forensic Chat Workspace\n\nI am your multi-turn Gemini-powered forensic document intelligence assistant. You can engage in comprehensive, back-and-forth auditing discussions, ask targeted compliance questions, or upload documents and invoices for instant anomaly analysis.\n\n* **Current Active Model:** \`gemini-3.8-flash\` (Default for balanced forensic depth)\n* **Role Persona:** Dr. Aria (Chief Forensic Auditor)\n\nSelect any specialized model or role from the top toolbar, or select a prompt below to begin your audit session.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
        roleUsed: 'dr-aria'
      }
    ];
  });

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem('audit_gemini_full_chat_messages', JSON.stringify(messages));
    } catch (e) {
      // safe quota catch
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setAttachedPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setAttachedPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Camera handling
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
      console.warn('Camera access unavailable', err);
      setShowCamera(false);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'model',
          text: 'Camera permissions are restricted in your browser. Please attach an image or PDF file using the attachment button.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera_doc_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setAttachedFile(file);
          setAttachedPreview(dataUrl);
          stopCamera();
        });
    }
  };

  // Send message
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride !== undefined ? textOverride : inputMessage).trim();
    if (!textToSend && !attachedFile) return;

    let fileDataPayload: { base64: string; mimeType: string; fileName: string } | undefined = undefined;

    if (attachedFile) {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(',');
            resolve(commaIndex !== -1 ? result.slice(commaIndex + 1) : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(attachedFile);
        });
        fileDataPayload = {
          base64: base64Data,
          mimeType: attachedFile.type || 'application/pdf',
          fileName: attachedFile.name
        };
      } catch (e) {
        console.error('Error reading attached file', e);
      }
    }

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend || `Please forensically review the attached document: ${attachedFile?.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        size: `${(attachedFile.size / 1024).toFixed(1)} KB`,
        previewUrl: attachedPreview || undefined
      } : undefined
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    removeAttachment();
    setIsLoading(true);

    try {
      // Build conversation history strictly alternating user/model
      const conversationHistory = newMessages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: conversationHistory,
          model: selectedModel,
          role: selectedRole,
          fileData: fileDataPayload
        })
      });

      let replyText = "";
      let modelUsed = selectedModel;
      let roleUsed = selectedRole;

      if (res.ok) {
        const data = await res.json();
        replyText = data.text || "";
        if (data.model) modelUsed = data.model;
        if (data.role) roleUsed = data.role;
      } else {
        const err = await res.json().catch(() => ({}));
        replyText = err.text || err.error || "Gemini was unable to respond. Please check your network and try again.";
      }

      if (!replyText) {
        replyText = "Gemini completed the inference cycle without output. Please rephrase or try another model.";
      }

      const modelMsg: ChatMessageItem = {
        id: `model-${Date.now()}`,
        sender: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed,
        roleUsed
      };

      setMessages(prev => [...prev, modelMsg]);

    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'model',
          text: `An error occurred while communicating with Gemini: ${err?.message || 'Network connection failed'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear all conversation history?')) {
      const initialMessage: ChatMessageItem = {
        id: `init-${Date.now()}`,
        sender: 'model',
        text: `Conversation cleared. Ready for a new multi-turn forensic investigation using **${selectedModel}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleUsed: selectedRole
      };
      setMessages([initialMessage]);
      localStorage.removeItem('audit_gemini_full_chat_messages');
    }
  };

  const handleExportChat = () => {
    const transcript = messages.map(m => {
      const roleLabel = m.sender === 'user' ? 'YOU' : `GEMINI (${m.modelUsed || selectedModel} - ${m.roleUsed || selectedRole})`;
      return `[${m.timestamp}] ${roleLabel}:\n${m.text}\n\n----------------------------------------\n`;
    }).join('\n');

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gemini_Forensic_Chat_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentRoleObj = CHATBOT_ROLES.find(r => r.id === selectedRole) || CHATBOT_ROLES[0];
  const currentModelObj = GEMINI_MODELS.find(m => m.id === selectedModel) || GEMINI_MODELS[0];

  return (
    <div className="max-w-7xl mx-auto py-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden max-w-lg w-full p-4 relative text-white">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-sm">Snap Document for Gemini Audit</h4>
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
                onClick={captureCameraPhoto}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Capture Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[640px]">
        
        {/* Top Control Bar: Title, Model Selector & Role Selector */}
        <div className="bg-[#0F172A] text-white px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          {/* Header & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg tracking-tight text-white">Gemini Multi-Turn Forensic Chat</h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Maintains multi-turn context across audits, invoices, and statutory compliance checks
              </p>
            </div>
          </div>

          {/* Model & Role Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Model Selector Dropdown */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 gap-2">
              <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Gemini Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
                >
                  {GEMINI_MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.name} ({m.tag})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chatbot Role Selector */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 gap-2">
              <currentRoleObj.icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Chatbot Role</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
                >
                  {CHATBOT_ROLES.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions: Export Transcript & Clear History */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleExportChat}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Download chat transcript"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearHistory}
                className="p-2 text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Informative Sub-banner describing active model and role configuration */}
        <div className="bg-slate-50 border-b border-[#E2E8F0] px-6 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Active Persona:</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px]">
              {currentRoleObj.name}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600">{currentRoleObj.desc}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span>Model:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800 font-bold">
              {currentModelObj.id}
            </span>
            <span className="text-emerald-600 font-bold">({currentModelObj.speed})</span>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FC]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Header Label: sender name & timestamp */}
              <div className="flex items-center gap-2 mb-1.5 px-1">
                {msg.sender === 'user' ? (
                  <span className="text-xs font-bold text-slate-700">You</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#7C3AED] flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-[#7C3AED]" />
                      Gemini ({msg.roleUsed || selectedRole})
                    </span>
                    {msg.modelUsed && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 border border-purple-200">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm relative group ${
                  msg.sender === 'user'
                    ? 'bg-[#1E293B] text-white rounded-tr-xs'
                    : 'bg-white text-[#1E293B] border border-[#E2E8F0] rounded-tl-xs shadow-md shadow-slate-100'
                }`}
              >
                {/* Attached File Preview inside bubble */}
                {msg.attachment && (
                  <div className="mb-3 p-2.5 rounded-xl bg-black/10 border border-white/10 flex items-center gap-3">
                    {msg.attachment.previewUrl ? (
                      <img
                        src={msg.attachment.previewUrl}
                        alt="attachment preview"
                        className="w-12 h-12 rounded-lg object-cover border border-white/20 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="overflow-hidden text-xs">
                      <p className="font-bold truncate text-slate-200">{msg.attachment.name}</p>
                      <p className="text-[10px] text-slate-400">{msg.attachment.size || msg.attachment.type}</p>
                    </div>
                  </div>
                )}

                {/* Formatted Message Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans break-words selection:bg-purple-200 selection:text-purple-900">
                  {msg.text}
                </div>

                {/* Bubble action toolbar (copy message) */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                  className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                    msg.sender === 'user'
                      ? 'text-slate-400 hover:text-white bg-slate-800'
                      : 'text-slate-400 hover:text-slate-800 bg-slate-100'
                  }`}
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Typing / Inference Indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-extrabold text-[#7C3AED] flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-[#7C3AED] animate-spin" />
                  Gemini ({selectedModel})
                </span>
                <span className="text-[11px] text-slate-400">Analyzing...</span>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-xs p-4 shadow-sm flex items-center gap-2 text-slate-500 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-600 ml-1">
                  Evaluating multi-turn forensic context & document signals...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions Pills */}
        <div className="bg-white px-6 py-2 border-t border-[#E2E8F0] overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            Audit Prompts:
          </span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedRole(sample.role);
                setSelectedModel(sample.model);
                handleSendMessage(sample.prompt);
              }}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 transition-colors shrink-0 border border-slate-200 hover:border-purple-300 cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* File Attachment Staging Bar (if file selected) */}
        {attachedFile && (
          <div className="bg-purple-50 border-t border-purple-200 px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {attachedPreview ? (
                <img src={attachedPreview} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-purple-300" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-purple-200 text-purple-800 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="text-xs">
                <p className="font-bold text-purple-950 truncate max-w-sm">{attachedFile.name}</p>
                <p className="text-[10px] text-purple-700">Ready for forensic attachment with your prompt</p>
              </div>
            </div>
            <button
              onClick={removeAttachment}
              className="p-1 rounded-full text-purple-700 hover:text-purple-950 hover:bg-purple-200"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white p-4 border-t border-[#E2E8F0] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-5xl mx-auto"
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer border border-slate-200 hover:border-purple-300"
              title="Attach document or image for audit"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Camera Button */}
            <button
              type="button"
              onClick={startCamera}
              className="p-2.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer border border-slate-200 hover:border-purple-300"
              title="Capture photo from camera"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ${currentRoleObj.name} anything about document auditing, fraud, or tax rules...`}
                className="w-full bg-[#F8F9FC] border border-[#E2E8F0] focus:border-[#7C3AED] focus:bg-white rounded-xl px-4 py-3 text-sm text-[#1E293B] focus:outline-hidden transition-all pr-10"
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputMessage.trim() && !attachedFile)}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-purple-500/20 cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 max-w-5xl mx-auto px-1">
            <span>Powered by official Google Gemini SDK ({selectedModel})</span>
            <span>Multi-turn memory active &bull; Press Enter to send</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GeminiChatView;
