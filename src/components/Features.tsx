import { motion } from "motion/react";
import { 
  FileSearch, 
  Bot, 
  ShieldAlert, 
  FileCheck2, 
  AlertTriangle,
  Lock,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";

const auditFeatures = [
  {
    title: "Forensic Document Scanning",
    description: "Scan invoices, contracts, receipts, and bank statements in PDF, PNG, JPG, CSV, or raw text format.",
    icon: FileSearch,
    color: "text-[#7C3AED]",
    bg: "bg-[#7C3AED]/10"
  },
  {
    title: "Dr. Aria PhD AI Agent",
    description: "Dr. Aria applies doctorate-level forensic auditing logic to examine line items, vendor entities, and transaction history.",
    icon: Bot,
    color: "text-[#7C3AED]",
    bg: "bg-[#7C3AED]/10"
  },
  {
    title: "Wire & Fraud Risk Scoring",
    description: "Detect unusual bank account wire requests, unverified crypto transfers, duplicate invoice IDs, and price markups.",
    icon: ShieldAlert,
    color: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10"
  },
  {
    title: "Tax ID & Entity Verification",
    description: "Automatically verify VAT, EIN, and Tax Registration numbers to prevent fictitious vendor billing.",
    icon: FileCheck2,
    color: "text-[#10B981]",
    bg: "bg-[#10B981]/10"
  },
  {
    title: "Discrepancy Red Flag Alerts",
    description: "Highlight missing payment terms, broken math, altered dates, and unapproved vendor addresses.",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "Structured Audit Reports",
    description: "Receive instant risk scores (0-100), executive summary notes, and downloadable audit documentation.",
    icon: FileSpreadsheet,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-[#F8F9FC] relative border-t border-[#E2E8F0]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-wide uppercase text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1 rounded-full">
            Forensic Auditing Capabilities
          </span>
          <h3 className="text-3xl lg:text-4xl font-extrabold text-[#1E293B] mt-4 mb-4 tracking-tight">
            Comprehensive AI Document Auditing
          </h3>
          <p className="text-[#64748B] text-base lg:text-lg leading-relaxed">
            Eliminate financial fraud, duplicate payouts, and compliance errors with Dr. Aria's automated forensic auditing engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {auditFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-[#7C3AED]/30 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.bg} ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#1E293B] mb-2">{feature.title}</h4>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

