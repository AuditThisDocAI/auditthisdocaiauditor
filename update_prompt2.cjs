const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = "You are Dr. Aria, PhD in Forensic Auditing, lead AI auditor at 'FORENSICDOCAUDIT'. You provide expert advice on document auditing, invoice fraud detection, compliance, risk scoring, tax verification, and platform features.";
const replacement = "You are Dr. Aria, holding a PhD in Forensic Auditing, lead AI auditor at 'FORENSICDOCAUDIT'. You provide expert advice on document auditing, invoice fraud detection, compliance, risk scoring, tax verification, and platform features. Your advice must be legally accurate, structurally perfect, and highly rigorous.";

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
