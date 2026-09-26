const fs = require('fs');
let code = fs.readFileSync('src/components/AuditScanner.tsx', 'utf8');

// Replace the textarea block with a file upload + textarea
const targetBlock = `          <div>
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
              disabled={isScanning || !text.trim()}`;

const replaceBlock = `          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Upload Document Image/PDF or Paste Text
            </label>
            <div className="mb-4">
              <input
                type="file"
                accept="image/png, image/jpeg, application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFile(file);
                  }
                }}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#7C3AED]/10 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/20 transition-all cursor-pointer"
              />
              {file && (
                <div className="mt-2 text-xs text-slate-600">
                  Selected file: <span className="font-bold">{file.name}</span>
                </div>
              )}
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
              disabled={isScanning || (!text.trim() && !file)}`;

code = code.replace(targetBlock, replaceBlock);

// Add file state
const stateTarget = `  const [isSaved, setIsSaved] = useState(false);`;
const stateReplace = `  const [isSaved, setIsSaved] = useState(false);\n  const [file, setFile] = useState<File | null>(null);`;
code = code.replace(stateTarget, stateReplace);

// Update handleScan to process file
const scanTarget = `  const handleScan = async () => {
    if (!text.trim()) return;
    
    setIsScanning(true);
    setResult(null);
    setIsSaved(false);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text })
      });`;

const scanReplace = `  const handleScan = async () => {
    if (!text.trim() && !file) return;
    
    setIsScanning(true);
    setResult(null);
    setIsSaved(false);

    try {
      let base64Data = '';
      let mimeType = '';
      let documentName = '';

      if (file) {
        documentName = file.name;
        mimeType = file.type;
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = error => reject(error);
        });
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentText: text,
          documentName: documentName,
          fileData: file ? { base64: base64Data, mimeType } : undefined
        })
      });`;
code = code.replace(scanTarget, scanReplace);

fs.writeFileSync('src/components/AuditScanner.tsx', code);
