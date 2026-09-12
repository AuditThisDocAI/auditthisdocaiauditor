const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix audit error logging
const target1 = `console.error("Gemini API call error during audit, executing heuristic forensic engine:", geminiErr);`;
const replace1 = `console.warn("Gemini API call error during audit, executing heuristic forensic engine. (API Key or Quota issue):", geminiErr.message || geminiErr);`;
code = code.replace(target1, replace1);

// Fix chat error logging
const target2 = `console.error("Gemini API chat error, using Dr. Aria expert fallback:", geminiError);`;
const replace2 = `console.warn("Gemini API chat error, using Dr. Aria expert fallback. (API Key or Quota issue):", geminiError.message || geminiError);`;
code = code.replace(target2, replace2);

fs.writeFileSync('server.ts', code);
