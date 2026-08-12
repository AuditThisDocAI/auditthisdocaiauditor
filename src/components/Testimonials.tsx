import { motion, AnimatePresence } from 'motion/react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: "Ilse Wright",
    role: "CEO, SEO LAB",
    content: "FORENSICDOCAUDIT has completely transformed our workflow. What used to take our team days is now automated in seconds with 100% accuracy.",
    image: "https://i.pravatar.cc/150?u=ilsewright"
  },
  {
    name: "Tahlia Nel",
    role: "CEO, Beauty & The Brush Inc.",
    content: "The AI auditing feature caught a $12,000 duplicate invoice that our manual review missed. It paid for itself in the first month of using it.",
    image: "https://i.pravatar.cc/150?u=tahlianel"
  },
  {
    name: "Avery Davidson",
    role: "Founder, Creative Studio",
    content: "As a small business owner, I don't have time to be an accountant. This platform feels like having a dedicated CFO and bookkeeper working 24/7.",
    image: "https://i.pravatar.cc/150?u=emily"
  }
];

const logos = [
  "Acme Corp", "GlobalTech", "Pinnacle", "Nexus", "Vertex", "Quantum", "Starlight", "Omega"
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getVisibleTestimonials = () => {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 1 : 3;
    const visible = [];
    for (let i = 0; i < count; i++) {
      visible.push(testimonials[(currentIndex + i) % testimonials.length]);
    }
    return visible;
  };

  return (
    <section className="py-24 bg-white relative border-t border-[#E2E8F0] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
        
        {/* Logo Badges Marquee */}
        <div className="mb-24 text-center">
          <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-8">Trusted by innovative teams worldwide</p>
          <div className="relative flex overflow-x-hidden">
            <div className="py-4 animate-marquee whitespace-nowrap flex items-center gap-16">
              {[...logos, ...logos, ...logos].map((logo, i) => (
                <span key={i} className="text-2xl font-black text-[#94A3B8] opacity-50 tracking-tighter">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[#7C3AED] font-bold tracking-wide uppercase text-sm mb-3">
            Customer Stories
          </h2>
          <h3 className="text-4xl lg:text-5xl font-extrabold text-[#1E293B] mb-6 tracking-tight">
            Trusted by modern businesses
          </h3>
          <p className="text-[#64748B] text-lg leading-relaxed">
            See how FORENSICDOCAUDIT is helping companies save time, reduce errors, and grow faster.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {getVisibleTestimonials().map((t, index) => (
                <motion.div
                  key={t.name + index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="bg-[#F8F9FC] p-8 rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col"
                >
                  <div className="absolute -top-4 -right-4 text-[#7C3AED]/5">
                    <Quote size={120} />
                  </div>
                  <div className="flex gap-1 mb-6 text-[#10B981]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-[#1E293B] text-lg font-medium leading-relaxed mb-8 relative z-10 flex-1">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-4 relative z-10 mt-auto">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1E293B] leading-tight">{t.name}</h4>
                      <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mt-1">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <div className="flex justify-center gap-4 mt-12">
            <button 
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-[#F8F9FC] text-[#1E293B] border border-[#E2E8F0] hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-[#F8F9FC] text-[#1E293B] border border-[#E2E8F0] hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
