const fs = require('fs');
let code = fs.readFileSync('src/lib/auditEngine.ts', 'utf8');

const target = `export interface AuditFinding {
  category: 'Amount Analysis' | 'Compliance' | 'Vendor Verification' | 'Formatting & Dates' | 'Red Flags';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}`;

const replace = `export interface AuditFinding {
  category: 'Amount Analysis' | 'Compliance' | 'Vendor Verification' | 'Formatting & Dates' | 'Red Flags';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}`;

code = code.replace(target, replace);
fs.writeFileSync('src/lib/auditEngine.ts', code);
