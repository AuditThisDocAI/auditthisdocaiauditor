import { getActiveFirm } from './multiTenantDb';

export interface AuditReportData {
  documentName: string;
  auditDate: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  clientName?: string;
  auditorName?: string;
  duplicatePayments: Array<{ invoice: string; vendor: string; amount: number; date: string }>;
  roundNumberPayments: Array<{ vendor: string; amount: number; description: string }>;
  weekendPayments: Array<{ date: string; vendor: string; amount: number }>;
  executiveSummary: string;
}

export function generateBrandedReportWindow(data: AuditReportData): void {
  const firm = getActiveFirm();
  const printWindow = window.open('', '_blank', 'width=900,height=1100');

  if (!printWindow) {
    alert('Please allow popups to generate the branded PDF audit certificate.');
    return;
  }

  const riskColorHex = 
    data.riskScore >= 75 ? '#DC2626' :
    data.riskScore >= 50 ? '#D97706' :
    data.riskScore >= 25 ? '#2563EB' : '#059669';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${firm.name} - Forensic Audit Certificate</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #1E293B;
            background: #FFFFFF;
            margin: 0;
            padding: 40px;
            font-size: 13px;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid ${firm.primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-img {
            max-height: 50px;
            max-width: 180px;
            object-fit: contain;
          }
          .logo-placeholder {
            width: 44px;
            height: 44px;
            background-color: ${firm.primaryColor};
            color: white;
            font-weight: 800;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }
          .firm-title {
            font-size: 22px;
            font-weight: 800;
            color: ${firm.primaryColor};
            letter-spacing: -0.5px;
          }
          .firm-contact {
            text-align: right;
            font-size: 11px;
            color: #64748B;
          }
          .report-banner {
            background: ${firm.backgroundColor || '#F8FAFC'};
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .risk-pill {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            color: white;
            font-weight: 800;
            font-size: 14px;
            background: ${riskColorHex};
          }
          .section-title {
            font-size: 15px;
            font-weight: 800;
            color: ${firm.primaryColor};
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #E2E8F0;
          }
          th {
            background-color: #F1F5F9;
            font-weight: 700;
            color: #334155;
            font-size: 11px;
            text-transform: uppercase;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #CBD5E1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #64748B;
          }
          .watermark {
            font-family: monospace;
            font-size: 10px;
            color: #94A3B8;
            text-transform: uppercase;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: ${firm.primaryColor}; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div class="logo-container">
            ${
              firm.logoUrl
                ? `<img src="${firm.logoUrl}" alt="${firm.name}" class="logo-img" />`
                : `<div class="logo-placeholder">${firm.name.charAt(0)}</div>`
            }
            <div>
              <div class="firm-title">${firm.name}</div>
              <div style="font-size: 11px; color: #64748B;">Independent Forensic Auditing & Financial Advisory Services</div>
            </div>
          </div>
          <div class="firm-contact">
            <div>${firm.address || 'Certified Accounting Office'}</div>
            <div>Web: ${firm.website}</div>
            <div>Support: ${firm.supportEmail}</div>
          </div>
        </div>

        <div class="report-banner">
          <div>
            <div style="font-size: 18px; font-weight: 800; color: #0F172A;">Forensic Document Audit Certificate</div>
            <div style="color: #64748B; margin-top: 4px;">
              <strong>Target File:</strong> ${data.documentName} &bull; 
              <strong>Client:</strong> ${data.clientName || 'General Ledger Account'} &bull; 
              <strong>Audit Date:</strong> ${data.auditDate}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Composite Risk Score</div>
            <div class="risk-pill" style="margin-top: 4px;">
              ${data.riskScore}/100 - ${data.riskLevel} Risk
            </div>
          </div>
        </div>

        <div class="section-title">Executive Summary</div>
        <p style="background: #F8FAFC; padding: 15px; border-radius: 8px; border-left: 4px solid ${firm.primaryColor};">
          ${data.executiveSummary}
        </p>

        ${
          data.duplicatePayments.length > 0
            ? `
          <div class="section-title">Flagged Duplicate Payments (${data.duplicatePayments.length})</div>
          <table>
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Vendor Name</th>
                <th>Amount</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.duplicatePayments
                .map(
                  (item) => `
                <tr>
                  <td><strong>${item.invoice}</strong></td>
                  <td>${item.vendor}</td>
                  <td style="color: #DC2626; font-weight: 700;">$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>${item.date}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        ${
          data.roundNumberPayments.length > 0
            ? `
          <div class="section-title">Flagged High-Value Round Number Transactions (${data.roundNumberPayments.length})</div>
          <table>
            <thead>
              <tr>
                <th>Vendor / Beneficiary</th>
                <th>Transaction Amount</th>
                <th>Description / Ledger Memo</th>
              </tr>
            </thead>
            <tbody>
              ${data.roundNumberPayments
                .map(
                  (item) => `
                <tr>
                  <td><strong>${item.vendor}</strong></td>
                  <td style="color: #D97706; font-weight: 700;">$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>${item.description}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        ${
          data.weekendPayments.length > 0
            ? `
          <div class="section-title">Flagged Weekend / Non-Business Hour Payments (${data.weekendPayments.length})</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor / Payee</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.weekendPayments
                .map(
                  (item) => `
                <tr>
                  <td><strong>${item.date}</strong></td>
                  <td>${item.vendor}</td>
                  <td style="color: #2563EB; font-weight: 700;">$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #475569;">AUDITED AND APPROVED BY:</div>
            <div style="border-bottom: 1px solid #0F172A; width: 220px; height: 35px; margin-bottom: 5px;"></div>
            <div style="font-weight: 700;">${data.auditorName || 'Senior Forensic Auditor'}</div>
            <div style="font-size: 11px; color: #64748B;">${firm.name}</div>
          </div>
          <div style="text-align: right;">
            <div style="width: 80px; height: 80px; border: 2px dashed ${firm.primaryColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8px; font-weight: 800; color: ${firm.primaryColor}; margin-left: auto;">
              VERIFIED<br/>AUDIT SEAL
            </div>
          </div>
        </div>

        <div class="footer">
          <div>
            &copy; ${new Date().getFullYear()} ${firm.name}. All forensic findings and client reports are proprietary to ${firm.name}.
          </div>
          <div class="watermark">
            OFFICIAL CERTIFICATE &bull; ISSUED BY ${firm.name.toUpperCase()}
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
