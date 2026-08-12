export interface WhiteLabelConfig {
  enabled: boolean;
  businessName: string;
  logoUrl: string;
  primaryColor: string; // e.g. '#7C3AED' or custom hex
  customDomain: string;
  portalTitle: string;
  watermarkText: string;
  hidePoweredBy: boolean;
}

export const DEFAULT_WHITELABEL_CONFIG: WhiteLabelConfig = {
  enabled: false,
  businessName: 'FORENSICDOCAUDIT',
  logoUrl: '',
  primaryColor: '#7C3AED',
  customDomain: 'audit.yourbusiness.com',
  portalTitle: 'FORENSICDOCAUDIT Portal',
  watermarkText: 'Audited & Verified by Forensic Doc Audit Engine',
  hidePoweredBy: false,
};

export function getWhiteLabelConfig(): WhiteLabelConfig {
  try {
    const saved = localStorage.getItem('forensic_doc_audit_whitelabel');
    if (saved) {
      return { ...DEFAULT_WHITELABEL_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load white label config:', e);
  }
  return DEFAULT_WHITELABEL_CONFIG;
}

export function saveWhiteLabelConfig(config: WhiteLabelConfig): void {
  try {
    localStorage.setItem('forensic_doc_audit_whitelabel', JSON.stringify(config));
    window.dispatchEvent(new Event('whitelabel-updated'));
  } catch (e) {
    console.error('Failed to save white label config:', e);
  }
}
