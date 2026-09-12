const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexPattern = /\/\/ Evidence-only fallback if Gemini is unavailable[\s\S]*?return res\.json\(resultObj\);/g;

const newFallback = `// Heuristic fallback forensic engine if Gemini is unavailable
      const text = (documentText || '').trim();
      const findings = [];
      const lowerText = text.toLowerCase();
      
      const isLikelyDocument = lowerText.includes('invoice') || lowerText.includes('receipt') || lowerText.includes('contract') || lowerText.includes('total') || lowerText.includes('date') || lowerText.includes('amount') || text.length > 50;
      
      // Data extraction heuristics
      const amountMatch = text.match(/\\$?\\s*\\d+(?:,\\d{3})*(?:\\.\\d{2})/);
      const detectedAmount = amountMatch ? amountMatch[0] : 'Not detected';
      
      const dateMatch = text.match(/\\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \\d{1,2},? \\d{4}\\b|\\b\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}\\b/);
      const detectedDate = dateMatch ? dateMatch[0] : 'Not detected';

      const taxIdMatch = text.match(/\\b(?:VAT|EIN|Tax ID|TIN)\\s*[:\\-#]?\\s*([A-Z0-9\\-]+)\\b/i);
      
      const missingFields = [];
      if (!taxIdMatch) missingFields.push("Tax/VAT ID");
      if (!dateMatch) missingFields.push("Invoice Date");
      if (!amountMatch) missingFields.push("Total Amount");
      
      let riskScore = 0;
      let riskLevel = 'Low';
      
      if (isLikelyDocument) {
        if (!taxIdMatch) {
          findings.push({
            title: "Missing Corporate Tax ID",
            severity: "High",
            description: "No registered VAT, EIN, or Tax ID was found in the document text. This violates basic vendor compliance and prevents entity verification.",
            recommendation: "Request an updated W-9 or official tax certificate from the vendor prior to processing payment."
          });
          riskScore += 45;
        }
        
        if (!dateMatch) {
          findings.push({
            title: "Missing Transaction Date",
            severity: "Medium",
            description: "No clear transaction or issuance date was identified. Backdating or missing dates constitute an accounting discrepancy.",
            recommendation: "Reject the document and request a re-issued invoice with a valid timestamp."
          });
          riskScore += 20;
        }
        
        if (lowerText.includes('wire') || lowerText.includes('crypto') || lowerText.includes('usdt')) {
          findings.push({
            title: "High-Risk Payment Method Detected",
            severity: "Critical",
            description: "The document requests payment via Wire Transfer or Cryptocurrency. This is a common vector for business email compromise (BEC) fraud.",
            recommendation: "Trigger a mandatory phone verification with the vendor's financial controller."
          });
          riskScore += 50;
        }
        
        if (findings.length === 0) {
           findings.push({
             title: "Basic Compliance Verified",
             severity: "Low",
             description: "Heuristic scan completed without detecting obvious missing structural elements.",
             recommendation: "Proceed with standard review protocol."
           });
        }
        
        if (riskScore >= 75) riskLevel = 'Critical';
        else if (riskScore >= 45) riskLevel = 'High';
        else if (riskScore >= 20) riskLevel = 'Moderate';
      } else {
        riskScore = 100;
        riskLevel = 'Invalid';
      }

      const resultObj = {
        isAuditable: isLikelyDocument,
        riskScore,
        riskLevel,
        summary: !isLikelyDocument 
          ? 'The provided text does not appear to be a recognizable financial or legal document.'
          : findings.length > 1 
            ? \`Dr. Aria's heuristic engine detected \${findings.length} structural anomalies resulting in a \${riskLevel} risk assessment.\`
            : 'Heuristic review found no immediate red flags in the document structure.',
        documentType: !isLikelyDocument
          ? 'Non-Auditable'
          : lowerText.includes('invoice')
          ? 'Invoice'
          : lowerText.includes('receipt')
            ? 'Receipt'
            : lowerText.includes('contract')
              ? 'Contract'
              : 'General Document',
        findings,
        keyMetrics: {
          detectedVendor: 'Scanned Entity',
          detectedAmount,
          detectedDate,
          missingFields
        }
      };

      const auditRecord = {
        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        documentName: documentName || 'Submitted Document',
        documentType: resultObj.documentType,
        riskScore: resultObj.riskScore,
        riskLevel: resultObj.riskLevel,
        summary: resultObj.summary,
        findingsCount: findings.filter(f => f.severity !== 'Low').length,
        findings: resultObj.findings,
        keyMetrics: resultObj.keyMetrics,
        ip: req.ip || (req.headers['x-forwarded-for'] || '127.0.0.1')
      };

      liveAuditLogs.unshift(auditRecord);

      return res.json(resultObj);`;

code = code.replace(regexPattern, newFallback);
fs.writeFileSync('server.ts', code);
