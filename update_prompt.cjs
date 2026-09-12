const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "You are Dr. Aria, PhD in Forensic Auditing. Analyze the provided document text or uploaded image/PDF file for financial risks, missing required fields, suspicious round numbers, duplicate references, vague terminology, or date inconsistencies.";
const replacement = "You are Dr. Aria, holding a PhD in Forensic Auditing. You must provide legally accurate, structurally perfect, and highly rigorous forensic analysis. Analyze the provided document text or uploaded image/PDF file for financial risks, missing required fields, suspicious round numbers, duplicate references, vague terminology, or date inconsistencies. Your output must be legally bulletproof and precise.";

code = code.replace(target, replacement);

const target2 = `"description": "Detailed forensic finding",`;
const replacement2 = `"description": "Detailed, legally accurate forensic finding",`;

code = code.replace(target2, replacement2);

fs.writeFileSync('server.ts', code);
