
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import TrustSection from './components/TrustSection';
import ClientSpace from './components/ClientSpace';
import AgencySpace from './components/AgencySpace';
import AdminPanel from './components/AdminPanel';
import BookingForm from './components/BookingForm';
import BilleterieSearch from './components/BilleterieSearch';
import AuthOverlay from './components/AuthOverlay';
import AIChat from './components/AIChat';
import Voucher from './components/Voucher';
import PackageDetails from './components/PackageDetails';
import { AppSpace, ServiceType, User, Booking, TravelPackage } from './types';
import { dbService } from './services/dbService';
import { WHATSAPP_LINK, formatWhatsAppMessage } from './constants';
import { 
  Plane, Star, ArrowRight, MessageCircle, Moon, CheckCircle, Globe, ShieldCheck, 
  Phone, MapPin, X, Ticket, Users, Send, Bot, Loader2, FileCheck, Zap, 
  Sparkles, Edit, Trash2, Plus, ShieldAlert, LogOut, MessageSquare, Flame, Briefcase
} from 'lucide-react';

type PageID = 'home' | 'billeterie' | 'visa' | 'omrah' | 'organised' | 'booking' | 'profile' | 'admin';

const App: React.FC = () => {
  const [currentSpace, setCurrentSpace] = useState<AppSpace>(AppSpace.CLIENT);
  const [activePage, setActivePage] = useState<PageID>('home');
  const [selectedService, setSelectedService] = useState<ServiceType | undefined>();
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | undefined>();
  const [viewingPackage, setViewingPackage] = useState<TravelPackage | undefined>();
  const [basePrice, setBasePrice] = useState<number>(0);
  const [initialAdults, setInitialAdults] = useState<number>(1);
  
  // DATA STATES
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [dbStatus, setDbStatus] = useState(dbService.getDbStatus());
  
  const [showAuth, setShowAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Booking | null>(null);

  // Newsletter State
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [initialPackages, initialBookings] = await Promise.all([
          dbService.getPackages(),
          dbService.getBookings()
        ]);
        setPackages(initialPackages);
        setBookings(initialBookings);
      } catch (err) {
        console.error("Critical: Failed to connect to Database", err);
      } finally {
        setIsLoading(false);
      }
    };

    initData();

    const savedUser = localStorage.getItem('ct_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.role === 'ADMIN') {
          setCurrentSpace(AppSpace.ADMIN);
          setActivePage('admin');
        } else if (parsed.role === 'AGENT') {
          setCurrentSpace(AppSpace.AGENCY);
          setActivePage('home');
        }
      } catch (e) { 
        localStorage.removeItem('ct_user'); 
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ct_user');
    setUser(null);
    setCurrentSpace(AppSpace.CLIENT);
    setActivePage('home');
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setShowAuth(false);
    if (userData.role === 'ADMIN') {
      setCurrentSpace(AppSpace.ADMIN);
      setActivePage('admin');
    } else if (userData.role === 'AGENT') {
      setCurrentSpace(AppSpace.AGENCY);
      setActivePage('home');
    }
  };

  const startBooking = (service: ServiceType, pkg?: TravelPackage) => {
    setSelectedService(service);
    setSelectedPackage(pkg);
    setViewingPackage(undefined);
    setBasePrice(pkg ? pkg.price : 0);
    setInitialAdults(1); 
    setActivePage('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFlightSelect = (offer: any, finalPrice: number, airlineName: string, adultsCount: number = 1) => {
    setSelectedService('BILLETERIE');
    setSelectedPackage({
      id: offer.id,
      title: `Vol ${airlineName}`,
      description: `Réservation de billet d'avion émise par Cheap Travel.`,
      price: finalPrice,
      priceAdult: finalPrice / adultsCount, 
      type: 'BILLETERIE',
      stock: 999,
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop'
    } as any);
    setBasePrice(finalPrice);
    setInitialAdults(adultsCount);
    setActivePage('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail || isSubscribing) return;
    setIsSubscribing(true);
    try {
        await dbService.addSubscriber(subscriberEmail);
        setIsSubscribed(true);
        setSubscriberEmail('');
        setTimeout(() => setIsSubscribed(false), 5000);
    } catch (e) {
        alert("Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
        setIsSubscribing(false);
    }
  };

  const addPackage = async (pkg: TravelPackage) => {
    const updated = await dbService.savePackage(pkg);
    setPackages(updated);
  };

  const updatePackage = async (updatedPkg: TravelPackage) => {
    const updated = await dbService.savePackage(updatedPkg);
    setPackages(updated);
  };

  const deletePackage = async (id: string) => {
    const updated = await dbService.deletePackage(id);
    setPackages(updated);
  };
  
  const handleBookingSuccess = async (newBooking: Partial<Booking>) => {
    const bookingId = 'BK-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const finalBooking: Booking = {
      ...newBooking,
      id: bookingId,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    } as Booking;

    const updatedBookings = await dbService.saveBooking(finalBooking);
    setBookings(updatedBookings);
    
    const freshPackages = await dbService.getPackages();
    setPackages(freshPackages);

    if (finalBooking.agencyId && user && user.role === 'AGENT') {
        const newBalance = user.walletBalance - (finalBooking.amount || 0);
        const updatedUser = { ...user, walletBalance: newBalance };
        setUser(updatedUser);
        localStorage.setItem('ct_user', JSON.stringify(updatedUser));
    }

    setLastBookingId(bookingId);
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    const updated = await dbService.updateBookingStatus(id, status);
    setBookings(updated);
  };

  const deleteBooking = async (id: string) => {
    const updated = await dbService.deleteBooking(id);
    setBookings(updated);
  };

  const resetData = async () => {
    if (confirm("Attention: Cela va réinitialiser toute l'infrastructure de données. Continuer?")) {
      const pkgs = await dbService.resetToFactory();
      setPackages(pkgs);
      setBookings([]);
      alert("Système réinitialisé.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-white/5 border-t-orange-500 rounded-full animate-spin"></div>
          <ShieldAlert className="absolute inset-0 m-auto text-white/20" size={32} />
        </div>
        <div className="text-center">
          <h2 className="text-white text-xl font-black uppercase tracking-[0.5em] mb-2 animate-pulse">Establishing Secure Link</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Connecting to Cheap Travel Data Center...</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    if (currentSpace === AppSpace.ADMIN && user?.role === 'ADMIN') {
      return (
        <div className="py-12 px-4 max-w-7xl mx-auto print:hidden">
          <AdminPanel 
            bookings={bookings} 
            packages={packages} 
            onUpdateBooking={updateBookingStatus} 
            onDeleteBooking={deleteBooking} 
            onAddPackage={addPackage} 
            onUpdatePackage={updatePackage} 
            onDeletePackage={deletePackage} 
            onResetSystem={resetData}
            dbStatus={dbStatus}
            onViewVoucher={setSelectedVoucher}
          />
        </div>
      );
    }

    if (currentSpace === AppSpace.AGENCY) {
      if (activePage === 'billeterie') {
        return <div className="py-24 max-w-7xl mx-auto px-4"><BilleterieSearch isB2B={true} onFlightSelected={(offer, price, airline, adults) => handleFlightSelect(offer, price, airline, adults)} /></div>;
      }
      return (
        <div className="py-12 px-4 max-w-7xl mx-auto print:hidden">
          <AgencySpace 
            user={user} 
            packages={packages}
            bookings={bookings}
            onLogout={handleLogout} 
            onLoginSuccess={handleAuthSuccess} 
            onNewB2BBooking={handleBookingSuccess}
            onViewVoucher={setSelectedVoucher}
            onNavigateBilleterie={() => setActivePage('billeterie')}
          />
        </div>
      );
    }

    switch (activePage) {
      case 'home':
        return (
          <>
            <Hero onNavigate={setActivePage} />
            <Services />
            
            <section className="py-32 bg-white">
               <div className="max-w-7xl mx-auto px-4">
                 <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                   <div>
                      <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Destinations Phares</span>
                      <h2 className="text-5xl font-black text-blue-900 tracking-tighter">Offres <span className="text-gray-300">Exclusives</span></h2>
                   </div>
                   <button onClick={() => setActivePage('organised')} className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-blue-900 group">
                      <span>Voir Tout le Catalogue</span>
                      <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                   </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="group relative rounded-[40px] overflow-hidden aspect-[4/5] shadow-2xl cursor-pointer" onClick={() => setViewingPackage(pkg)}>
                         <img src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                         <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-transparent to-transparent"></div>
                         <div className={`absolute top-8 left-8 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border flex items-center space-x-2 ${pkg.stock <= 5 ? 'bg-red-500 text-white border-red-400' : 'bg-green-500/20 text-green-500 border-green-500/30'}`}>
                            {pkg.stock <= 5 && <Flame size={12} className="animate-pulse" />}
                            <span>{pkg.stock > 0 ? `${pkg.stock} places dispos` : 'Complet'}</span>
                         </div>
                         <div className="absolute bottom-8 left-8 right-8 text-white">
                            <span className="bg-orange-500 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">{pkg.type.replace('_', ' ')}</span>
                            <h3 className="text-2xl font-black mb-1 group-hover:text-orange-500 transition-colors">{pkg.title}</h3>
                            <div className="flex items-center justify-between mt-4">
                               <p className="text-blue-100/60 text-xs font-bold">{(pkg.priceAdult || pkg.price).toLocaleString()} DA</p>
                               <div className="flex items-center space-x-1">
                                  <Star size={10} className="fill-orange-500 text-orange-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">4.9/5</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
            </section>

            <TrustSection />

            <section className="py-24 bg-blue-900 text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
                  <Briefcase size={400} />
               </div>
               <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-none">Vous êtes une <span className="text-orange-500">Agence de Voyage ?</span></h2>
                  <p className="text-blue-200 text-lg mb-12 max-w-2xl mx-auto">Rejoignez notre réseau B2B et accédez aux meilleurs tarifs GDS, Visa et Packages en Algérie avec émission instantanée.</p>
                  <button 
                    onClick={() => { setCurrentSpace(AppSpace.AGENCY); setActivePage('home'); window.scrollTo(0,0); }}
                    className="bg-white text-blue-900 px-12 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-500 hover:text-white transition-all shadow-2xl active:scale-95"
                  >
                    Ouvrir un Compte Agence
                  </button>
               </div>
            </section>
          </>
        );
      case 'billeterie':
        return <div className="py-24 max-w-7xl mx-auto px-4"><BilleterieSearch isB2B={false} onFlightSelected={(offer, price, airline, adults) => handleFlightSelect(offer, price, airline, adults)} /></div>;
      case 'visa':
        return <div className="py-24 max-w-7xl mx-auto px-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center"><div><h2 className="text-7xl font-black text-blue-900 tracking-tighter mb-8 leading-none">Solutions <br/><span className="text-orange-500">Visa Pro</span></h2><p className="text-gray-500 text-xl font-medium leading-relaxed mb-12">Expertise complète pour l'obtention de vos visas.</p><div className="flex gap-4"><button onClick={() => startBooking('VISA')} className="bg-blue-900 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-2xl">Visa Classique</button><button onClick={() => startBooking('E-VISA')} className="bg-orange-500 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-2xl">E-Visa Rapide</button></div></div><div className="bg-blue-900 rounded-[80px] aspect-square relative overflow-hidden flex items-center justify-center p-20"><Globe className="text-white/10 w-full h-full absolute animate-spin-slow" /><ShieldCheck size={200} className="text-white relative z-10" /></div></div></div>;
      case 'omrah':
        return <div className="py-24 bg-gray-50"><div className="max-w-7xl mx-auto px-4 space-y-20"><div className="text-center max-w-3xl mx-auto"><Moon size={64} className="text-orange-500 mx-auto mb-6" /><h2 className="text-6xl font-black text-blue-900 tracking-tighter mb-4">Omrah Spirituelle</h2><p className="text-gray-500 text-lg">Hébergement 5★ et encadrement expert.</p></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {packages.filter(p => p.type === 'OMRAH').map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-[60px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col group relative" onClick={() => setViewingPackage(pkg)}><div className="h-[400px] relative overflow-hidden cursor-pointer"><img src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" /><div className={`absolute top-8 left-8 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${pkg.stock <= 5 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-green-500/20 text-green-500 border-green-500/30'}`}>{pkg.stock} places restantes</div></div><div className="p-12 space-y-8"><h3 className="text-4xl font-black text-blue-900 tracking-tight">{pkg.title}</h3><p className="text-2xl font-black text-orange-500">{(pkg.priceAdult || pkg.price).toLocaleString()} DA</p><button disabled={pkg.stock <= 0} onClick={(e) => { e.stopPropagation(); startBooking('OMRAH', pkg); }} className={`w-full py-6 rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all ${pkg.stock > 0 ? 'bg-blue-900 text-white hover:bg-black' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>{pkg.stock > 0 ? 'Réserver' : 'Complet'}</button></div></div>
          ))}
        </div></div></div>;
      case 'organised':
        return <div className="py-24 max-w-7xl mx-auto px-4"><div className="text-center max-w-3xl mx-auto mb-20"><h2 className="text-6xl font-black text-blue-900 tracking-tighter mb-4">Voyages Organisés</h2><p className="text-gray-500 text-lg">Découvrez nos circuits tout-compris.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {packages.filter(p => p.type === 'VOYAGE_ORGANISE' || p.type === 'E-VISA').map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-[50px] overflow-hidden border border-gray-100 shadow-xl group relative" onClick={() => setViewingPackage(pkg)}><div className="h-72 overflow-hidden relative cursor-pointer"><img src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" /><div className={`absolute top-6 left-6 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${pkg.stock <= 5 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-green-500/20 text-green-500 border-green-500/30'}`}>{pkg.stock} places</div></div><div className="p-10"><h3 className="text-2xl font-black text-blue-900 mb-4">{pkg.title}</h3><p className="text-2xl font-black text-orange-500 mb-6">{(pkg.priceAdult || pkg.price).toLocaleString()} DA</p><button disabled={pkg.stock <= 0} onClick={(e) => { e.stopPropagation(); startBooking('VOYAGE_ORGANISE', pkg); }} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${pkg.stock > 0 ? 'bg-blue-900 text-white hover:bg-black' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>{pkg.stock > 0 ? 'Voir Détails' : 'Plus de places'}</button></div></div>
          ))}
        </div></div>;
      case 'booking':
        return <div className="py-24 px-4"><BookingForm initialService={selectedService} packageName={selectedPackage?.title} packageId={selectedPackage?.id} initialBasePrice={basePrice} priceAdult={selectedPackage?.priceAdult} priceChild={selectedPackage?.priceChild} priceBaby={selectedPackage?.priceBaby} availableStock={selectedPackage?.stock} onSuccess={handleBookingSuccess} initialAdults={initialAdults} /></div>;
      case 'profile':
        return <div className="py-12 px-4"><ClientSpace /></div>;
      case 'admin':
         if (user?.role === 'ADMIN') {
            setCurrentSpace(AppSpace.ADMIN);
            return renderCurrentView();
         }
         return null;
      default:
        return <Hero onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter relative">
      <Navbar currentSpace={currentSpace} onSpaceChange={(s) => { if (s === AppSpace.ADMIN && user?.role !== 'ADMIN') { setCurrentSpace(AppSpace.AGENCY); setActivePage('home'); } else { setCurrentSpace(s); } }} currentPage={activePage} onPageChange={setActivePage} user={user} onAuthClick={() => setShowAuth(true)} onLogout={handleLogout} />
      
      <main className="flex-1">{renderCurrentView()}</main>
      
      <AIChat />

      <div className="fixed bottom-10 right-10 z-[100] group flex items-center print:hidden">
         <div className="mr-4 bg-white px-6 py-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 border border-gray-100 pointer-events-none">
            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest whitespace-nowrap">Besoin d'aide ?</p>
         </div>
         <a 
          href={WHATSAPP_LINK} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-16 h-16 bg-[#25D366] text-white rounded-full shadow-[0_10px_40px_rgba(37,211,102,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative"
         >
            <MessageSquare size={28} />
            <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20"></div>
         </a>
      </div>

      {lastBookingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md" onClick={() => setLastBookingId(null)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[48px] p-10 text-center shadow-2xl animate-in zoom-in-95">
             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
             </div>
             <h3 className="text-3xl font-black text-blue-900 mb-2">Félicitations !</h3>
             <p className="text-gray-500 text-sm font-medium mb-8">Votre réservation #{lastBookingId} a été enregistrée avec succès.</p>
             
             <div className="space-y-4">
                <a 
                  href={formatWhatsAppMessage(`Bonjour Cheap Travel, je vous contacte pour confirmer ma réservation #${lastBookingId}.`)}
                  target="_blank"
                  className="w-full bg-[#25D366] text-white font-black py-5 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-[#25D366]/20"
                >
                  <MessageSquare size={20} />
                  <span className="uppercase tracking-widest text-[10px]">Confirmer par WhatsApp</span>
                </a>
                <button 
                  onClick={() => { setLastBookingId(null); setActivePage('home'); }}
                  className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-900"
                >
                  Retour à l'accueil
                </button>
             </div>
          </div>
        </div>
      )}

      {selectedVoucher && (
        <Voucher booking={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}

      {viewingPackage && (
        <PackageDetails pkg={viewingPackage} onBook={() => startBooking(viewingPackage.type, viewingPackage)} onClose={() => setViewingPackage(undefined)} />
      )}

      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}

      <footer className="bg-white border-t border-gray-100 py-16 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-blue-900 rounded-[50px] p-12 md:p-20 text-white mb-20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-20 opacity-5">
                <Send size={300} />
             </div>
             <div className="relative z-10 max-w-2xl">
                <h3 className="text-4xl font-black tracking-tighter mb-4">Recevez les <span className="text-orange-500">Bons Plans</span> en priorité.</h3>
                <p className="text-blue-200 mb-10 font-medium">Rejoignez 5,420+ voyageurs algériens qui reçoivent nos offres Flash Omrah et Visa chaque semaine.</p>
                {isSubscribed ? (
                  <div className="bg-green-500 text-white p-6 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center space-x-4 animate-in zoom-in-95">
                    <CheckCircle />
                    <span>Merci! Vous êtes désormais inscrit aux bons plans.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-4">
                    <input 
                      required
                      type="email" 
                      placeholder="votre@email.com" 
                      className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 flex-1 text-white placeholder:text-blue-300 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all" 
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                    />
                    <button type="submit" disabled={isSubscribing} className="bg-orange-500 hover:bg-white hover:text-blue-900 text-white font-black px-10 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center min-w-[140px]">
                      {isSubscribing ? <Loader2 className="animate-spin" /> : "S'inscrire"}
                    </button>
                  </form>
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic mb-6">Cheap <span className="text-orange-500">Travel</span></div>
              <p className="text-gray-400 text-sm font-medium max-w-sm">Votre agence de voyage numéro 1 en Algérie pour l'excellence opérationnelle et les meilleurs tarifs du marché.</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-6">Liens Rapides</p>
              <ul className="space-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <li><button onClick={() => setActivePage('home')} className="hover:text-blue-900 transition-colors">Accueil</button></li>
                <li><button onClick={() => setActivePage('omrah')} className="hover:text-blue-900 transition-colors">Omrah 2024</button></li>
                <li><button onClick={() => setActivePage('visa')} className="hover:text-blue-900 transition-colors">Services Visa</button></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-6">Espace Pro</p>
              <ul className="space-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <li><button onClick={() => setCurrentSpace(AppSpace.AGENCY)} className="hover:text-orange-500 transition-colors">Portail Agences</button></li>
                <li><button className="hover:text-blue-900 transition-colors">Devenir Partenaire</button></li>
                <li><button className="hover:text-blue-900 transition-colors">Accès Admin</button></li>
              </ul>
            </div>
          </div>
          <p className="text-center text-gray-300 text-[8px] font-black uppercase tracking-widest">© 2024 Cheap Travel. Tous droits réservés. Agrément n°1234/2024. Designed for Excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
