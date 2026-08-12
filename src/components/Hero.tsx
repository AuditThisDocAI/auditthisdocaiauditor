import { motion } from 'motion/react';
import { ShieldCheck, CreditCard, Lock, Sparkles, Bot } from 'lucide-react';
import { DashboardPreview } from './DashboardPreview';

export function Hero() {
  return (
    <section className="relative pt-10 lg:pt-16 pb-20 lg:pb-28 overflow-hidden bg-[#F8F9FC]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12 flex flex-col lg:flex-row items-center gap-10 relative">
        <div className="w-full lg:w-[48%] flex flex-col justify-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#7C3AED]/10 text-[#7C3AED] px-3.5 py-1.5 rounded-full text-xs font-bold w-fit"
          >
            <Bot className="w-4 h-4" />
            <span>POWERED BY DR. ARIA (PhD FORENSIC AUDITOR)</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.1] tracking-tight text-[#1E293B]"
          >
            AI Document Auditor & <br className="hidden md:block" />
            Forensic Scanner <span className="text-[#7C3AED]">Made Effortless</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-[#64748B] leading-relaxed"
          >
            Instantly upload or paste invoices, contracts, receipts, and financial statements. Dr. Aria inspects line items, verifies tax compliance, identifies suspicious wire requests, and generates comprehensive risk scores.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-4 mt-2"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }))}
                className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-purple-600/30 hover:-translate-y-0.5 transition-all text-center"
              >
                Get Started / Sign In
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('document-auditor');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'landing' } }));
                    setTimeout(() => {
                      document.getElementById('document-auditor')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="w-full sm:w-auto bg-white border-2 border-[#E2E8F0] text-[#1E293B] hover:border-[#7C3AED] hover:text-[#7C3AED] px-6 py-4 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Audit Document Free</span>
                <span className="bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-extrabold px-2 py-0.5 rounded-full">10 Free Audits</span>
              </button>
            </div>
            
            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mt-2"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#7C3AED]" />
                10 Free Audits / Device
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#94A3B8]" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#94A3B8]" />
                Bank-Grade Privacy
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Live Forensic Scanner Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="w-full lg:w-[52%] relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/40 to-blue-200/40 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <DashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

