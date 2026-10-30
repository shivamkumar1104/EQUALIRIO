import React from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Award, Compass, CheckCircle2 } from 'lucide-react';

export default function About() {
  const { t } = useTranslation();

  const stats = [
    { label: t('about.stat1Label'), value: t('about.stat1Number'), sub: 'Eco Reserve' },
    { label: t('about.stat2Label'), value: t('about.stat2Number'), sub: 'Sanctuary Coast' },
    { label: t('about.stat3Label'), value: t('about.stat3Number'), sub: 'Carbon Neutral' },
    { label: t('about.stat4Label'), value: t('about.stat4Number'), sub: 'Culinary Masters' },
  ];

  const highlights = [
    "Hand-crafted teak wood and sustainable local stone architecture",
    "Private overwater infinity pools with temperature stabilization",
    "Custom Michelin-starred sea-to-table culinary experiences",
    "Holistic hydrotherapy spa using indigenous botanicals",
    "Private helipad landing & VIP charter yacht transfers"
  ];

  return (
    <section id="about" className="py-14 px-4 sm:px-6 lg:px-8 bg-hotel-cream relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Text Content */}
          <div className="lg:col-span-6 flex flex-col items-start">
            
            <div className="inline-flex items-center gap-2 text-hotel-gold-dark font-mono text-xs uppercase tracking-[0.25em] mb-3">
              <Leaf className="w-4 h-4 text-hotel-emerald" />
              <span>{t('about.subtitle')}</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif text-hotel-emerald-dark font-normal leading-tight mb-6">
              {t('about.title')}
            </h2>

            <p className="text-gray-700 text-base leading-relaxed mb-6 font-light">
              {t('about.p1')}
            </p>

            <p className="text-gray-600 text-sm leading-relaxed mb-8 font-light">
              {t('about.p2')}
            </p>

            {/* Checklist */}
            <div className="space-y-3 mb-10 w-full">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-hotel-emerald-dark font-medium">
                  <CheckCircle2 className="w-5 h-5 text-hotel-gold shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <a
                href="#suites"
                className="inline-flex items-center gap-2 bg-hotel-emerald text-white px-7 py-3.5 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-hotel-emerald-light transition-all shadow-luxury"
              >
                <Compass className="w-4 h-4 text-hotel-gold" />
                <span>{t('nav.suites')}</span>
              </a>
              <div className="hidden sm:flex flex-col border-l border-gray-300 pl-4">
                <span className="font-serif text-xl text-hotel-emerald font-bold">Alexandre Vane</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Founder & Master Architect</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Collage */}
          <div className="lg:col-span-6 relative">
            
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Image */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80"
                  alt="Equalirio Villa View"
                  className="w-full h-[440px] object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Sub Image */}
              <div className="absolute -bottom-8 -left-8 z-20 w-48 sm:w-64 rounded-xl overflow-hidden shadow-2xl border-4 border-white hidden sm:block">
                <img
                  src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80"
                  alt="Equalirio Spa Experience"
                  className="w-full h-40 object-cover"
                />
              </div>

              {/* Floating Award Badge */}
              <div className="absolute -top-6 -right-6 z-20 bg-hotel-emerald-dark text-white p-5 rounded-2xl shadow-2xl border border-hotel-gold/30 flex flex-col items-center text-center">
                <Award className="w-8 h-8 text-hotel-gold mb-1" />
                <span className="text-2xl font-serif font-bold text-hotel-gold-light">5 Stars</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-300">Forbes Travel Guide</span>
              </div>

            </div>

          </div>

        </div>

        {/* Stats Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 bg-hotel-emerald-dark text-white p-8 sm:p-12 rounded-3xl border border-hotel-gold/20 shadow-luxury">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-2 border-r border-white/10 last:border-r-0">
              <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-hotel-gold mb-1">
                {stat.value}
              </span>
              <span className="text-xs uppercase tracking-widest font-semibold text-white mb-1">
                {stat.label}
              </span>
              <span className="text-[11px] text-gray-400 font-light">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
