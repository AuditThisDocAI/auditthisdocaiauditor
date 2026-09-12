const fs = require('fs');
let code = fs.readFileSync('src/components/AuditScanner.tsx', 'utf8');

const target1 = `
                  <div className="mt-1 space-y-1">
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-bold text-slate-900">{result.keyMetrics.detectedAmount}</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Vendor:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[100px]">{result.keyMetrics.detectedVendor}</span>
                    </div>
                  </div>
`;

const replace1 = `
                  <div className="mt-1 space-y-1">
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-bold text-slate-900">{result.keyMetrics.detectedAmount}</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Vendor:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[100px]">{result.keyMetrics.detectedVendor}</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[100px]">{result.keyMetrics.detectedDate || 'Not detected'}</span>
                    </div>
                    {result.keyMetrics.missingFields && result.keyMetrics.missingFields.length > 0 && (
                      <div className="text-xs flex flex-col pt-1 border-t border-slate-200 mt-1">
                        <span className="text-slate-500 font-semibold mb-1">Missing Elements:</span>
                        <div className="flex flex-wrap gap-1">
                          {result.keyMetrics.missingFields.map((field: string, idx: number) => (
                             <span key={idx} className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-100">{field}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
`;

code = code.replace(target1, replace1);

fs.writeFileSync('src/components/AuditScanner.tsx', code);
