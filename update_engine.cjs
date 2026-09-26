const fs = require('fs');
let code = fs.readFileSync('src/lib/auditEngine.ts', 'utf8');

// Update AuditFinding interface to include boundingBox
const targetInterface = `export interface AuditFinding {
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}`;

const replaceInterface = `export interface AuditFinding {
  category: string;
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

code = code.replace(targetInterface, replaceInterface);

fs.writeFileSync('src/lib/auditEngine.ts', code);
