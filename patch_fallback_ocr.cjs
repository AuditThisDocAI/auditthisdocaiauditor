const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add import if not exists
if (!code.includes("import Tesseract")) {
  code = code.replace('import { GoogleGenAI } from "@google/genai";', 'import { GoogleGenAI } from "@google/genai";\nimport Tesseract from "tesseract.js";');
}

const targetFallback = `      // Heuristic fallback forensic engine if Gemini is unavailable
      const text = (documentText || '').trim();
      const findings: any[] = [];`;

const replacementFallback = `      // Heuristic fallback forensic engine if Gemini is unavailable
      let text = (documentText || '').trim();
      
      // If an image was provided but text is empty, run OCR locally
      if (!text && fileData?.base64 && fileData.mimeType.startsWith('image/')) {
        try {
          console.log("Running fallback OCR via Tesseract.js...");
          const imgBuffer = Buffer.from(fileData.base64, 'base64');
          const result = await Tesseract.recognize(imgBuffer, 'eng');
          text = result.data.text.trim();
          console.log("OCR Extracted text length:", text.length);
        } catch (ocrErr) {
          console.error("Fallback OCR failed:", ocrErr);
        }
      }

      const findings: any[] = [];`;

code = code.replace(targetFallback, replacementFallback);
fs.writeFileSync('server.ts', code);
