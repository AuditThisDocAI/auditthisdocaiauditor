import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Palette, 
  Globe, 
  CheckCircle2, 
  X, 
  Crown, 
  Sparkles, 
  Image as ImageIcon, 
  Eye, 
  ShieldCheck, 
  FileText, 
  Sliders,
  Download,
  ExternalLink
} from 'lucide-react';
import { getWhiteLabelConfig, saveWhiteLabelConfig, WhiteLabelConfig } from '../lib/whitelabel';

interface WhiteLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Royal Purple', hex: '#7C3AED' },
  { name: 'Corporate Navy', hex: '#1E3A8A' },
  { name: 'Emerald Trust', hex: '#059669' },
  { name: 'Crimson Advisory', hex: '#DC2626' },
  { name: 'Midnight Charcoal', hex: '#0F172A' },
  { name: 'Golden Vault', hex: '#D97706' },
];

export function WhiteLabelModal({ isOpen, onClose }: WhiteLabelModalProps) {
  const [config, setConfig] = useState<WhiteLabelConfig>(getWhiteLabelConfig());
  const [activeTab, setActiveTab] = useState<'branding' | 'domain' | 'reports'>('branding');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const authed = localStorage.getItem('audit-this-doc-cms-auth') === 'true';
  const email = (localStorage.getItem('audit-this-doc-user-email') || '').toLowerCase().trim();
  const isAdmin = email === 'brigittalombard09@gmail.com';
  const isPro = localStorage.getItem('audit_this_doc_is_pro') === 'true' || isAdmin;
  const isPaidAndSignedUp = authed && isPro;

  useEffect(() => {
    if (isOpen) {
      setConfig(getWhiteLabelConfig());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhiteLabelConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {!isPaidAndSignedUp ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Paid Business Feature
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-3">White Label Settings Locked</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
                White Label settings are not available on the free tier. Custom branding, domain mapping, and branded dispatches are reserved for paid business subscribers after signing up.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
                  }}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Sign Up / Upgrade Now
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Business & Enterprise Feature
              </span>
              <h2 className="text-2xl font-black text-slate-900">White Label Branding Hub</h2>
            </div>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">
            Custom-brand the auditor portal, document certificates, watermarks, and client exports with your firm's identity.
          </p>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-200 gap-6 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
                activeTab === 'branding' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              Brand Identity
              {activeTab === 'branding' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('domain')}
              className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
                activeTab === 'domain' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              Custom Domain & Portal
              {activeTab === 'domain' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
                activeTab === 'reports' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              PDF Reports & Watermarks
              {activeTab === 'reports' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Toggle Enable Switch */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">Enable White Label Mode</span>
                <span className="text-slate-500 text-xs">Apply custom company name, logo, colors, and report watermarks globally.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* TAB 1: Brand Identity */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Company / Firm Name</label>
                    <input
                      type="text"
                      required
                      value={config.businessName}
                      onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                      placeholder="e.g. Apex Advisory & Accounting"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Custom Logo Image URL</label>
                    <input
                      type="url"
                      value={config.logoUrl}
                      onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                      placeholder="https://yourfirm.com/logo.png"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                {/* Primary Accent Color Selector */}
                <div>
                  <label className="block font-bold text-slate-900 mb-2">Primary Brand Theme Color</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setConfig({ ...config, primaryColor: color.hex })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                          config.primaryColor === color.hex 
                            ? 'border-purple-600 ring-2 ring-purple-400/20 bg-slate-900 text-white' 
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-white/40" style={{ backgroundColor: color.hex }} />
                        {color.name}
                      </button>
                    ))}
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-slate-400 font-mono text-[10px]">Custom:</span>
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Header Card Preview */}
                <div className="pt-2">
                  <span className="font-bold text-slate-900 block mb-2 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-purple-600" />
                    Live Header Preview
                  </span>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="h-8 object-contain max-w-[120px]" />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-xl text-white font-black flex items-center justify-center text-sm shadow-xs"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          {(config.businessName || 'F').charAt(0)}
                        </div>
                      )}
                      <span className="font-black text-slate-900 text-base">
                        {config.businessName || 'FORENSICDOCAUDIT'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: config.primaryColor }}>
                        Verified Firm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Domain & Portal */}
            {activeTab === 'domain' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Portal Page Title</label>
                  <input
                    type="text"
                    value={config.portalTitle}
                    onChange={(e) => setConfig({ ...config, portalTitle: e.target.value })}
                    placeholder="e.g. Apex Client Audit & Compliance Hub"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Custom Business Subdomain</label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                    <span className="pl-3.5 text-slate-400 font-mono text-xs">https://</span>
                    <input
                      type="text"
                      value={config.customDomain}
                      onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                      placeholder="audit.apexadvisory.com"
                      className="w-full px-2 py-2.5 bg-transparent font-mono text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    CNAME records point to <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-600">ingress.forensicdocaudit.com</code>
                  </p>
                </div>

                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    White Label Security & SSL Status
                  </span>
                  <p className="text-slate-600 text-xs">
                    Custom domains automatically receive an enterprise wild-card SSL certificate and dedicated client isolation.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Reports & Watermarks */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Report & Export Watermark</label>
                  <input
                    type="text"
                    value={config.watermarkText}
                    onChange={(e) => setConfig({ ...config, watermarkText: e.target.value })}
                    placeholder="e.g. Certified Audit Report • Prepared by Apex Advisory LLC"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Hide "Powered by FORENSICDOCAUDIT"</span>
                    <span className="text-slate-500 text-[11px]">Remove default platform attributions from exported PDFs, CSVs, and client seals.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.hidePoweredBy}
                    onChange={(e) => setConfig({ ...config, hidePoweredBy: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                {/* Report Certificate Preview */}
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      {config.businessName || 'FORENSICDOCAUDIT'} Forensic Certificate
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: CERT-2026-904</span>
                  </div>
                  <div className="text-slate-600 text-xs leading-relaxed">
                    This document has been audited and certified under full compliance standards.
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-100 flex items-center justify-between">
                    <span>{config.watermarkText}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {savedSuccess ? '✅ Settings saved successfully!' : 'Changes apply immediately across all modules.'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Save White Label Settings
                </button>
              </div>
            </div>
          </form>
          </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
