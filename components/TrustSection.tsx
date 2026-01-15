
import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

const TrustSection: React.FC = () => {
  const partners = [
    "Air Algérie", "Qatar Airways", "Turkish Airlines", "Emirates", "Saudia"
  ];

  const testimonials = [
    { name: "Ahmed K.", comment: "Service Omrah exceptionnel. L'hôtel était exactement comme décrit, à 2 mins du Haram.", rating: 5, loc: "Alger" },
    { name: "Sarah B.", comment: "E-Visa Turquie reçu en moins de 24h. Simple et efficace.", rating: 5, loc: "Oran" },
    { name: "Karim L.", comment: "Meilleurs tarifs pour les vols vers Paris. Je recommande vivement.", rating: 4, loc: "Constantine" }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Partners */}
        <div className="text-center mb-16">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8">Nos Partenaires Officiels</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {partners.map(p => (
              <span key={p} className="text-xl font-black text-blue-900 italic tracking-tighter uppercase">{p}</span>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 relative group hover:bg-blue-900 transition-all duration-500">
              <Quote className="absolute top-8 right-8 text-blue-100 group-hover:text-blue-800 transition-colors" size={40} />
              <div className="flex space-x-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-gray-600 group-hover:text-blue-100 text-sm leading-relaxed mb-8 italic font-medium">"{t.comment}"</p>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-900 font-black text-xs shadow-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-blue-900 group-hover:text-white">{t.name}</p>
                  <p className="text-[10px] text-gray-400 group-hover:text-blue-300 uppercase tracking-widest">{t.loc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-24 flex flex-col md:flex-row items-center justify-center gap-12 border-t border-gray-100 pt-16">
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 /></div>
              <div><p className="text-xs font-black text-blue-900 uppercase">Agrément n°1234/2024</p><p className="text-[10px] text-gray-400 font-bold uppercase">Ministère du Tourisme</p></div>
           </div>
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><CheckCircle2 /></div>
              <div><p className="text-xs font-black text-blue-900 uppercase">Accréditation IATA</p><p className="text-[10px] text-gray-400 font-bold uppercase">Global Ticketing Standards</p></div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
