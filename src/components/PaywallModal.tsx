import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, Lock, X } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function PaywallModal({ 
  isOpen, 
  onClose,
  title = "Pro Plan Required",
  description = "This feature requires an active Pro subscription to access."
}: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6 pb-0 flex justify-between items-start">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 mb-6">{description}</p>
            
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('open-freemius-checkout', { detail: { plan: 'pro_monthly', interval: 'monthly' } }));
              }}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>View Pricing Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure Freemius Checkout Gateway</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
