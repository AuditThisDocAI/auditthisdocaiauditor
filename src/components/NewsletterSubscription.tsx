import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('submitting');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 1000);
  };

  return (
    <section className="py-24 bg-[#1E293B] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7C3AED]/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white font-semibold text-sm mb-6 border border-white/10">
            <Mail className="w-4 h-4" />
            Newsletter
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Stay ahead in forensic auditing
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Join thousands of professionals receiving our weekly insights on AI-powered auditing, fraud detection, and compliance.
          </p>

          <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                disabled={status !== 'idle'}
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all disabled:opacity-50"
                required
              />
              <button
                type="submit"
                disabled={status !== 'idle'}
                className="px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-[#7C3AED] min-w-[160px]"
              >
                {status === 'submitting' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : status === 'success' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Subscribed
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            {status === 'success' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-8 left-0 right-0 text-green-400 text-sm font-medium"
              >
                Thanks for subscribing! Check your inbox soon.
              </motion.p>
            )}
          </form>
          
          <p className="text-sm text-slate-400 mt-6">
            We care about your data. Read our <a href="#" className="underline hover:text-white transition-colors">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
