import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Send, CheckCircle2, User } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Post to backend endpoint
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } catch (err) {
      console.error("Failed to submit contact form to API:", err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);

      // 2. Open mailto trigger for direct client sending to auditthisdocai@zohomail.com
      const subject = encodeURIComponent(`Audit This Doc AI Inquiry from ${formData.name || formData.email}`);
      const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`);
      window.location.href = `mailto:auditthisdocai@zohomail.com?subject=${subject}&body=${body}`;
    }
  };

  return (
    <section id="contact" className="py-20 bg-[#F8F9FC] relative border-t border-[#E2E8F0]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden">
          
          {/* Contact Form */}
          <div className="p-8 lg:p-10">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7C3AED] bg-[#7C3AED]/10 px-3.5 py-1 rounded-full mb-3">
                <Mail className="w-3.5 h-3.5" />
                auditthisdocai@zohomail.com
              </span>
              <h3 className="text-3xl font-extrabold text-[#1E293B] mb-2">Get in Touch with Our Forensic Team</h3>
              <p className="text-[#64748B] text-sm">Have questions about Dr. Aria AI or custom enterprise auditing plans? Send your message below.</p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto" />
                <h4 className="text-xl font-bold text-[#1E293B]">Message Sent!</h4>
                <p className="text-sm text-[#64748B] max-w-md mx-auto">
                  Thank you for reaching out. Your message has been dispatched to <strong className="text-[#1E293B]">auditthisdocai@zohomail.com</strong>. Our team will review your inquiry and get back to you shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', message: '' }); }}
                  className="mt-4 text-xs font-bold text-[#7C3AED] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                    Your Name / Organization
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FC] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED] transition-all"
                      placeholder="Jane Doe (Acme Corp)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FC] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED] transition-all"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FC] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED] transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-1.5">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FC] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED] transition-all resize-none"
                    placeholder="Describe your document auditing or inquiry requirements..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
          
        </div>
      </div>
    </section>
  );
}

