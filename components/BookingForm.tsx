
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, CreditCard, Upload, Camera, 
  FileCheck, ChevronRight, Plane, Plus, Minus, Users, ShieldCheck, 
  Trash2, Fingerprint, Map as MapIcon, AlertTriangle, MoveRight, 
  Landmark, Wallet, CheckCircle2, QrCode, Lock, ChevronLeft, CreditCard as CardIcon,
  // Added missing Building2 import
  Building2
} from 'lucide-react';
import PassportScanner from './PassportScanner';
import { ServiceType, Booking, Traveler, PaymentMethod } from '../types';

interface BookingFormProps {
  initialService?: ServiceType;
  packageName?: string;
  packageId?: string;
  initialBasePrice?: number;
  priceAdult?: number;
  priceChild?: number;
  priceBaby?: number;
  availableStock?: number;
  onSuccess: (booking: Partial<Booking>) => void;
  initialAdults?: number; 
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  initialService = 'BILLETERIE', 
  packageName, 
  packageId,
  initialBasePrice = 0, 
  priceAdult,
  priceChild,
  priceBaby,
  availableStock = 999,
  onSuccess,
  initialAdults = 1
}) => {
  // Step logic: Skip passenger count if it's a flight (BILLETERIE)
  const [step, setStep] = useState(initialService === 'BILLETERIE' ? 2 : 1);
  const [showScanner, setShowScanner] = useState(false);
  const [activeScannerIndex, setActiveScannerIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [travelerCounts, setTravelerCounts] = useState({
    adults: initialAdults,
    children: 0,
    babies: 0
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CIB_EDAHABIA');
  const [paymentProof, setPaymentProof] = useState<string | undefined>();
  
  // Card Payment Simulation States
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const totalTravelersCount = useMemo(() => {
    return travelerCounts.adults + travelerCounts.children + travelerCounts.babies;
  }, [travelerCounts]);

  const [contactData, setContactData] = useState({
    email: '',
    phone: '',
    address: ''
  });

  const [travelerDetails, setTravelerDetails] = useState<Traveler[]>([]);

  // Synchronize passenger forms with the counts
  useEffect(() => {
    const currentDetails = [...travelerDetails];
    const newDetails: Traveler[] = [];
    
    for(let i = 0; i < travelerCounts.adults; i++) {
      newDetails.push(currentDetails.find((t, idx) => t.type === 'ADULT' && idx === i) || {
        type: 'ADULT', firstName: '', lastName: '', dateOfBirth: '', passportNumber: ''
      });
    }
    for(let i = 0; i < travelerCounts.children; i++) {
      newDetails.push(currentDetails.find((t, idx) => t.type === 'CHILD') || {
        type: 'CHILD', firstName: '', lastName: '', dateOfBirth: '', passportNumber: ''
      });
    }
    for(let i = 0; i < travelerCounts.babies; i++) {
      newDetails.push(currentDetails.find((t, idx) => t.type === 'BABY') || {
        type: 'BABY', firstName: '', lastName: '', dateOfBirth: '', passportNumber: ''
      });
    }
    setTravelerDetails(newDetails);
  }, [travelerCounts]);

  const totalPrice = useMemo(() => {
    const actualPriceAdult = priceAdult || initialBasePrice;
    const actualPriceChild = priceChild || (actualPriceAdult * 0.7);
    const actualPriceBaby = priceBaby || (actualPriceAdult * 0.3);

    return Math.round(
      (travelerCounts.adults * actualPriceAdult) + 
      (travelerCounts.children * actualPriceChild) + 
      (travelerCounts.babies * actualPriceBaby)
    );
  }, [travelerCounts, initialBasePrice, priceAdult, priceChild, priceBaby]);

  const handlePassportCapture = (data: string) => {
    if (activeScannerIndex !== null) {
      const updated = [...travelerDetails];
      updated[activeScannerIndex] = { ...updated[activeScannerIndex], passportImage: data };
      setTravelerDetails(updated);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPaymentProof(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBooking: Partial<Booking> = {
      customerName: `${travelerDetails[0]?.firstName || 'Client'} ${travelerDetails[0]?.lastName || 'Travel'}`,
      service: initialService as ServiceType,
      packageId: packageId,
      amount: totalPrice,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      contact: contactData.phone || contactData.email,
      address: contactData.address,
      travelers: travelerDetails,
      paymentMethod,
      paymentProof
    };

    onSuccess(newBooking);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      {/* Dynamic Header */}
      <div className="bg-blue-900 p-8 text-white flex flex-col md:flex-row items-center justify-between border-b border-white/10">
         <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
               <Plane size={24} className="text-orange-500" />
            </div>
            <div>
               <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Dossier de Réservation</p>
               <h3 className="text-xl font-black tracking-tight">{packageName || initialService}</h3>
               <p className="text-[10px] font-bold text-orange-400 uppercase mt-1">
                 {totalTravelersCount} Voyageur(s) sélectionné(s)
               </p>
            </div>
         </div>
         <div className="mt-4 md:mt-0 text-right">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Montant Total Net</p>
            <p className="text-3xl font-black text-orange-500">{totalPrice.toLocaleString()} DA</p>
         </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-gray-50 p-8 border-b border-gray-100">
        <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-sm ${step >= s ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {s}
              </div>
              {s < 4 && <div className={`w-12 md:w-20 h-1 mx-2 rounded-full ${step > s ? 'bg-blue-900' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] max-w-lg mx-auto text-center px-2">
          <span>{initialService === 'BILLETERIE' ? 'Vérifié' : 'Passagers'}</span>
          <span>Identités</span>
          <span>Paiement</span>
          <span>Confirmation</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12">
        {/* STEP 1: Traveler Confirmation (Only for non-ticketing services) */}
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h3 className="text-3xl font-black text-blue-900 mb-2">Confirmation Passagers</h3>
              <p className="text-gray-400 text-sm font-medium">Vérifiez la composition du voyage avant de continuer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { type: 'adults', label: 'Adulte', icon: Users, count: travelerCounts.adults },
                { type: 'children', label: 'Enfant', icon: User, count: travelerCounts.children },
                { type: 'babies', label: 'Bébé', icon: User, count: travelerCounts.babies }
              ].map((cat) => (
                <div key={cat.type} className="bg-white p-8 rounded-[32px] border border-gray-100 flex flex-col items-center space-y-4 shadow-sm">
                  <div className="p-4 bg-gray-50 text-blue-900 rounded-2xl"><cat.icon size={24} /></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cat.label}</span>
                  <div className="flex items-center space-x-6">
                    <button type="button" onClick={() => setTravelerCounts(prev => ({...prev, [cat.type]: Math.max(cat.type === 'adults' ? 1 : 0, prev[cat.type as keyof typeof travelerCounts] - 1)}))} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-blue-900 hover:bg-red-50 transition-colors"><Minus size={18} /></button>
                    <span className="text-2xl font-black text-blue-900">{cat.count}</span>
                    <button type="button" onClick={() => setTravelerCounts(prev => ({...prev, [cat.type]: prev[cat.type as keyof typeof travelerCounts] + 1}))} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-blue-900 hover:bg-blue-900 hover:text-white transition-colors"><Plus size={18} /></button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setStep(2)} className="w-full bg-blue-900 text-white font-black py-6 rounded-[28px] shadow-2xl shadow-blue-900/20 uppercase tracking-widest text-xs">Continuer vers les Identités</button>
          </div>
        )}

        {/* STEP 2: Identités & Passeports */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-blue-900 mb-2">Identités & Passeports</h3>
              <p className="text-gray-400 text-sm font-medium">Informations obligatoires pour l'émission des titres</p>
            </div>

            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {travelerDetails.map((t, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black bg-blue-50 text-blue-900 px-3 py-1 rounded-full uppercase">{t.type} #{idx + 1}</span>
                     <button type="button" onClick={() => { setActiveScannerIndex(idx); setShowScanner(true); }} className="flex items-center space-x-2 text-[9px] font-black text-orange-500 uppercase tracking-widest"><Camera size={14} /><span>Scanner Passeport</span></button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input required type="text" placeholder="Prénom" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-blue-900" value={t.firstName} onChange={e => { const up = [...travelerDetails]; up[idx].firstName = e.target.value; setTravelerDetails(up); }} />
                      <input required type="text" placeholder="Nom" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-blue-900" value={t.lastName} onChange={e => { const up = [...travelerDetails]; up[idx].lastName = e.target.value; setTravelerDetails(up); }} />
                      <input required type="date" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-blue-900" value={t.dateOfBirth} onChange={e => { const up = [...travelerDetails]; up[idx].dateOfBirth = e.target.value; setTravelerDetails(up); }} />
                      <input required type="text" placeholder="N° Passeport" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-blue-900" value={t.passportNumber} onChange={e => { const up = [...travelerDetails]; up[idx].passportNumber = e.target.value; setTravelerDetails(up); }} />
                   </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-8 rounded-[32px] grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required type="email" placeholder="Email Contact" className="w-full bg-white border-none rounded-2xl px-6 py-4 font-bold text-blue-900 shadow-sm" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} />
              <input required type="tel" placeholder="Téléphone" className="w-full bg-white border-none rounded-2xl px-6 py-4 font-bold text-blue-900 shadow-sm" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} />
            </div>

            <div className="flex gap-4">
              {initialService !== 'BILLETERIE' && (
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-2xl uppercase tracking-widest text-[10px]">Précédent</button>
              )}
              <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-blue-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-[10px]">Passer au Paiement</button>
            </div>
          </div>
        )}

        {/* STEP 3: Paiement */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h3 className="text-3xl font-black text-blue-900 mb-2">Mode de Paiement</h3>
              <p className="text-gray-400 text-sm font-medium">Sélectionnez votre méthode de règlement sécurisée</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <button type="button" onClick={() => setPaymentMethod('CIB_EDAHABIA')} className={`p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${paymentMethod === 'CIB_EDAHABIA' ? 'border-blue-900 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}>
                  <CreditCard className={`mb-4 ${paymentMethod === 'CIB_EDAHABIA' ? 'text-blue-900' : 'text-gray-400'}`} size={32} />
                  <h4 className="font-black text-blue-900 text-sm">CIB / EDAHABIA</h4>
                  <p className="text-[9px] text-gray-500 font-medium mt-1 uppercase tracking-tighter">Paiement Instantané</p>
                  {paymentMethod === 'CIB_EDAHABIA' && <CheckCircle2 className="absolute top-4 right-4 text-blue-900" size={18} />}
               </button>

               <button type="button" onClick={() => setPaymentMethod('BARIDIMOB_CCP')} className={`p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${paymentMethod === 'BARIDIMOB_CCP' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-orange-200'}`}>
                  <Landmark className={`mb-4 ${paymentMethod === 'BARIDIMOB_CCP' ? 'text-orange-500' : 'text-gray-400'}`} size={32} />
                  <h4 className="font-black text-blue-900 text-sm">BARIDIMOB / CCP</h4>
                  <p className="text-[9px] text-gray-500 font-medium mt-1 uppercase tracking-tighter">Transfert RIP</p>
                  {paymentMethod === 'BARIDIMOB_CCP' && <CheckCircle2 className="absolute top-4 right-4 text-orange-500" size={18} />}
               </button>

               <button type="button" onClick={() => setPaymentMethod('CASH_AGENCY')} className={`p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${paymentMethod === 'CASH_AGENCY' ? 'border-green-600 bg-green-50/50' : 'border-gray-100 hover:border-green-200'}`}>
                  <Wallet className={`mb-4 ${paymentMethod === 'CASH_AGENCY' ? 'text-green-600' : 'text-gray-400'}`} size={32} />
                  <h4 className="font-black text-blue-900 text-sm">EN AGENCE</h4>
                  <p className="text-[9px] text-gray-500 font-medium mt-1 uppercase tracking-tighter">Paiement sur place</p>
                  {paymentMethod === 'CASH_AGENCY' && <CheckCircle2 className="absolute top-4 right-4 text-green-600" size={18} />}
               </button>
            </div>

            {/* CIB / EDAHABIA Card Interface */}
            {paymentMethod === 'CIB_EDAHABIA' && (
              <div className="bg-[#0a0c10] p-10 rounded-[48px] text-white space-y-8 animate-in slide-in-from-top-4 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <ShieldCheck size={200} />
                </div>
                
                <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                   {/* Virtual Card UI */}
                   <div className="w-80 h-48 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative group overflow-hidden border border-white/20">
                      <div className="flex justify-between items-start">
                         <div className="w-12 h-10 bg-yellow-400/80 rounded-lg flex items-center justify-center">
                            <div className="w-8 h-6 border border-black/10 rounded flex items-center justify-center"><div className="w-full h-[1px] bg-black/20"></div></div>
                         </div>
                         <CardIcon className="text-white/40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-mono tracking-[0.2em]">{cardData.number || '•••• •••• •••• ••••'}</p>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[8px] uppercase tracking-widest opacity-60">Card Holder</p>
                              <p className="text-xs font-black uppercase tracking-widest">{cardData.name || 'NOM DU TITULAIRE'}</p>
                           </div>
                           <div>
                              <p className="text-[8px] uppercase tracking-widest opacity-60">Expires</p>
                              <p className="text-xs font-black uppercase tracking-widest">{cardData.expiry || 'MM/YY'}</p>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Card Inputs */}
                   <div className="flex-1 w-full space-y-4">
                      <div className="relative">
                        <input type="text" placeholder="Numéro de Carte" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-all" maxLength={19} value={cardData.number} onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
                          setCardData({...cardData, number: formatted});
                        }} />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest border border-blue-400/30 px-2 py-0.5 rounded">CIB</span>
                        </div>
                      </div>
                      <input type="text" placeholder="NOM DU TITULAIRE" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white placeholder:text-gray-600 uppercase focus:outline-none focus:border-blue-500 transition-all" value={cardData.name} onChange={e => setCardData({...cardData, name: e.target.value.toUpperCase()})} />
                      <div className="grid grid-cols-2 gap-4">
                         <input type="text" placeholder="MM/YY" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-all" maxLength={5} value={cardData.expiry} onChange={e => {
                           let val = e.target.value.replace(/\D/g, '');
                           if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2,4);
                           setCardData({...cardData, expiry: val});
                         }} />
                         <input type="password" placeholder="CVV" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-all" maxLength={3} value={cardData.cvv} onChange={e => setCardData({...cardData, cvv: e.target.value})} />
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center space-x-2">
                        <Lock size={12} />
                        <span>Chiffrement SSL 256-bit sécurisé</span>
                      </p>
                   </div>
                </div>
              </div>
            )}

            {paymentMethod === 'BARIDIMOB_CCP' && (
              <div className="bg-orange-50 p-8 rounded-[32px] border border-orange-100 space-y-6 animate-in slide-in-from-top-4">
                 <div className="flex flex-col md:flex-row md:items-start gap-8">
                    <div className="p-4 bg-white rounded-2xl shadow-sm w-fit"><QrCode className="text-orange-500" size={80} /></div>
                    <div className="flex-1 space-y-4">
                       <div>
                          <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">Coordonnées RIP pour Virement</p>
                          <p className="text-sm font-black text-blue-900 uppercase">SARL CHEAP TRAVEL ALGERIE</p>
                          <p className="text-2xl font-black text-blue-900 tracking-wider">007 999 990 001 234 567 89</p>
                       </div>
                       <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-orange-200 bg-white rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-100 transition-all group">
                          {paymentProof ? (
                             <div className="flex items-center space-x-3 text-green-600 animate-in zoom-in-95">
                               <CheckCircle2 size={24} />
                               <span className="text-xs font-black uppercase tracking-widest">Preuve Téléchargée</span>
                             </div>
                          ) : (
                             <>
                               <Upload className="text-orange-300 mb-2 group-hover:scale-110 transition-transform" size={32} />
                               <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Cliquer pour joindre le reçu</span>
                               <p className="text-[8px] text-gray-400 mt-1 uppercase">Format: JPG, PNG, PDF</p>
                             </>
                          )}
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleProofUpload} />
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {paymentMethod === 'CASH_AGENCY' && (
              <div className="bg-green-50 p-10 rounded-[48px] border border-green-100 space-y-8 animate-in slide-in-from-top-4">
                 <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-green-600 shadow-sm">
                      <Building2 className="w-10 h-10" />
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-blue-900 tracking-tight">Paiement au Guichet</h4>
                       <p className="text-green-700 text-xs font-bold uppercase tracking-widest mt-1">Établissez votre règlement sous 24h</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div className="bg-white/50 p-6 rounded-3xl border border-white">
                       <div className="flex items-center space-x-3 text-blue-900 font-black mb-3 uppercase tracking-widest text-[10px]">
                          <MapIcon size={16} className="text-orange-500" />
                          <span>Adresse du Siège</span>
                       </div>
                       <p className="text-gray-600 font-bold leading-relaxed">Lot 142 Bis, Route de Ouled Fayet, Cheraga, Alger, Algérie</p>
                    </div>
                    <div className="bg-white/50 p-6 rounded-3xl border border-white">
                       <div className="flex items-center space-x-3 text-blue-900 font-black mb-3 uppercase tracking-widest text-[10px]">
                          <Calendar size={16} className="text-blue-500" />
                          <span>Horaires d'Ouverture</span>
                       </div>
                       <p className="text-gray-600 font-bold leading-relaxed">Samedi - Jeudi : 08:30 - 17:00<br/>Vendredi : Fermé</p>
                    </div>
                 </div>
                 <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl border border-green-200">
                    <AlertTriangle className="text-orange-500 shrink-0" size={18} />
                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">Veuillez noter que votre réservation ne sera émise et confirmée qu'après réception effective du règlement à notre bureau.</p>
                 </div>
              </div>
            )}

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] transition-all hover:bg-gray-200">Précédent</button>
              <button type="button" onClick={() => setStep(4)} className={`flex-[2] font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl transition-all ${paymentMethod === 'CIB_EDAHABIA' ? 'bg-blue-900 text-white shadow-blue-900/20' : paymentMethod === 'BARIDIMOB_CCP' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-green-600 text-white shadow-green-600/20'}`}>Récapitulatif Final</button>
            </div>
          </div>
        )}

        {/* STEP 4: Résumé Final */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h3 className="text-3xl font-black text-blue-900 mb-2">Dossier Finalisé</h3>
              <p className="text-gray-400 text-sm font-medium">Vérifiez toutes les informations avant l'émission des titres</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-[48px] overflow-hidden shadow-sm">
               <div className="p-8 bg-blue-900 text-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Prestation</p>
                    <h4 className="text-xl font-black">{packageName || initialService}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Mode de Règlement</p>
                    <p className="font-black text-sm uppercase tracking-widest">{paymentMethod.replace('_', ' ')}</p>
                  </div>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                     <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Liste des Passagers</span>
                     <span className="text-[11px] font-black text-blue-900 uppercase">{totalTravelersCount} Voyageur(s)</span>
                  </div>
                  {travelerDetails.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-blue-900 font-black text-xs">{idx + 1}</div>
                          <div>
                            <p className="text-sm font-black text-blue-900 uppercase tracking-tighter">{t.firstName} {t.lastName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Passeport: {t.passportNumber}</p>
                          </div>
                       </div>
                       <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${t.type === 'ADULT' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{t.type}</span>
                    </div>
                  ))}
               </div>

               <div className="p-10 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Montant Total de la Commande</span>
                    <span className="text-4xl font-black text-orange-500">{totalPrice.toLocaleString()} DA</span>
                  </div>
                  <button type="submit" className="bg-blue-900 text-white font-black px-12 py-6 rounded-[32px] hover:bg-black transition-all shadow-2xl shadow-blue-900/30 flex items-center space-x-4 group uppercase tracking-[0.4em] text-[10px] w-full md:w-auto">
                    <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                    <span>Confirmer la Réservation</span>
                  </button>
               </div>
            </div>

            <button type="button" onClick={() => setStep(3)} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-900 transition-colors">Modifier le mode de paiement</button>
          </div>
        )}
      </form>

      {showScanner && (
        <PassportScanner onCapture={handlePassportCapture} onClose={() => { setShowScanner(false); setActiveScannerIndex(null); }} />
      )}
    </div>
  );
};

export default BookingForm;
