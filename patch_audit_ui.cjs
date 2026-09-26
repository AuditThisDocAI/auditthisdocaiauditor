const fs = require('fs');
let code = fs.readFileSync('src/components/AuditScanner.tsx', 'utf8');

// The target we want to replace is the `Raw Document Text` block to `Analyzing Text...`

const targetInputArea = `          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Raw Document Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the raw text of an invoice, receipt, or contract here..."
              className="w-full h-48 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all resize-none text-sm font-mono text-slate-600"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleScan}
              disabled={isScanning || !text.trim()}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Text...
                </>
              ) : (
                <>
                  <ScanSearch className="w-5 h-5" />
                  Run Forensic Scan
                </>
              )}
            </button>
          </div>`;

const replaceInputArea = `          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Upload Document Image/PDF or Paste Text
            </label>
            <div className="mb-4">
              <input
                type="file"
                accept="image/png, image/jpeg, application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setPreviewUrl(URL.createObjectURL(f));
                  }
                }}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED]/10 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/20 transition-all cursor-pointer"
              />
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Optional: Paste raw text here if you want to scan text instead..."
              className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all resize-none text-sm font-mono text-slate-600"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleScan}
              disabled={isScanning || (!text.trim() && !file)}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ScanSearch className="w-5 h-5" />
                  Run Forensic Scan
                </>
              )}
            </button>
          </div>`;

if (code.includes('Raw Document Text')) {
  code = code.replace(targetInputArea, replaceInputArea);
}


// Add previewUrl to state
if (!code.includes('const [previewUrl, setPreviewUrl]')) {
  code = code.replace(
    'const [file, setFile] = useState<File | null>(null);',
    'const [file, setFile] = useState<File | null>(null);\n  const [previewUrl, setPreviewUrl] = useState<string | null>(null);'
  );
}

// Ensure the scan preview visual area is added just below the results or at the beginning of findings
const targetFindings = `{/* Findings */}`;
const replaceFindings = `{previewUrl && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 text-[#7C3AED]" />
                    Visual Anomaly Overlay
                  </h3>
                  <div className="relative inline-block w-full max-w-2xl border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <img src={previewUrl} alt="Document Preview" className="w-full h-auto object-contain" />
                    {result.findings.map((finding, idx) => {
                      if (finding.boundingBox) {
                        return (
                          <div 
                            key={idx}
                            className="absolute border-2 border-red-500 bg-red-500/20 cursor-pointer group"
                            style={{ 
                              left: \`\${finding.boundingBox.x}%\`, 
                              top: \`\${finding.boundingBox.y}%\`, 
                              width: \`\${finding.boundingBox.width}%\`, 
                              height: \`\${finding.boundingBox.height}%\` 
                            }}
                          >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              {finding.title}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
              {/* Findings */}`;

if (!code.includes('Visual Anomaly Overlay')) {
  code = code.replace(targetFindings, replaceFindings);
}

fs.writeFileSync('src/components/AuditScanner.tsx', code);
