import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "What is your Refund & Cancellation Policy?",
    answer: "We offer an unconditional 14-Day Money-Back Guarantee on all subscription tiers. If you are not completely satisfied, email support@forensicdocaudit.com within 14 days of subscribing for a full refund back to your original payment method. You can also cancel your recurring subscription at any time directly through your account or Freemius receipt with zero cancellation fees."
  },
  {
    question: "What are the Terms and Conditions for AI forensic audits?",
    answer: "ForensicDocAudit is an advanced analytical co-pilot for accountants and auditors. In accordance with professional standards, the platform operates on a 'human-in-the-loop' principle where the AI flags discrepancies and anomalies, but certified practitioners maintain final review for legal and tax filings."
  },
  {
    question: "How accurate is the AI auditing?",
    answer: "Our AI models are trained on millions of financial documents and maintain a 99.9% accuracy rate. It cross-references data points across ledgers, invoices, and bank statements to flag discrepancies that human eyes often miss."
  },
  {
    question: "Is my financial data secure with your AI?",
    answer: "Absolutely. We use bank-level AES-256 encryption for data at rest and in transit. Your data is isolated, anonymized, and never used to train public AI models. We are fully compliant with SOC2, GDPR, and POPIA."
  },
  {
    question: "How does the fraud detection work?",
    answer: "Our system continuously monitors your accounts for anomalous patterns, such as duplicate vendor payments, unexpected salary spikes, or irregular invoice dates. When an anomaly is detected, it immediately flags it for human review."
  },
  {
    question: "Can I connect my existing bank accounts?",
    answer: "Yes, we integrate with over 10,000 global financial institutions securely. Your bank feeds sync automatically in real-time."
  },
  {
    question: "What happens if the AI makes a mistake?",
    answer: "Our platform uses a 'human-in-the-loop' approach. The AI acts as your powerful assistant, preparing drafts and highlighting issues, but you always have the final approval before any transaction is finalized or tax report is filed."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white relative border-t border-[#E2E8F0]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[#7C3AED] font-bold tracking-wide uppercase text-sm mb-3">
            Common Questions
          </h2>
          <h3 className="text-4xl lg:text-5xl font-extrabold text-[#1E293B] mb-6 tracking-tight">
            Frequently Asked Questions
          </h3>
          <p className="text-[#64748B] text-lg leading-relaxed">
            Everything you need to know about our platform, security, and AI capabilities.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                className="w-full flex items-center justify-between p-6 bg-[#F8F9FC] border border-[#E2E8F0] rounded-2xl hover:border-[#7C3AED]/30 transition-all text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-bold text-[#1E293B] pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-[#64748B] shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-2 text-[#64748B] leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
