export function TrustedBy() {
  const industries = [
    "Accountants",
    "Auditors",
    "Small Businesses",
    "Consulting Firms",
    "Financial Advisors",
    "Legal Professionals"
  ];

  return (
    <section className="bg-white border-t border-[#E2E8F0] px-4 lg:px-12 py-8">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] text-center mb-6">
          Trusted by industry leaders in
        </p>
        
        <div className="flex flex-wrap justify-center lg:justify-between items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500 gap-6">
          {industries.map((industry) => (
            <div 
              key={industry}
              className="text-xl font-bold italic text-brand-navy flex items-center gap-2"
            >
              {industry}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
