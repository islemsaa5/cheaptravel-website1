
import React, { useState } from 'react';
import { PlaneTakeoff, PlaneLanding, Calendar, Users, Search, ShieldCheck, RefreshCw, AlertTriangle, Radio, Plane, Clock, Info, ArrowLeftRight, MoveRight } from 'lucide-react';
import { flightApi, FlightOffer } from '../services/flightApiService';

interface BilleterieSearchProps {
  isB2B?: boolean;
  onFlightSelected: (offer: FlightOffer, finalPrice: number, airlineName: string, adultsCount: number) => void;
}

const BilleterieSearch: React.FC<BilleterieSearchProps> = ({ isB2B = false, onFlightSelected }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [carriers, setCarriers] = useState<Record<string, string>>({});
  const [tripType, setTripType] = useState<'ONE_WAY' | 'ROUND_TRIP'>('ROUND_TRIP');
  
  // Set default date to Tomorrow to avoid "Date in the past" GDS errors
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);

  const [searchParams, setSearchParams] = useState({
    from: 'ALG',
    to: 'PAR',
    date: tomorrow.toISOString().split('T')[0],
    returnDate: nextWeek.toISOString().split('T')[0],
    adults: 1
  });

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr.split('T')[0]);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const performRealSearch = async () => {
    // Basic validation
    const selectedDate = new Date(searchParams.date);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (selectedDate < today) {
       setError("La date de départ ne peut pas être dans le passé.");
       return;
    }

    setIsSearching(true);
    setError(null);
    setIsDemoMode(false);
    
    try {
      const response = await flightApi.searchFlights(
        searchParams.from,
        searchParams.to,
        searchParams.date,
        searchParams.adults,
        tripType === 'ROUND_TRIP' ? searchParams.returnDate : undefined
      );
      
      if (response.data && response.data.length > 0) {
        setOffers(response.data);
        if (response.dictionaries?.carriers) {
          setCarriers(response.dictionaries.carriers);
        }
      } else {
        throw new Error("Aucun vol trouvé pour ces dates.");
      }
    } catch (err: any) {
      // If GDS fails or date is still problematic for their specific timezone/rules
      setError(err.message || "Erreur de connexion GDS");
      setTimeout(() => {
        const mock = flightApi.getMockFlights(searchParams.from, searchParams.to, tripType === 'ROUND_TRIP');
        setOffers(mock.data);
        if (mock.dictionaries?.carriers) setCarriers(mock.dictionaries.carriers);
        setIsDemoMode(true);
        setError(null);
      }, 1500);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl border border-gray-100 relative overflow-hidden">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 text-red-600 animate-bounce">
            <AlertTriangle size={18} />
            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
          <div className="bg-gray-100 p-1.5 rounded-[24px] flex shadow-inner border border-gray-200/50 w-fit">
            <button 
              onClick={() => setTripType('ROUND_TRIP')}
              className={`flex items-center space-x-3 px-8 py-3.5 rounded-[20px] text-[11px] font-black uppercase transition-all tracking-widest ${tripType === 'ROUND_TRIP' ? 'bg-blue-900 shadow-xl text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ArrowLeftRight size={16} />
              <span>Aller-Retour</span>
            </button>
            <button 
              onClick={() => setTripType('ONE_WAY')}
              className={`flex items-center space-x-3 px-8 py-3.5 rounded-[20px] text-[11px] font-black uppercase transition-all tracking-widest ${tripType === 'ONE_WAY' ? 'bg-blue-900 shadow-xl text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <MoveRight size={16} />
              <span>Aller Simple</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="bg-blue-50 text-blue-900 px-5 py-3 rounded-2xl text-[10px] font-black flex items-center space-x-2 border border-blue-100">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>ACCÈS GDS IATA RÉEL</span>
             </div>
             {isB2B && (
               <div className="bg-orange-500 text-white px-5 py-3 rounded-2xl text-[10px] font-black flex items-center space-x-2 border border-orange-600">
                  <Radio size={14} className="animate-pulse" />
                  <span>SESSION B2B (+1000 DA)</span>
               </div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Décollage</label>
            <input 
              type="text" maxLength={3} value={searchParams.from}
              onChange={(e) => setSearchParams({...searchParams, from: e.target.value.toUpperCase()})}
              className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-900/10 focus:bg-white rounded-[24px] font-black text-blue-900 uppercase" placeholder="ALG"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Arrivée</label>
            <input 
              type="text" maxLength={3} value={searchParams.to}
              onChange={(e) => setSearchParams({...searchParams, to: e.target.value.toUpperCase()})}
              className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-orange-500/10 focus:bg-white rounded-[24px] font-black text-blue-900 uppercase" placeholder="PAR"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Date Départ</label>
            <input 
              type="date" value={searchParams.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
              className="w-full px-6 py-5 bg-gray-50 rounded-[24px] font-black text-blue-900" 
            />
          </div>

          <div className={`space-y-2 transition-all ${tripType === 'ROUND_TRIP' ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Date Retour</label>
            <input 
              type="date" value={searchParams.returnDate}
              min={searchParams.date}
              onChange={(e) => setSearchParams({...searchParams, returnDate: e.target.value})}
              disabled={tripType === 'ONE_WAY'}
              className="w-full px-6 py-5 bg-gray-50 border-orange-500/10 border rounded-[24px] font-black text-blue-900" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Voyageurs</label>
            <select 
              value={searchParams.adults}
              onChange={(e) => setSearchParams({...searchParams, adults: parseInt(e.target.value)})}
              className="w-full px-6 py-5 bg-gray-50 rounded-[24px] font-black text-blue-900 appearance-none"
            >
              <option value={1}>1 Adulte</option>
              <option value={2}>2 Adultes</option>
              <option value={3}>3 Adultes</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={performRealSearch}
              disabled={isSearching}
              className="w-full bg-blue-900 hover:bg-black text-white font-black py-5 rounded-[24px] transition-all flex items-center justify-center space-x-3 shadow-2xl shadow-blue-900/10 active:scale-95"
            >
              {isSearching ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
              <span className="uppercase text-[11px] tracking-widest">Chercher</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-8 pb-24">
        {isSearching && <div className="py-32 text-center animate-pulse"><Plane className="mx-auto text-blue-900/10 w-32 h-32 animate-bounce" /><p className="mt-10 font-black text-blue-900 uppercase tracking-[0.6em] text-sm">Synchronisation avec les serveurs aériens...</p></div>}

        {offers.map((offer) => {
          let basePrice = parseFloat(offer.price.total);
          if (offer.price.currency === 'EUR') basePrice = basePrice * 260; 
          const markup = isB2B ? 1000 : 3000;
          const finalPrice = Math.round(basePrice + markup);

          const airlineCode = offer.validatingAirlineCodes?.[0] || '??';
          const airlineName = carriers[airlineCode] || airlineCode;
          
          return (
            <div key={offer.id} className="bg-white rounded-[48px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group">
              <div className="p-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                <div className="flex-1 w-full space-y-10">
                  {offer.itineraries.map((itinerary, idx) => {
                    const firstSeg = itinerary.segments[0];
                    const lastSeg = itinerary.segments[itinerary.segments.length - 1];
                    const depAt = firstSeg?.departure?.at || '';
                    const depTime = depAt.split('T')[1]?.slice(0,5);
                    const arrTime = lastSeg?.arrival?.at?.split('T')[1]?.slice(0,5);
                    const isReturn = idx === 1;

                    return (
                      <div key={idx} className={`flex flex-col md:flex-row items-center gap-10 ${isReturn ? 'pt-8 border-t border-gray-100' : ''}`}>
                         <div className="flex flex-col items-center space-y-3 min-w-[140px]">
                           <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-3 border border-gray-100">
                              <img src={`https://logos.skyscnr.com/images/airlines/favicon/${airlineCode}.png`} className="w-full h-full object-contain" alt={airlineName} />
                           </div>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isReturn ? 'Vol Retour' : 'Vol Aller'}</span>
                         </div>

                         <div className="flex-1 grid grid-cols-3 items-center gap-6 w-full text-center md:text-left">
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{formatDateLabel(depAt)}</p>
                               <h4 className="text-3xl font-black text-blue-900 tracking-tighter">{isReturn ? searchParams.to : searchParams.from}</h4>
                               <p className="text-sm font-black text-gray-500 mt-1">{depTime}</p>
                            </div>
                            <div className="flex flex-col items-center">
                               <div className="w-full h-px bg-gray-100 relative mb-4">
                                  <Plane size={18} className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 bg-white px-1 ${isReturn ? 'rotate-180' : ''}`} />
                                </div>
                                <span className="text-[9px] font-black text-gray-300 uppercase">{itinerary.segments.length > 1 ? `${itinerary.segments.length-1} Escale` : 'Direct'}</span>
                            </div>
                            <div className="text-center md:text-right">
                               <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Arrivée</p>
                               <h4 className="text-3xl font-black text-blue-900 tracking-tighter">{isReturn ? searchParams.from : searchParams.to}</h4>
                               <p className="text-sm font-black text-gray-500 mt-1">{arrTime}</p>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                </div>

                <div className="w-full lg:w-80 text-center lg:text-right shrink-0">
                  <div className={`flex items-center justify-center lg:justify-end space-x-2 mb-3 ${isB2B ? 'text-orange-500' : 'text-green-500'}`}>
                    <Radio size={12} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isB2B ? 'Tarif Agence B2B' : 'Prix Net Garanti'}</span>
                  </div>
                  <p className="text-5xl font-black text-blue-900 tracking-tighter">{finalPrice.toLocaleString()} <span className="text-lg">DA</span></p>
                  <button 
                    onClick={() => onFlightSelected(offer, finalPrice, airlineName, searchParams.adults)}
                    className={`mt-10 w-full text-white px-10 py-6 rounded-[28px] font-black transition-all text-xs shadow-2xl uppercase tracking-[0.3em] active:scale-95 ${isB2B ? 'bg-orange-500 hover:bg-black' : 'bg-blue-900 hover:bg-orange-600'}`}
                  >
                    Acheter le billet
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BilleterieSearch;
