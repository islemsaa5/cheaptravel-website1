
import React from 'react';
import { Search, MapPin, Calendar, Plane, ShieldCheck, ArrowRight } from 'lucide-react';
import { AIRPORTS } from '../constants/airports';

interface HeroProps {
  onNavigate?: (page: any, params?: any) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [activeService, setActiveService] = React.useState('Billeterie');
  const [from, setFrom] = React.useState('ALG');
  const [to, setTo] = React.useState('PAR');

  const handleExplore = () => {
    if (!onNavigate) return;

    if (activeService === 'Billeterie') {
      onNavigate('billeterie', { from, to });
    } else if (activeService === 'E-Visa') {
      onNavigate('visa');
    } else if (activeService === 'Omrah') {
      onNavigate('omrah');
    } else {
      onNavigate('organised');
    }
  };

  return (
    <div className="relative min-h-[500px] md:h-[650px] flex items-center justify-center overflow-hidden py-12 md:py-0">
      {/* Dynamic Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-900/50 to-gray-50"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto w-full">
        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-[10px] md:text-xs font-bold mb-6 md:mb-8 animate-bounce-slow">
          <ShieldCheck size={14} className="text-orange-400" />
          <span>Accrédité IATA & Partenaire Visa Officiel</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 leading-tight font-poppins drop-shadow-lg">
          Voyagez sans <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Limites</span>
        </h1>
        <p className="text-base md:text-xl text-blue-50 mb-8 md:mb-12 max-w-2xl mx-auto font-medium drop-shadow leading-relaxed">
          Votre portail pour des Omrah premium, E-Visas rapides et billeterie mondiale aux meilleurs tarifs.
        </p>

        {/* Glassmorphism Search Bar */}
        <div className="bg-white/95 backdrop-blur-xl p-2 md:p-3 rounded-[32px] md:rounded-[40px] shadow-2xl max-w-5xl mx-auto border border-white/40">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-2 items-center">

            {/* Service Selection */}
            <div className="relative group px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100 last:border-0 text-left bg-gray-50/50 rounded-2xl md:rounded-none">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Service</label>
              <div className="flex items-center space-x-2">
                <Plane className="text-blue-500 w-4 h-4" />
                <select
                  value={activeService}
                  onChange={(e) => setActiveService(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-blue-900 font-bold appearance-none w-full text-sm md:text-base outline-none"
                >
                  <option>Billeterie</option>
                  <option>E-Visa</option>
                  <option>Omrah</option>
                  <option>Organisé</option>
                </select>
              </div>
            </div>

            {activeService === 'Billeterie' ? (
              <>
                <div className="relative group px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100 last:border-0 text-left cursor-pointer hover:bg-gray-50 rounded-2xl md:rounded-none transition-colors">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Décollage</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-orange-500 w-4 h-4" />
                    <select value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent border-none focus:outline-none text-gray-800 font-bold appearance-none w-full text-sm md:text-base outline-none">
                      {AIRPORTS.map(ap => <option key={ap.code} value={ap.code}>{ap.city} ({ap.code})</option>)}
                    </select>
                  </div>
                </div>
                <div className="relative group px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100 last:border-0 text-left cursor-pointer hover:bg-gray-50 rounded-2xl md:rounded-none transition-colors">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Destination</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-orange-500 w-4 h-4" />
                    <select value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent border-none focus:outline-none text-gray-800 font-bold appearance-none w-full text-sm md:text-base outline-none">
                      {AIRPORTS.map(ap => <option key={ap.code} value={ap.code}>{ap.city} ({ap.code})</option>)}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="md:col-span-2 relative group px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100 last:border-0 text-left cursor-pointer hover:bg-gray-50 rounded-2xl md:rounded-none transition-colors">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Destination</label>
                <div className="flex items-center space-x-2">
                  <MapPin className="text-orange-500 w-4 h-4" />
                  <input type="text" placeholder="Quelle destination ?" className="bg-transparent border-none focus:outline-none text-gray-800 font-bold placeholder:text-gray-300 w-full text-sm md:text-base outline-none" />
                </div>
              </div>
            )}

            <div className="relative group px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100 last:border-0 text-left cursor-pointer hover:bg-gray-50 rounded-2xl md:rounded-none transition-colors">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Voyageurs</label>
              <div className="flex items-center space-x-2">
                <Search className="text-gray-400 w-4 h-4" />
                <span className="text-gray-800 font-bold text-sm md:text-base">1 Adulte</span>
              </div>
            </div>

            <div className="p-1">
              <button
                onClick={handleExplore}
                className="w-full bg-blue-900 hover:bg-black text-white font-black h-12 md:h-16 rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center space-x-2 active:scale-95 text-xs uppercase tracking-widest"
              >
                <Search size={18} />
                <span>Chercher</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
