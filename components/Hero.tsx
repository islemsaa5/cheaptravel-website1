
import React from 'react';
import { Search, MapPin, Calendar, Plane, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onNavigate?: (page: any) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <div className="relative h-[650px] flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-900/40 to-gray-50"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-xs font-bold mb-8 animate-bounce-slow">
          <ShieldCheck size={14} className="text-orange-400" />
          <span>Accrédité IATA & Partenaire Visa Officiel</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight font-poppins drop-shadow-lg">
          Voyagez sans <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Limites</span>
        </h1>
        <p className="text-lg md:text-xl text-blue-50 mb-12 max-w-2xl mx-auto font-medium drop-shadow">
          Votre portail pour des Omrah premium, E-Visas rapides et billeterie mondiale aux meilleurs tarifs agence.
        </p>

        {/* Glassmorphism Search Bar */}
        <div className="bg-white/90 backdrop-blur-xl p-2 md:p-3 rounded-[32px] shadow-2xl max-w-4xl mx-auto border border-white/40">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
            <div className="relative group px-4 py-3 border-r border-gray-100 last:border-0 text-left cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Destination</label>
              <div className="flex items-center space-x-2">
                <MapPin className="text-orange-500 w-4 h-4" />
                <input type="text" placeholder="Quelle destination ?" className="bg-transparent border-none focus:outline-none text-gray-800 font-bold placeholder:text-gray-300 w-full" />
              </div>
            </div>
            <div className="relative group px-4 py-3 border-r border-gray-100 last:border-0 text-left cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Service</label>
              <div className="flex items-center space-x-2">
                <Plane className="text-blue-500 w-4 h-4" />
                <select className="bg-transparent border-none focus:outline-none text-gray-800 font-bold appearance-none w-full">
                  <option>Billeterie</option>
                  <option>E-Visa</option>
                  <option>Omrah</option>
                  <option>Voyage Organisé</option>
                </select>
              </div>
            </div>
            <div className="relative group px-4 py-3 border-r border-gray-100 last:border-0 text-left cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Voyageurs</label>
              <div className="flex items-center space-x-2">
                <Search className="text-gray-400 w-4 h-4" />
                <span className="text-gray-800 font-bold">1 Adulte, Économie</span>
              </div>
            </div>
            <div className="p-1">
              <button 
                onClick={() => onNavigate && onNavigate('organised')}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold h-14 rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center space-x-2 active:scale-95"
              >
                <Search size={20} />
                <span>Explorer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
