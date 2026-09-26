const fs = require('fs');
let code = fs.readFileSync('src/components/AuditScanner.tsx', 'utf8');

const regex = /<label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">[\s\S]*?<FileText className="w-4 h-4 text-slate-400" \/>[\s\S]*?Raw Document Text[\s\S]*?<\/label>[\s\S]*?<textarea[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?<div className="flex justify-end">[\s\S]*?<button[\s\S]*?<\/button>[\s\S]*?<\/div>/m;

const replaceNew = `          <div>
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

code = code.replace(regex, replaceNew);
fs.writeFileSync('src/components/AuditScanner.tsx', code);
