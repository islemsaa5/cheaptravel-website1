
import React from 'react';
import { TravelPackage } from '../types';
import { Check, X, Calendar, MapPin, Hotel, Plane, ShieldCheck, ChevronRight } from 'lucide-react';

interface PackageDetailsProps {
  pkg: TravelPackage;
  onBook: () => void;
  onClose: () => void;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({ pkg, onBook, onClose }) => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-[60px] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500 max-h-[90vh]">
        
        {/* Left: Image & Quick Info */}
        <div className="md:w-2/5 relative">
          <img src={pkg.image} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-transparent to-transparent"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
             <span className="bg-orange-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{pkg.type.replace('_', ' ')}</span>
             <h2 className="text-4xl font-black tracking-tighter mb-2">{pkg.title}</h2>
             <p className="text-blue-100/60 text-sm font-medium">{pkg.duration}</p>
          </div>
          <button onClick={onClose} className="absolute top-8 left-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all">
            <ChevronRight className="rotate-180" size={24} />
          </button>
        </div>

        {/* Right: Detailed Tabs */}
        <div className="md:w-3/5 p-12 overflow-y-auto custom-scrollbar bg-gray-50/30">
          <div className="space-y-12">
            
            {/* Itinerary */}
            <div>
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-[0.3em] mb-8 border-l-4 border-orange-500 pl-4">Programme du Séjour</h3>
              <div className="space-y-8">
                {(pkg.itinerary || [
                  { day: 1, title: "Arrivée et Installation", description: "Accueil à l'aéroport et transfert vers votre hôtel premium." },
                  { day: 2, title: "Visite Guidée", description: "Découverte des sites historiques majeurs avec notre guide expert." },
                  { day: 3, title: "Journée Libre", description: "Temps personnel pour le shopping ou la détente." }
                ]).map((item, i) => (
                  <div key={i} className="flex space-x-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center font-black text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-all">{item.day}</div>
                      <div className="w-px h-full bg-gray-200 my-2"></div>
                    </div>
                    <div>
                      <h4 className="font-black text-blue-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions / Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-6">Inclus dans le prix</h4>
                <ul className="space-y-4">
                  {(pkg.inclusions || ["Billet d'avion A/R", "Hébergement 4★/5★", "Transferts privés", "Assurance Voyage"]).map((inc, i) => (
                    <li key={i} className="flex items-center space-x-3 text-sm font-bold text-gray-600">
                      <div className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><Check size={12} /></div>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-6">Non Inclus</h4>
                <ul className="space-y-4">
                  {(pkg.exclusions || ["Dépenses personnelles", "Pourboires", "Repas non mentionnés"]).map((exc, i) => (
                    <li key={i} className="flex items-center space-x-3 text-sm font-bold text-gray-400">
                      <div className="w-5 h-5 bg-red-50 text-red-400 rounded-full flex items-center justify-center"><X size={12} /></div>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Final Call to Action */}
            <div className="pt-12 border-t border-gray-100 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total à partir de</p>
                  <p className="text-4xl font-black text-blue-900">{(pkg.priceAdult || pkg.price).toLocaleString()} <span className="text-lg">DA</span></p>
               </div>
               <button onClick={onBook} className="bg-orange-500 text-white px-12 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-95">
                  Réserver Maintenant
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;
