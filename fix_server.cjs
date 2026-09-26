const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetReturn = `      const resultObj = {
        isAuditable: isLikelyDocument,
        riskScore,
        riskLevel,
        summary: !isLikelyDocument 
          ? 'The provided text does not appear to be a recognizable financial or legal document.'
          : findings.length > 1 
            ? \`FOR-AI's heuristic engine detected \${findings.length} structural anomalies resulting in a \${riskLevel} risk assessment.\`
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
      };`;

const replaceReturn = `      // Apply bounding boxes from OCR words
      if (typeof ocrWords !== 'undefined' && ocrWords.length > 0 && findings.length > 0) {
        findings.forEach(finding => {
          let keyword = '';
          if (finding.title.includes('Crypto')) keyword = 'crypto';
          else if (finding.title.includes('USDT')) keyword = 'usdt';
          else if (finding.title.includes('Wire')) keyword = 'wire';
          else if (finding.title.includes('Tax')) keyword = 'tax';
          else if (finding.title.includes('PO')) keyword = 'po';
          else if (finding.title.includes('Missing')) keyword = 'date';
          else if (finding.title.includes('Vague')) keyword = 'miscellaneous';
          else if (finding.title.includes('Urgency')) keyword = 'urgent';
          else keyword = 'invoice';

          if (keyword) {
            const matchWord = ocrWords.find(w => w.text.toLowerCase().includes(keyword));
            if (matchWord) {
              const bbox = matchWord.bbox;
              finding.boundingBox = {
                x: Math.max(0, (bbox.x0 / imageWidth) * 100 - 2),
                y: Math.max(0, (bbox.y0 / imageHeight) * 100 - 2),
                width: Math.min(100, ((bbox.x1 - bbox.x0) / imageWidth) * 100 + 4),
                height: Math.min(100, ((bbox.y1 - bbox.y0) / imageHeight) * 100 + 4)
              };
            }
          }
        });
      }

      const resultObj = {
        isAuditable: isLikelyDocument,
        riskScore,
        riskLevel,
        summary: !isLikelyDocument 
          ? 'The provided text does not appear to be a recognizable financial or legal document.'
          : findings.length > 1 
            ? \`FOR-AI's heuristic engine detected \${findings.length} structural anomalies resulting in a \${riskLevel} risk assessment.\`
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
      };`;

code = code.replace(targetReturn, replaceReturn);

fs.writeFileSync('server.ts', code);
