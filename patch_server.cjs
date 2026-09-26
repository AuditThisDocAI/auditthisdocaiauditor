const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetFallback = `      // Heuristic fallback forensic engine if Gemini is unavailable
      const text = (documentText || '').trim();
      const findings = [];`;

const replaceFallback = `      // Heuristic fallback forensic engine if Gemini is unavailable
      let text = (documentText || '').trim();
      let ocrWords = [];
      let imageWidth = 1000;
      let imageHeight = 1000;
      
      if (!text && fileData?.base64 && fileData.mimeType.startsWith('image/')) {
        try {
          console.info("Running fallback OCR via Tesseract.js...");
          const imgBuffer = Buffer.from(fileData.base64, 'base64');
          const result = await Tesseract.recognize(imgBuffer, 'eng');
          text = result.data.text.trim();
          ocrWords = result.data.words || [];
          imageWidth = result.data.imageColor ? result.data.imageColor.width : 1000;
          imageHeight = result.data.imageColor ? result.data.imageColor.height : 1000;
          console.info("OCR Extracted text length:", text.length);
        } catch (ocrErr) {
          console.info("Fallback OCR failed");
        }
      }

      const findings = [];`;

code = code.replace(targetFallback, replaceFallback);

// Also inject the bounding boxes before returning the final JSON
const targetReturn = `      res.json({
        isAuditable: true,
        riskScore,
        riskLevel,
        summary: \`FOR-AI's heuristic engine detected \${findings.length} structural anomalies resulting in a \${riskLevel} risk assessment.\`,
        documentType: documentName ? (documentName.toLowerCase().includes('invoice') ? 'Invoice' : 'General Document') : 'General Document',
        findings,
        keyMetrics: {
          detectedVendor: "Scanned Entity",
          detectedAmount,
          detectedDate,
          missingFields
        }
      });`;

const replaceReturn = `      // Apply bounding boxes from OCR words
      if (ocrWords.length > 0 && findings.length > 0) {
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

      res.json({
        isAuditable: true,
        riskScore,
        riskLevel,
        summary: \`FOR-AI's heuristic engine detected \${findings.length} structural anomalies resulting in a \${riskLevel} risk assessment.\`,
        documentType: documentName ? (documentName.toLowerCase().includes('invoice') ? 'Invoice' : 'General Document') : 'General Document',
        findings,
        keyMetrics: {
          detectedVendor: "Scanned Entity",
          detectedAmount,
          detectedDate,
          missingFields
        }
      });`;

code = code.replace(targetReturn, replaceReturn);

fs.writeFileSync('server.ts', code);
