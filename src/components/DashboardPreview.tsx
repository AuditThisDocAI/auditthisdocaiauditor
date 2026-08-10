import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSearch, 
  Bot, 
  ShieldAlert, 
  CheckCircle2, 
  Upload, 
  FileText, 
  AlertTriangle,
  Sparkles,
  Loader2,
  FileCheck2,
  Lock
} from 'lucide-react';

const steps = [
  { id: 0, label: 'Reading Document Text', icon: Upload },
  { id: 1, label: 'Dr. Aria Forensic Scan', icon: Bot },
  { id: 2, label: 'Calculating Risk & Findings', icon: ShieldAlert },
];

export function DashboardPreview() {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnalysisStep(1), 1000);
    const t2 = setTimeout(() => setAnalysisStep(2), 2200);
    const t3 = setTimeout(() => {
      setAnalysisStep(3);
      setIsAnalyzing(false);
    }, 3200);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="relative w-full bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col h-[560px]">
      {/* Window Title Bar */}
      <div className="h-11 bg-[#F8F9FC] border-b border-[#E2E8F0] flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-[#10B981]" />
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-md px-3 py-0.5 text-[11px] font-mono text-[#64748B]">
          Dr. Aria Forensic Engine v2.4
        </div>
        <div className="text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-0.5 rounded-full">
          10 Free Audits Active
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-[#F8F9FC]">
        {/* Left Mini Sidebar */}
        <div className="hidden md:flex flex-col w-56 bg-white border-r border-[#E2E8F0] p-4 gap-2">
          <div className="px-2 mb-2 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Document Queue
          </div>
          {[
            { label: 'Vendor Invoice #8920', status: 'High Risk (85)', alert: true },
            { label: 'Equipment Contract #204', status: 'Moderate Risk (45)', alert: false },
            { label: 'Hilton Travel Receipt', status: 'Clean (12)', alert: false },
          ].map((item, i) => (
            <div 
              key={i}
              className={`p-2.5 rounded-xl text-xs font-medium border transition-all ${
                i === 0 
                  ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#1E293B]' 
                  : 'bg-[#F8F9FC] border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>{item.label}</span>
                {item.alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">{item.status}</div>
            </div>
          ))}

          <div className="mt-auto p-3 rounded-xl bg-[#F8F9FC] border border-[#E2E8F0] text-center">
            <div className="text-[10px] font-extrabold text-[#64748B] uppercase">Free Plan</div>
            <div className="text-xs font-bold text-[#7C3AED] mt-0.5">1 / 10 Audits Used</div>
          </div>
        </div>

        {/* Main Content Preview Area */}
        <div className="flex-1 bg-white p-5 overflow-y-auto relative">
          
          {/* Analysis Overlay Animation */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <div className="bg-white p-6 rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-sm w-full text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-base font-bold text-[#1E293B] mb-4">Dr. Aria Forensic Scan</h3>
                  <div className="space-y-4 text-left">
                    {steps.map((step) => {
                      const isActive = analysisStep === step.id;
                      const isCompleted = analysisStep > step.id;
                      const StepIcon = step.icon;
                      
                      return (
                        <div key={step.id} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                            isCompleted ? 'bg-[#10B981] text-white' : 
                            isActive ? 'bg-[#7C3AED] text-white shadow-md' : 'bg-[#F8F9FC] text-[#94A3B8] border border-[#E2E8F0]'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs font-bold ${
                              isActive || isCompleted ? 'text-[#1E293B]' : 'text-[#94A3B8]'
                            }`}>
                              {step.label}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              {isActive ? 'Analyzing...' : isCompleted ? 'Done' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audit Results Screen */}
          <div className="space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-[#E2E8F0]">
              <div>
                <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider">Audit Completed by Dr. Aria</span>
                <h3 className="text-lg font-bold text-[#1E293B]">Vendor Invoice #8920</h3>
                <div className="text-xs text-[#64748B]">Apex Global Consulting LLC • $17,000.00</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center">
                <div className="text-lg font-black leading-none">85/100</div>
                <div className="text-[9px] font-bold uppercase">High Risk</div>
              </div>
            </div>

            {/* Dr. Aria Summary */}
            <div className="p-3.5 bg-[#F8F9FC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-xs font-bold text-[#1E293B]">Dr. Aria (PhD Auditor) Summary:</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                "High risk detected due to urgent wire transfer request to an unverified crypto escrow account, combined with missing vendor Tax ID."
              </p>
            </div>

            {/* Findings List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Key Red Flags:</div>
              <div className="p-3 rounded-xl border border-red-100 bg-red-50/50 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Unverified Wire Transfer Destination</div>
                  <div className="text-[11px] text-[#64748B]">Requesting crypto escrow wire payment within 24 hours.</div>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#1E293B]">Missing Tax ID / VAT Number</div>
                  <div className="text-[11px] text-[#64748B]">No registered tax identifier detected on invoice header.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

