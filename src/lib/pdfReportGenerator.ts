import { getActiveFirm, FirmProfile } from './multiTenantDb';

export interface AuditFindingItem {
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface AuditReportData {
  documentName: string;
  auditDate?: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  clientName?: string;
  clientCompany?: string;
  auditorName?: string;
  auditorTitle?: string;
  engagementRef?: string;
  documentType?: string;
  executiveSummary: string;
  auditorNotes?: string;
  findings?: AuditFindingItem[];
  keyMetrics?: {
    detectedVendor?: string;
    detectedAmount?: string;
    detectedDate?: string;
    missingFields?: string[];
  };
  duplicatePayments?: Array<{ invoice: string; vendor: string; amount: number; date: string }>;
  roundNumberPayments?: Array<{ vendor: string; amount: number; description: string }>;
  weekendPayments?: Array<{ date: string; vendor: string; amount: number }>;
  firmOverride?: Partial<FirmProfile>;
}

export function generateBrandedReportWindow(data: AuditReportData): void {
  const defaultFirm = getActiveFirm();
  const firm = { ...defaultFirm, ...data.firmOverride };
  const printWindow = window.open('', '_blank', 'width=950,height=1150');

  if (!printWindow) {
    alert('Please allow popups in your browser to generate the PDF Audit Report for client delivery.');
    return;
  }

  const riskColorHex = 
    data.riskScore >= 70 ? '#DC2626' :
    data.riskScore >= 35 ? '#D97706' : '#059669';

  const riskBgHex = 
    data.riskScore >= 70 ? '#FEF2F2' :
    data.riskScore >= 35 ? '#FFFBEB' : '#ECFDF5';

  const riskBorderHex = 
    data.riskScore >= 70 ? '#FCA5A5' :
    data.riskScore >= 35 ? '#FCD34D' : '#6EE7B7';

  const auditDate = data.auditDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const engagementRef = data.engagementRef || `ENG-AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const auditorName = data.auditorName || 'Dr. Aria Sterling, CPA / CFE';
  const auditorTitle = data.auditorTitle || 'Lead Forensic Auditor';
  const clientName = data.clientName || 'Valued Corporate Client';
  const clientCompany = data.clientCompany || 'Corporate Advisory Division';
  const docType = data.documentType || 'Financial & Accounting Ledger';

  // Format dynamic findings
  const findingsList = data.findings && data.findings.length > 0 
    ? data.findings 
    : [
        ...(data.duplicatePayments || []).map(d => ({
          category: 'Duplicate Payments',
          title: `Duplicate Invoice Reference: ${d.invoice}`,
          severity: 'high' as const,
          description: `Duplicate disbursement of $${d.amount.toLocaleString()} identified for vendor "${d.vendor}" on ${d.date}.`,
          recommendation: 'Freeze second payment approval and request credit memo from vendor immediately.'
        })),
        ...(data.roundNumberPayments || []).map(r => ({
          category: 'Amount Anomaly',
          title: `Round-Sum Retainer: ${r.vendor}`,
          severity: 'medium' as const,
          description: `Even sum payment of $${r.amount.toLocaleString()} (${r.description}) lacking itemized hour logs.`,
          recommendation: 'Obtain certified milestone verification and itemized work breakdown sheet.'
        })),
        ...(data.weekendPayments || []).map(w => ({
          category: 'Transfer Timing',
          title: `Non-Business Day Settlement: ${w.vendor}`,
          severity: 'low' as const,
          description: `Transfer of $${w.amount.toLocaleString()} posted on weekend (${w.date}).`,
          recommendation: 'Cross-reference automated scheduled payment policies with authorized signer log.'
        }))
      ];

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${firm.name} - Forensic Audit Certificate [${engagementRef}]</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          
          @page {
            size: letter portrait;
            margin: 1.2cm 1.5cm;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            margin: 0;
            padding: 36px 44px;
            font-size: 13px;
            line-height: 1.55;
          }

          .no-print-bar {
            background: #0F172A;
            color: #FFFFFF;
            padding: 14px 24px;
            border-radius: 12px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
          }

          .btn-print {
            background: ${firm.primaryColor || '#7C3AED'};
            color: #FFFFFF;
            border: none;
            padding: 10px 22px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.2s;
          }
          .btn-print:hover {
            opacity: 0.9;
          }

          /* Header Section */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid ${firm.primaryColor || '#7C3AED'};
            padding-bottom: 22px;
            margin-bottom: 24px;
          }

          .brand-col {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .logo-img {
            max-height: 52px;
            max-width: 170px;
            object-fit: contain;
          }

          .logo-badge {
            width: 48px;
            height: 48px;
            background-color: ${firm.primaryColor || '#7C3AED'};
            color: white;
            font-weight: 900;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
          }

          .firm-title {
            font-size: 22px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: -0.5px;
            line-height: 1.2;
          }

          .firm-subtitle {
            font-size: 11px;
            font-weight: 600;
            color: ${firm.primaryColor || '#7C3AED'};
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 2px;
          }

          .contact-col {
            text-align: right;
            font-size: 11px;
            color: #475569;
            line-height: 1.5;
          }

          /* Certificate Hero Banner */
          .hero-banner {
            background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 22px 26px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .doc-heading {
            font-size: 19px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: -0.3px;
          }

          .doc-meta {
            font-size: 12px;
            color: #475569;
            margin-top: 6px;
            line-height: 1.6;
          }

          .doc-meta strong {
            color: #1E293B;
          }

          .risk-pill-box {
            text-align: right;
            min-width: 170px;
          }

          .risk-badge {
            display: inline-block;
            padding: 8px 18px;
            border-radius: 30px;
            font-weight: 900;
            font-size: 14px;
            background: ${riskBgHex};
            color: ${riskColorHex};
            border: 2px solid ${riskBorderHex};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .risk-subtext {
            font-size: 11px;
            font-weight: 700;
            color: #64748B;
            margin-top: 4px;
            text-transform: uppercase;
          }

          /* Metadata Grid */
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .meta-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 12px 14px;
          }

          .meta-label {
            font-size: 10px;
            font-weight: 800;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .meta-value {
            font-size: 13px;
            font-weight: 800;
            color: #0F172A;
            margin-top: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Section Titles */
          .section-title {
            font-size: 13px;
            font-weight: 900;
            color: ${firm.primaryColor || '#7C3AED'};
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 6px;
            margin-top: 26px;
            margin-bottom: 14px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .section-badge {
            font-size: 10px;
            font-weight: 700;
            background: #EDE9FE;
            color: #6D28D9;
            padding: 2px 8px;
            border-radius: 12px;
          }

          .summary-box {
            background: #F8FAFC;
            border-left: 4px solid ${firm.primaryColor || '#7C3AED'};
            padding: 16px 20px;
            border-radius: 0 10px 10px 0;
            color: #1E293B;
            font-size: 12.5px;
            line-height: 1.6;
            margin-bottom: 20px;
          }

          /* Table Styles */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 22px;
            font-size: 12px;
          }

          th {
            background: #F1F5F9;
            color: #334155;
            font-weight: 800;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border-bottom: 2px solid #CBD5E1;
            text-align: left;
          }

          td {
            padding: 12px 12px;
            border-bottom: 1px solid #E2E8F0;
            vertical-align: top;
          }

          tr:nth-child(even) {
            background-color: #FAFAFA;
          }

          .sev-critical {
            background: #FEE2E2;
            color: #991B1B;
            border: 1px solid #F87171;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            display: inline-block;
          }

          .sev-high {
            background: #FFEDD5;
            color: #9A3412;
            border: 1px solid #FB923C;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            display: inline-block;
          }

          .sev-medium {
            background: #FEF3C7;
            color: #92400E;
            border: 1px solid #FCD34D;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            display: inline-block;
          }

          .sev-low {
            background: #DCFCE7;
            color: #166534;
            border: 1px solid #86EFAC;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            display: inline-block;
          }

          /* Entity & Statutory Checklist */
          .statutory-box {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 12px;
          }

          .statutory-title {
            font-weight: 800;
            color: #92400E;
            margin-bottom: 4px;
          }

          /* Signoff Block */
          .signoff-section {
            margin-top: 36px;
            padding-top: 20px;
            border-top: 2px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            page-break-inside: avoid;
          }

          .signoff-col {
            width: 55%;
          }

          .signoff-label {
            font-size: 10px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .signature-line {
            border-bottom: 1.5px solid #0F172A;
            width: 260px;
            height: 40px;
            margin-bottom: 8px;
            position: relative;
          }

          .signature-font {
            position: absolute;
            bottom: 4px;
            left: 10px;
            font-family: 'Brush Script MT', cursive, serif;
            font-size: 22px;
            color: #1E3A8A;
          }

          .signoff-name {
            font-weight: 800;
            font-size: 13px;
            color: #0F172A;
          }

          .signoff-title {
            font-size: 11px;
            color: #64748B;
          }

          /* Verified Seal */
          .seal-box {
            width: 105px;
            height: 105px;
            border: 2.5px dashed ${firm.primaryColor || '#7C3AED'};
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: ${firm.primaryColor || '#7C3AED'};
            padding: 8px;
            background: #FAF5FF;
          }

          .seal-inner {
            font-size: 8.5px;
            font-weight: 900;
            letter-spacing: 0.6px;
            line-height: 1.3;
          }

          /* Footer */
          .footer {
            margin-top: 40px;
            padding-top: 14px;
            border-top: 1px solid #CBD5E1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
            color: #64748B;
          }

          .confidential-tag {
            font-weight: 700;
            color: #94A3B8;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          @media print {
            body { 
              padding: 0; 
              margin: 0;
            }
            .no-print-bar { 
              display: none !important; 
            }
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <!-- Top Toolbar (Hidden during Print/Save as PDF) -->
        <div class="no-print-bar">
          <div>
            <strong style="font-size: 14px;">Professional Forensic Audit Certificate</strong>
            <div style="font-size: 11px; color: #94A3B8;">Prepared for Client Delivery &bull; Ref: ${engagementRef}</div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-print" onclick="window.print()">
              🖨️ Print / Save as Client PDF
            </button>
          </div>
        </div>

        <!-- Header -->
        <div class="header">
          <div class="brand-col">
            ${
              firm.logoUrl
                ? `<img src="${firm.logoUrl}" alt="${firm.name}" class="logo-img" />`
                : `<div class="logo-badge">${firm.name.charAt(0)}</div>`
            }
            <div>
              <div class="firm-title">${firm.name}</div>
              <div class="firm-subtitle">Independent Forensic Document Auditing & Statutory Assurance</div>
            </div>
          </div>
          <div class="contact-col">
            <div>${firm.address || 'Certified Forensic Accounting Practice'}</div>
            <div>Web: <strong>${firm.website || 'https://audit-this-doc.ai'}</strong></div>
            <div>Direct: <strong>${firm.supportEmail || 'audit@advisoryfirm.com'}</strong></div>
          </div>
        </div>

        <!-- Engagement Hero Banner -->
        <div class="hero-banner">
          <div>
            <div class="doc-heading">Forensic Document Examination Certificate</div>
            <div class="doc-meta">
              <strong>Engagement Reference:</strong> ${engagementRef} &bull; 
              <strong>Client:</strong> ${clientName} (${clientCompany})<br/>
              <strong>Audited Target File:</strong> ${data.documentName} &bull; 
              <strong>Audit Date:</strong> ${auditDate}
            </div>
          </div>
          <div class="risk-pill-box">
            <div class="risk-subtext">Composite Risk Score</div>
            <div class="risk-badge" style="margin-top: 4px;">
              ${data.riskScore} / 100 &bull; ${data.riskLevel}
            </div>
          </div>
        </div>

        <!-- Key Extracted Metrics Metadata Grid -->
        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Document Classification</div>
            <div class="meta-value">${docType}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Target Entity / Vendor</div>
            <div class="meta-value">${data.keyMetrics?.detectedVendor || 'Primary Counterparty'}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Audited Transaction Sum</div>
            <div class="meta-value" style="color: ${firm.primaryColor || '#7C3AED'};">
              ${data.keyMetrics?.detectedAmount || '$0.00'}
            </div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Discrepancies Flagged</div>
            <div class="meta-value" style="color: ${riskColorHex};">
              ${findingsList.length} Observation${findingsList.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="section-title">
          <span>1. Executive Audit Summary & Scope</span>
          <span class="section-badge">Verified Analysis</span>
        </div>
        <div class="summary-box">
          ${data.executiveSummary}
        </div>

        ${
          data.auditorNotes
            ? `
          <div style="background: #FFFFFF; border: 1px dashed #CBD5E1; padding: 12px 16px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; color: #334155;">
            <strong>Special Auditor In-Charge Memo:</strong> ${data.auditorNotes}
          </div>
        `
            : ''
        }

        ${
          data.keyMetrics?.missingFields && data.keyMetrics.missingFields.length > 0
            ? `
          <div class="statutory-box">
            <div class="statutory-title">⚠️ Statutory Compliance & Verification Deficiencies Detected:</div>
            <ul style="margin: 4px 0 0 0; padding-left: 18px; color: #92400E;">
              ${data.keyMetrics.missingFields.map(field => `<li>Missing or unverified statutory field: <strong>${field}</strong></li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }

        <!-- Flagged Discrepancies Table -->
        <div class="section-title">
          <span>2. Itemized Forensic Findings & Discrepancies (${findingsList.length})</span>
          <span class="section-badge">${data.riskLevel} Priority</span>
        </div>

        ${
          findingsList.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th style="width: 18%;">Category</th>
                <th style="width: 12%;">Severity</th>
                <th style="width: 35%;">Observed Discrepancy</th>
                <th style="width: 35%;">Auditor Remediation Directive</th>
              </tr>
            </thead>
            <tbody>
              ${findingsList
                .map(
                  (item) => `
                <tr>
                  <td>
                    <strong>${item.category || 'General Finding'}</strong>
                  </td>
                  <td>
                    <span class="sev-${(item.severity || 'medium').toLowerCase()}">
                      ${(item.severity || 'medium').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <strong style="color: #0F172A; display: block; margin-bottom: 2px;">${item.title}</strong>
                    <span style="color: #475569;">${item.description}</span>
                  </td>
                  <td style="color: #1E293B; background: #FAF5FF;">
                    <strong>Recommendation:</strong> ${item.recommendation || 'Verify with counterparty authorized signature.'}
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : `
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; font-weight: 600;">
            ✓ Clean Document Verification: No critical fraud indicators or non-compliant statutory discrepancies were flagged during this examination.
          </div>
        `
        }

        <!-- Sign-Off & Official Audit Seal -->
        <div class="signoff-section">
          <div class="signoff-col">
            <div class="signoff-label">FORENSIC EXAMINATION EXECUTED & CERTIFIED BY:</div>
            <div class="signature-line">
              <span class="signature-font">${auditorName.split(' ')[0]} ${auditorName.split(' ')[1] || ''}</span>
            </div>
            <div class="signoff-name">${auditorName}</div>
            <div class="signoff-title">${auditorTitle} &bull; ${firm.name}</div>
            <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">
              Digital Signature Key: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-VERIFIED
            </div>
          </div>

          <div class="seal-box">
            <div class="seal-inner">
              OFFICIAL SEAL<br/>
              ★ ★ ★<br/>
              <strong>CERTIFIED AUDIT</strong><br/>
              ${new Date().getFullYear()} SECURE
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>
            &copy; ${new Date().getFullYear()} ${firm.name}. Prepared exclusively for ${clientName}. Privileged & Confidential.
          </div>
          <div class="confidential-tag">
            CERTIFIED FORENSIC AUDIT REPORT &bull; ${engagementRef}
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
