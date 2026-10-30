import React, { useState, useEffect } from 'react';
import { FAQS_DATA } from '../data/hotelData';
import { contentAPI } from '../services/api';
import { ChevronDown, HelpCircle, Send, CheckCircle2 } from 'lucide-react';

export default function FaqSection({ onToast }) {
  const [faqsList, setFaqsList] = useState(FAQS_DATA);
  const [openIndex, setOpenIndex] = useState(0);
  const [questionText, setQuestionText] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let isMounted = true;
    contentAPI.getFAQs()
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data?.faqs;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const formatted = fetched.map((f, idx) => ({
            id: f._id || `faq-${idx}`,
            q: f.question || f.q,
            a: f.answer || f.a,
          }));
          setFaqsList(formatted);
        }
      })
      .catch((err) => {
        console.warn('FAQs live fetch fallback to initial data:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleConciergeAsk = (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSent(true);
    setTimeout(() => {
      onToast("Your inquiry has been sent directly to the Chief Concierge Desk.");
      setQuestionText('');
      setSent(false);
    }, 1000);
  };

  return (
    <section id="faqs" className="py-14 px-4 sm:px-6 lg:px-8 bg-hotel-cream relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 text-hotel-gold-dark text-xs uppercase tracking-[0.3em] font-medium mb-2">
            <HelpCircle className="w-4 h-4 text-hotel-emerald" /> Guest Knowledge & Assistance
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-hotel-emerald-dark font-normal mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 text-sm font-light leading-relaxed">
            Find answers regarding private transfers, eco-certifications, suite amenities, and bespoke concierge services.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* FAQ Accordion List */}
          <div className="lg:col-span-7 space-y-3">
            {faqsList.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-serif text-lg text-hotel-emerald-dark font-medium hover:text-hotel-gold-dark transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-hotel-gold shrink-0 transition-transform duration-300 ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`} />
                </button>

                {openIndex === idx && (
                  <div className="px-5 pb-5 text-xs text-gray-600 font-light leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Concierge Direct Box */}
          <div className="lg:col-span-5 bg-hotel-emerald-dark text-white p-6 rounded-lg border border-hotel-gold/30 shadow-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-hotel-gold font-bold mb-2 block">
                24/7 Butler Desk
              </span>
              <h3 className="font-serif text-2xl font-normal text-white mb-3">
                Have a Unique Request?
              </h3>
              <p className="text-gray-300 text-xs font-light leading-relaxed mb-6">
                Our Head Concierge is available around the clock to assist with yacht charters, dietary preferences, or surprise arrangements.
              </p>

              {sent ? (
                <div className="p-4 rounded-2xl bg-hotel-gold/20 border border-hotel-gold text-hotel-gold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Inquiry sent to Concierge! We will respond within 15 minutes.</span>
                </div>
              ) : (
                <form onSubmit={handleConciergeAsk} className="space-y-3">
                  <textarea
                    rows={3}
                    required
                    placeholder="Ask our concierge anything about your upcoming stay..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl p-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-hotel-gold"
                  ></textarea>

                  <button
                    type="submit"
                    className="w-full bg-hotel-gold hover:bg-hotel-gold-light text-hotel-emerald-dark font-bold text-xs uppercase tracking-widest py-3 rounded-xl shadow-gold transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Inquiry to Concierge</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
