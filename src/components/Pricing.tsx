import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldAlert, Bot, ChevronDown } from 'lucide-react';

const tiers = [
  {
    name: 'Free Tier',
    id: 'tier-free',
    price: {
      monthly: '$0',
      yearly: '$0'
    },
    period: {
      monthly: 'forever',
      yearly: 'forever'
    },
    description: 'Try Dr. Aria directly with 10 free document audits on your device.',
    featuresHeader: 'Free Tier Includes:',
    features: [
      '10 Document Audits Free',
      'Dr. Aria PhD Forensic Engine',
      'Fraud & Compliance Risk Score (0-100)',
      'Line-Item & Tax ID Verification',
      'Interactive Consultation with Dr. Aria',
    ],
    mostPopular: false,
    buttonText: 'Start 10 Free Audits'
  },
  {
    name: 'Pro Audit Plan',
    id: 'tier-pro',
    price: {
      monthly: '$45',
      yearly: '$450'
    },
    period: {
      monthly: 'month',
      yearly: 'year'
    },
    description: 'For accountants, auditors, and teams needing regular document scans.',
    featuresHeader: 'Pro Plan Includes:',
    features: [
      '1,000 Document Audits / Month',
      'Full Dr. Aria PhD Forensic Engine',
      'Advanced Fraud & Wire Red Flag Detection',
      'Export PDF Audit Certificates',
      'Priority Scanning & OCR Parsing',
      'Email & Consultation Summaries',
    ],
    mostPopular: true,
    buttonText: 'Upgrade to 1,000 Audits Plan'
  }
];

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleAction = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'auth' } }));
  };

  return (
    <section id="pricing" className="py-20 bg-white relative border-t border-[#E2E8F0]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] mt-4 mb-4 tracking-tight">
            Plans & Pricing for Document Auditing
          </h2>
          <p className="text-[#64748B] text-base sm:text-lg leading-relaxed mb-6">
            Get started with 10 free audits directly on your device. Upgrade for unlimited forensic scans and advanced risk detection with Dr. Aria.
          </p>
        </div>

        {/* Dynamic Billing Switcher */}
        <div className="flex justify-center items-center gap-4 mb-14">
          <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${billingPeriod === 'monthly' ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-8 bg-[#E2E8F0] hover:bg-[#D1D5DB] rounded-full p-1 transition-colors duration-300 focus:outline-none"
            aria-label="Toggle billing period"
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-6 h-6 bg-white rounded-full shadow-md"
              animate={{ x: billingPeriod === 'yearly' ? 24 : 0 }}
            />
          </button>
          <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-2 ${billingPeriod === 'yearly' ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>
            Yearly 
            <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Save 20%
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative flex flex-col rounded-3xl p-6 lg:p-8 border ${
                tier.mostPopular
                  ? 'border-[#7C3AED] bg-[#F8F9FC] shadow-xl shadow-purple-500/10'
                  : 'border-[#E2E8F0] bg-white shadow-sm'
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">{tier.name}</h3>
                <p className="text-xs text-[#64748B] min-h-[36px]">{tier.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1E293B]">
                    {tier.price[billingPeriod]}
                  </span>
                  <span className="text-[#64748B] text-xs font-medium">
                    /{tier.period[billingPeriod]}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (tier.id === 'tier-free') {
                    const el = document.getElementById('document-auditor');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    handleAction();
                  }
                }}
                className={`w-full text-center py-3.5 rounded-xl font-bold transition-all mb-8 text-sm ${
                  tier.mostPopular
                    ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-lg shadow-purple-500/20 hover:-translate-y-0.5'
                    : 'bg-white text-[#1E293B] border-2 border-[#E2E8F0] hover:border-[#7C3AED] hover:bg-[#F8F9FC]'
                }`}
              >
                {tier.buttonText}
              </button>

              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-4">
                  {tier.featuresHeader}
                </h4>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[13px] text-[#64748B]">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Quick Questions */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-extrabold text-[#1E293B]">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-3">
            {[
              { q: 'How does the 10 free audit limit work?', a: 'Every device gets 10 free document audits automatically. You can paste text or test sample invoices, receipts, or contracts before needing an upgrade.' },
              { q: 'Who is Dr. Aria?', a: 'Dr. Aria is our specialized AI system fine-tuned on forensic accounting principles, tax rules, invoice fraud indicators, and contract verification.' },
              { q: 'What is included in the Pro plan?', a: 'The Pro plan includes 1,000 document audits per month for $45/month or $450/year, full forensic risk scoring, PDF audit certificates, and priority support.' },
              { q: 'Is my financial text data secure?', a: 'Yes. All text and documents are processed securely in memory for the duration of the audit and are never stored or shared with external third parties.' }
            ].map((faq, i) => (
              <div key={i} className="bg-[#F8F9FC] border border-[#E2E8F0] rounded-2xl overflow-hidden transition-colors hover:border-[#7C3AED]/30">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left font-bold text-[#1E293B] text-sm flex items-center justify-between p-5"
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-xs text-[#64748B] leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

