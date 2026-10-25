import React, { useState, useEffect } from 'react';
import { ShieldCheck, Scale, X, ExternalLink } from 'lucide-react';

export function PopiaConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('popia_consent_accepted');
    if (!accepted) {
      // Small timeout for smooth entrance
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('popia_consent_accepted', 'true');
    localStorage.setItem('popia_consent_timestamp', new Date().toISOString());
    setIsOpen(false);
  };

  const openTab = (tab: 'popia' | 'lssa') => {
    window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab } }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🇿🇦</span>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-wider uppercase border border-emerald-500/30">
                POPIA Act 4/2013
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-black tracking-wider uppercase border border-indigo-500/30">
                LSSA Standards
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
          <strong>FORENSIC DOC AUDIT</strong> processes accounting documents under strict compliance with South Africa's{' '}
          <strong className="text-white">POPIA Act No. 4 of 2013 (§21 Operator mandate)</strong> and{' '}
          <strong className="text-white">Law Society of South Africa (LSSA) Cloud Computing Standards</strong>. All forensic OCR
          extractions are ephemeral with zero persistent AI training, in-transit AES-256 encryption, and optional Legal Professional Privilege (LPP) preservation.
        </p>

        <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => openTab('popia')}
              className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>POPIA / PAIA Manual</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => openTab('lssa')}
              className="text-indigo-300 hover:text-indigo-200 underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>LSSA Practice Standards</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleAccept}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
          >
            Acknowledge &amp; Accept
          </button>
        </div>
      </div>
    </div>
  );
}
