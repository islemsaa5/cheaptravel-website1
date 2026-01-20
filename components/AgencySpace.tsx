
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  Users, FileText, TrendingUp, AlertCircle, DollarSign, Briefcase, Plus,
  Ticket, Globe, Download, Settings, Lock, ShieldCheck, Wallet,
  LayoutDashboard, History, UserPlus, LogOut, ChevronRight, UserCircle, Zap,
  ArrowUpRight, Landmark, Mail, Building2, Fingerprint, ShieldAlert, CheckCircle, Search, ArrowLeft, MessageSquare, FileText as FileIcon, RefreshCcw, MapPin, Phone, Camera, Bell, FileDown
} from 'lucide-react';
import { AppSpace, ServiceType, User, Booking, TravelPackage, WalletRequest, AppNotification } from '../types';
import BookingForm from './BookingForm';
import { WHATSAPP_LINK } from '../constants';
import { authService } from '../services/authService';

interface AgencySpaceProps {
  user: User | null;
  packages: TravelPackage[];
  bookings: Booking[];
  onLogout: () => void;
  onLoginSuccess: (user: User) => void;
  onNewB2BBooking: (booking: Partial<Booking>) => void;
  onViewVoucher: (booking: Booking) => void;
  // Added missing navigation prop to fix type mismatch in App.tsx
  onNavigateBilleterie?: () => void;
  onRefreshUser: () => void;
  onSpaceChange?: (s: AppSpace) => void;
  onNotify?: (type: AppNotification['type'], title: string, message: string) => void;
  notifications?: AppNotification[];
  onMarkRead?: (id: string) => void;
  resendApiKey?: string;
}

const AgencySpace: React.FC<AgencySpaceProps> = ({
  user,
  packages,
  bookings,
  onLogout,
  onLoginSuccess,
  onNewB2BBooking,
  onViewVoucher,
  onNavigateBilleterie,
  onRefreshUser,
  onSpaceChange,
  onNotify,
  notifications = [],
  onMarkRead,
  resendApiKey
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'booking' | 'form' | 'history' | 'wallet' | 'settings'>('dashboard');
  const [selectedPkg, setSelectedPkg] = useState<TravelPackage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [walletRequests, setWalletRequests] = useState<any[]>([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [markupPercent, setMarkupPercent] = useState(user?.markupPreference || 0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForgot, setIsForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    agencyName: user?.agencyName || '',
    agencyAddress: user?.agencyAddress || '',
    agencyPhone: user?.agencyPhone || '',
    fullName: user?.fullName || ''
  });

  React.useEffect(() => {
    if (user) {
      setSettingsForm({
        agencyName: user.agencyName || '',
        agencyAddress: user.agencyAddress || '',
        agencyPhone: user.agencyPhone || '',
        fullName: user.fullName || ''
      });
    }
  }, [user]);

  const [formData, setFormData] = useState({
    agencyName: '',
    fullName: '',
    email: '',
    password: '',
    licenseNumber: '',
    agencyAddress: '',
    agencyPhone: ''
  });

  const agencyBookings = useMemo(() => {
    return bookings.filter(b => b.agencyId === user?.id);
  }, [bookings, user]);

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const monthName = months[monthIndex];

      const monthlyBookings = agencyBookings.filter(b => {
        const bDate = new Date(b.date);
        return bDate.getMonth() === monthIndex && bDate.getFullYear() === d.getFullYear();
      });

      const sales = monthlyBookings.reduce((sum, b) => sum + b.amount, 0);
      data.push({ name: monthName, sales });
    }
    return data;
  }, [agencyBookings]);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyBookings = agencyBookings.filter(b => {
      const bDate = new Date(b.date);
      return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
    });

    const totalVentes = monthlyBookings.reduce((sum, b) => sum + b.amount, 0);
    // Assuming 7% average commission for agents
    const commissionNet = totalVentes * 0.07;
    const billetsEmis = agencyBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length;

    const formatVal = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
      return num.toLocaleString();
    };

    return [
      { label: 'Ventes du Mois', val: formatVal(totalVentes), color: 'blue', icon: TrendingUp },
      { label: 'Commission Net', val: formatVal(commissionNet), color: 'green', icon: DollarSign },
      { label: 'Billets Émis', val: billetsEmis.toString(), color: 'orange', icon: Ticket }
    ];
  }, [agencyBookings]);

  const fetchWalletRequests = async () => {
    if (!user) return;
    const { dbService } = await import('../services/dbService');
    const reqs = await dbService.getWalletRequests(user.id);
    setWalletRequests(reqs);
  };

  React.useEffect(() => {
    if (view === 'wallet') fetchWalletRequests();
  }, [view, user]);

  const handleB2BAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const emailToUse = formData.email.trim();
    const passwordToUse = formData.password;

    try {
      if (isForgot) {
        const { success, error } = await authService.requestPasswordReset(emailToUse, resendApiKey);
        if (error) {
          setErrorMsg(error);
        } else if (success) {
          setResetSent(true);
        }
        setIsLoading(false);
        return;
      }

      if (isRegistering) {
        // Register Agent
        const { user, error } = await authService.register({
          email: emailToUse,
          password: passwordToUse,
          agencyName: formData.agencyName || "Agence Partenaire",
          agencyAddress: formData.agencyAddress,
          agencyPhone: formData.agencyPhone,
          isAgent: true
        });

        if (error) {
          setErrorMsg(error);
          setIsLoading(false);
          return;
        }
        if (user) onLoginSuccess(user);

      } else {
        // Login Agent
        const { user, error } = await authService.login(emailToUse, passwordToUse, 'AGENT');

        if (error) {
          setErrorMsg(error);
          setIsLoading(false);
          return;
        }
        // Check Role consistency just in case
        if (user && user.role !== 'AGENT' && user.role !== 'ADMIN') {
          setErrorMsg("Ce compte n'est pas un compte Agence.");
          setIsLoading(false);
          return;
        }
        if (user) onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error("Auth Error", err);
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBooking = (pkg: TravelPackage) => {
    setSelectedPkg(pkg);
    setView('form');
  };

  const handleBookingSuccess = (booking: Partial<Booking>) => {
    const b2bBooking = {
      ...booking,
      agencyId: user?.id,
      agencyName: user?.agencyName,
    };
    onNewB2BBooking(b2bBooking);
    setView('dashboard');
    setSelectedPkg(null);
    if (onNotify) {
      onNotify('BOOKING', 'Nouvelle Réservation', `Une nouvelle réservation a été enregistrée.`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("L'image est trop volumineuse (Max 2MB). Veuillez choisir une image plus petite.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWalletRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseInt(rechargeAmount);
    if (isNaN(amount) || amount < 1000) return alert("Montant minimum : 1000 DA");

    setIsLoading(true);
    try {
      const { dbService } = await import('../services/dbService');
      await dbService.createWalletRequest({
        agencyId: user.id,
        agencyName: user.agencyName,
        amount: amount,
        proofImage: proofUrl
      });
      alert("Demande envoyée ! L'admin l'examinera sous peu.");
      setRechargeAmount('');
      setProofUrl('');
      fetchWalletRequests();
      if (onNotify) {
        onNotify('WALLET', 'Demande envoyée', `Votre demande de ${amount} DA est en attente de validation.`);
      }
    } catch (err: any) {
      console.error("Wallet Submit Error:", err);
      alert("Erreur lors de l'envoi : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMarkup = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { dbService } = await import('../services/dbService');
      const updatedUser = { ...user, markupPreference: markupPercent };
      await dbService.updateProfile(updatedUser);
      onRefreshUser();
      alert("Marge configurée avec succès !");
      if (onNotify) {
        onNotify('SETTINGS', 'Marge mise à jour', `Votre marge bénéficiaire a été configurée à ${markupPercent}%.`);
      }
    } catch (err) {
      alert("Erreur de mise à jour.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAgencyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      const { dbService } = await import('../services/dbService');
      const updatedUser: User = {
        ...user,
        agencyName: settingsForm.agencyName,
        agencyAddress: settingsForm.agencyAddress,
        agencyPhone: settingsForm.agencyPhone,
        fullName: settingsForm.fullName
      };
      await dbService.updateProfile(updatedUser);
      onRefreshUser();
      alert("Coordonnées mises à jour avec succès !");
      if (onNotify) {
        onNotify('SETTINGS', 'Profil Agence Mis à Jour', 'Les coordonnées de votre agence ont été enregistrées.');
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour des coordonnées.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSales = () => {
    if (!user || agencyBookings.length === 0) {
      alert("Aucune vente à exporter.");
      return;
    }

    const headers = ["ID", "Client", "Contact", "Prestation", "Statut", "Montant", "Date"];
    const csvRows = agencyBookings.map(b => [
      `"${b.id}"`,
      `"${b.customerName}"`,
      `"${b.contact || ''}"`,
      `"${b.service}"`,
      `"${b.status}"`,
      b.amount,
      `"${new Date(b.date).toLocaleDateString()}"`
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ventes_agence_${user.agencyName || user.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) {
      onNotify('REPORT', 'Exportation Réussie', 'Les données de ventes ont été exportées en CSV.');
    }
  };

  if (!user || (user.role !== 'AGENT' && user.role !== 'ADMIN')) {
    // SPECIAL CASE: User is logged in as a CLIENT and visits Agency Space
    if (user && user.role === 'CLIENT' && !isRegistering) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-gray-100 p-12 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <UserCircle size={40} />
            </div>
            <h3 className="text-3xl font-black text-blue-900 mb-4">Compte Client Détecté</h3>
            <p className="text-gray-500 mb-10 leading-relaxed font-medium">
              Vous êtes actuellement connecté avec un compte <strong>Client</strong>. <br />
              Pour accéder à l'espace Agence, vous devez soit transformer votre compte actuel, soit vous déconnecter pour utiliser un compte partenaire.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setFormData({ ...formData, email: user.email || '' });
                  setIsRegistering(true);
                }}
                className="bg-blue-900 text-white font-black py-5 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform"
              >
                <Zap size={18} />
                <span className="uppercase tracking-widest text-[10px]">Devenir Partenaire</span>
              </button>
              <button
                onClick={onLogout}
                className="bg-gray-50 text-gray-400 font-black py-5 rounded-2xl flex items-center justify-center space-x-3 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
              >
                <LogOut size={18} />
                <span className="uppercase tracking-widest text-[10px]">Se Déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-0 md:p-4">
        <div className="w-full max-w-5xl bg-white md:rounded-[50px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row animate-in fade-in zoom-in-95 duration-500">
          <div className="w-full lg:w-1/2 bg-blue-900 p-8 md:p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-800 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl opacity-50"></div>
            <div className="relative z-10">
              <div className="text-2xl md:text-3xl font-black mb-10 md:mb-16 tracking-tighter uppercase italic">
                Cheap <span className="text-orange-500">Travel</span> <span className="text-[10px] font-bold block text-blue-400 -mt-1 tracking-[0.4em]">B2B Enterprise</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 leading-tight">{isRegistering ? 'Partnership Starts Here.' : 'Console Partenaire.'}</h2>
              <div className="space-y-4 md:space-y-6">
                {[{ icon: Ticket, title: 'Tarifs Nets', desc: 'Accès direct aux prix de gros IATA.' }, { icon: ShieldCheck, title: 'Portefeuille', desc: 'Émission instantanée par dépôt.' }, { icon: Landmark, title: 'Visa Hub', desc: 'Traitement en masse des visas.' }].map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3 md:space-x-4">
                    <div className="p-2 md:p-3 bg-white/10 rounded-xl md:rounded-2xl shrink-0"><feature.icon size={18} className="text-orange-400" /></div>
                    <div><h4 className="font-bold text-xs md:text-sm">{feature.title}</h4><p className="text-blue-300 text-[10px] md:text-xs mt-1 leading-relaxed">{feature.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative z-10 mt-8 md:mt-12 pt-8 md:pt-12 border-t border-white/10 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 text-center sm:text-left">Portail Officiel Agence</p>
              <div className="hidden sm:flex -space-x-3">{[1, 2, 3, 4].map(i => (<div key={i} className="w-8 h-8 rounded-full border-2 border-blue-900 bg-gray-200 overflow-hidden"><img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="Partner" /></div>))}</div>
            </div>
          </div>
          <div className="lg:w-1/2 p-12 lg:p-16 flex flex-col justify-center bg-gray-50/30">
            <div className="max-w-md mx-auto w-full">
              <h3 className="text-2xl font-black text-blue-900 mb-2">{isRegistering ? 'Inscription Partenaire' : 'Connexion Professionnelle'}</h3>
              <p className="text-gray-400 text-sm font-medium mb-10">{isRegistering ? (user?.role === 'CLIENT' ? 'Transformez votre compte en agence partenaire.' : 'Rejoignez notre réseau de distribution national.') : 'Entrez vos identifiants pour accéder à votre console.'}</p>

              {errorMsg && (
                <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                  <ShieldAlert size={18} className="shrink-0" />
                  <p className="text-xs font-bold leading-tight uppercase tracking-widest">{errorMsg}</p>
                </div>
              )}

              {resetSent && isForgot && (
                <div className="mb-6 bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center space-x-3 text-green-600 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold leading-tight uppercase tracking-widest">Lien de réinitialisation envoyé ! (Simulation)</p>
                </div>
              )}

              <form onSubmit={(e) => handleB2BAuth(e)} className="space-y-4">
                {isRegistering && (
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input required type="text" placeholder="Nom Légal de l'Agence" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.agencyName} onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })} />
                  </div>
                )}
                {isRegistering && (
                  <>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input required type="text" placeholder="Adresse du Siège" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.agencyAddress} onChange={(e) => setFormData({ ...formData, agencyAddress: e.target.value })} />
                    </div>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input required type="text" placeholder="Téléphone Professionnel" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.agencyPhone} onChange={(e) => setFormData({ ...formData, agencyPhone: e.target.value })} />
                    </div>
                  </>
                )}
                <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" placeholder="Email ou Nom d'utilisateur" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>

                {!isForgot && (
                  <div className="space-y-2">
                    <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="password" placeholder="Mot de passe" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
                    {!isRegistering && (
                      <div className="flex justify-end px-2">
                        <button type="button" onClick={() => setIsForgot(true)} className="text-[10px] font-black text-blue-900/40 hover:text-blue-900 uppercase tracking-widest transition-colors">Mot de passe oublié ?</button>
                      </div>
                    )}
                  </div>
                )}

                <button disabled={isLoading || (isForgot && resetSent)} type="submit" className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-3 mt-6 ${isForgot ? 'bg-purple-600 shadow-purple-600/20' : 'bg-blue-900 shadow-blue-900/20'} hover:bg-black ${isForgot && resetSent ? 'opacity-50' : ''}`}>
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="uppercase tracking-[0.2em] text-[10px]">{isForgot ? (resetSent ? 'Lien Envoyé' : 'Réinitialiser') : isRegistering ? (user?.role === 'CLIENT' ? 'Confirmer la Transformation' : 'Inscrire l\'agence') : 'Accéder au Portail'}</span><ChevronRight size={18} /></>}
                </button>
              </form>
              <div className="mt-10 flex flex-col items-center space-y-4">
                <button onClick={() => {
                  if (isForgot) {
                    setIsForgot(false);
                  } else {
                    setIsRegistering(!isRegistering);
                  }
                  setErrorMsg(null);
                  setResetSent(false);
                }} className="text-[10px] font-black text-gray-400 hover:text-blue-900 uppercase tracking-widest transition-colors">
                  {isForgot ? "Retour à la connexion" : isRegistering ? "Déjà partenaire ? Se connecter" : "Devenir partenaire ? S'inscrire"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className={`flex flex-col xl:flex-row gap-6 md:gap-8 items-start xl:items-center justify-between p-6 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-2xl ${user.role === 'ADMIN' ? 'bg-[#0a0c10] border-white/10 text-white' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[24px] flex items-center justify-center shadow-lg shrink-0 ${user.role === 'ADMIN' ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-blue-900 text-white shadow-blue-900/20'}`}>{user.role === 'ADMIN' ? <ShieldAlert size={24} className="md:w-8 md:h-8" /> : <LayoutDashboard size={24} className="md:w-8 md:h-8" />}</div>
          <div>
            <h2 className={`text-xl md:text-3xl font-black tracking-tight ${user.role === 'ADMIN' ? 'text-white' : 'text-blue-900'}`}>{user.role === 'ADMIN' ? 'Console Direction' : 'Console B2B'}</h2>
            <div className="flex items-center space-x-2 md:space-x-4 mt-0.5 md:mt-1">
              <span className="flex items-center space-x-2 bg-green-500/10 text-green-500 px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Direct</span>
              </span>
              <span className={`${user.role === 'ADMIN' ? 'text-gray-500' : 'text-gray-400'} text-[8px] md:text-[10px] font-bold uppercase tracking-widest border-l pl-2 md:pl-4 border-gray-700 truncate max-w-[120px] md:max-w-none`}>{user.role === 'ADMIN' ? 'Propriétaire' : user.agencyName}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full xl:w-auto mt-4 md:mt-0">
          {user.role === 'ADMIN' ? (
            <div className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-orange-500/10 border border-orange-500/20 p-4 md:p-5 rounded-[20px] md:rounded-[24px] text-orange-500 animate-pulse"><CheckCircle size={16} /><span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Accès Super Admin</span></div>
          ) : (
            <>
              <div className="w-full sm:w-auto bg-orange-50 border border-orange-100 p-3 md:p-4 rounded-2xl md:rounded-3xl flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="text-[8px] md:text-[9px] font-black text-orange-800 uppercase tracking-widest mb-0.5">Solde B2B</p>
                    <p className="text-lg md:text-xl font-black text-orange-600">{user.walletBalance.toLocaleString()} <span className="text-[10px]">DA</span></p>
                  </div>
                  <button onClick={onRefreshUser} className="p-2 hover:bg-orange-100 rounded-xl transition-colors text-orange-400" title="Actualiser le solde">
                    <RefreshCcw size={14} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setView('wallet')}
                className={`w-full sm:w-auto px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-[24px] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl shrink-0 ${view === 'wallet' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-blue-900 text-white shadow-blue-900/10 hover:bg-black'}`}
              >
                + Crédit
              </button>
            </>
          )}
          {/* Notifications and Space Switcher */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white relative transition-all"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-blue-900"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-4 w-80 bg-white shadow-2xl rounded-[32px] border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4">
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-900">Notifications</h4>
                    <span className="text-[10px] font-bold text-gray-400">{notifications.length} Total</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="mx-auto text-gray-100 mb-4" size={32} />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkRead?.(n.id)}
                          className={`p-5 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-all ${!n.isRead ? 'bg-orange-50' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                            <div>
                              <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-tight mb-1">{n.title}</h5>
                              <p className="text-[10px] text-gray-500 leading-relaxed mb-1">{n.message}</p>
                              <p className="text-[8px] font-bold text-gray-300 uppercase">{new Date(n.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => onSpaceChange && onSpaceChange(AppSpace.ADMIN)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                title="Changer d'espace"
              >
                <LayoutDashboard size={20} />
              </button>
            )}
          </div>
          <button onClick={onLogout} className={`w-full sm:w-auto p-4 md:p-5 rounded-2xl md:rounded-[24px] transition-all border flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-gray-50 text-gray-400 border-gray-100'}`}><LogOut size={18} className="md:w-5 md:h-5" /><span className="sm:hidden ml-3 text-[10px] font-black uppercase tracking-widest">Déconnexion</span></button>
        </div>
      </div>

      {user.role === 'ADMIN' ? (
        <div className="bg-[#0f1218] border border-white/5 p-20 rounded-[60px] text-center text-white shadow-inner">
          <h3 className="text-5xl font-black mb-6 tracking-tighter">Accès Administrateur Validé</h3>
          <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">Identité vérifiée. Contrôle total activé.</p>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="p-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-bounce">
              <div className="bg-[#0a0c10] p-4 rounded-full">
                <ChevronRight size={32} className="rotate-[-90deg] text-orange-500" />
              </div>
            </div>
            <button
              onClick={() => onSpaceChange && onSpaceChange(AppSpace.ADMIN)}
              className="px-12 py-5 bg-orange-500 text-white font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-white hover:text-orange-600 transition-all shadow-2xl shadow-orange-500/20"
            >
              Accéder à la Console Super Admin
            </button>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">Ou utilisez le sélecteur d'espace en haut</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-10">
          <div className="flex flex-wrap items-center gap-2 md:space-x-4 bg-white p-2 md:p-2 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm w-full md:w-fit">
            <button onClick={() => setView('dashboard')} className={`flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>Dashboard</button>
            <button onClick={() => { setSearchQuery(''); setView('booking'); }} className={`flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${view === 'booking' || view === 'form' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>{view === 'form' ? 'Formulaire' : 'Réserver'}</button>
            <button onClick={() => setView('history')} className={`flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>Ventes</button>
            <button onClick={() => setView('wallet')} className={`flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${view === 'wallet' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>Trésorerie</button>
            <button onClick={() => setView('settings')} className={`flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${view === 'settings' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>Réglages</button>
          </div>

          {view === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {dashboardStats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                      <div className={`p-3 w-fit bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl mb-6`}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-3xl font-black text-blue-900 mt-2">{stat.val} <span className="text-xs font-bold">DA</span></h3>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm"><div className="flex items-center justify-between mb-10"><h3 className="text-xl font-black text-blue-900">Activité Commerciale</h3><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temps Réel</span></div><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} /><Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} /><Area type="monotone" dataKey="sales" stroke="#1e3a8a" strokeWidth={4} fillOpacity={0.1} fill="#1e3a8a" /></AreaChart></ResponsiveContainer></div></div>
              </div>
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-blue-900 mb-6">Actions Rapides</h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Groupe Visa',
                        icon: UserPlus,
                        onClick: () => {
                          setSearchQuery('VISA');
                          setView('booking');
                        }
                      },
                      {
                        label: 'Mes Agents',
                        icon: Users,
                        onClick: () => setView('settings')
                      },
                      {
                        label: 'Factures GDS',
                        icon: FileText,
                        onClick: () => setView('history')
                      }
                    ].map((action, i) => (
                      <button
                        key={i}
                        onClick={action.onClick}
                        className="w-full flex items-center p-5 bg-gray-50 hover:bg-blue-50 border border-transparent rounded-3xl transition-all text-left group"
                      >
                        <div className="p-3 bg-white text-blue-900 rounded-2xl shadow-sm group-hover:bg-blue-900 group-hover:text-white transition-all">
                          <action.icon size={18} />
                        </div>
                        <span className="ml-4 text-xs font-black text-blue-900 tracking-tight">{action.label}</span>
                        <ArrowUpRight size={16} className="ml-auto text-gray-300 group-hover:text-blue-900 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                      </button>
                    ))}
                    <a href={WHATSAPP_LINK} target="_blank" className="w-full flex items-center p-5 bg-green-50 hover:bg-green-100 border border-transparent rounded-3xl transition-all text-left">
                      <div className="p-3 bg-white text-[#25D366] rounded-2xl shadow-sm"><MessageSquare size={18} /></div>
                      <span className="ml-4 text-xs font-black text-[#25D366] tracking-tight">Support Siège (WhatsApp)</span>
                    </a>
                    {/* Integrated onNavigateBilleterie into a quick action button */}
                    <button onClick={onNavigateBilleterie} className="w-full flex items-center p-5 bg-blue-50 hover:bg-blue-100 border border-transparent rounded-3xl transition-all text-left">
                      <div className="p-3 bg-white text-blue-900 rounded-2xl shadow-sm"><Ticket size={18} /></div>
                      <span className="ml-4 text-xs font-black text-blue-900 tracking-tight">Accéder à la Billeterie</span>
                      <ChevronRight size={16} className="ml-auto text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-blue-900 tracking-tighter">Historique des Ventes Agence</h3>
                  <p className="text-gray-400 text-sm font-medium">Toutes les réservations effectuées par votre agence.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportSales}
                    className="bg-blue-900 text-white px-5 py-3 rounded-2xl flex items-center space-x-2 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-black"
                  >
                    <FileDown size={14} />
                    <span>Export Ventes</span>
                  </button>
                  <button onClick={() => setView('booking')} className="bg-orange-500 hover:bg-black text-white px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20">
                    <Plus size={14} />
                    <span>Nouveau Dossier</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Réf</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Prestation</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Total / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {agencyBookings.map(bk => (
                      <tr key={bk.id} className="group hover:bg-gray-50 transition-all">
                        <td className="px-6 py-6 font-bold text-blue-900">#{bk.id}</td>
                        <td className="px-6 py-6">
                          <p className="text-sm font-bold text-blue-900">{bk.customerName}</p>
                          <p className="text-[9px] text-gray-400 font-medium">{bk.date}</p>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                            {bk.service}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${bk.status === 'Confirmed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                            {bk.status}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => onViewVoucher(bk)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-900 hover:text-white transition-all">
                              <FileIcon size={14} />
                            </button>
                            <span className="text-sm font-black text-blue-900">{bk.amount.toLocaleString()} DA</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {agencyBookings.length === 0 && (
                      <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">Aucune vente enregistrée</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'wallet' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl">
                  <h3 className="text-2xl font-black text-blue-900 mb-2 tracking-tighter">Recharger Solde</h3>
                  <p className="text-gray-400 text-xs font-medium mb-8 leading-relaxed">
                    Effectuez un virement CCP ou Baridimob, puis envoyez la photo du reçu ci-dessous.
                  </p>

                  <form onSubmit={handleWalletRequest} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Montant (DA)</label>
                      <input
                        required
                        type="number"
                        placeholder="Ex: 50000"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:outline-none font-bold text-blue-900 transition-all text-sm"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Preuve de Virement (Photo Reçu)</label>
                      <div className="relative group">
                        <input
                          required={!proofUrl}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="proof-upload"
                        />
                        <label
                          htmlFor="proof-upload"
                          className={`w-full h-40 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center cursor-pointer transition-all ${proofUrl
                            ? 'border-green-500 bg-green-50/30'
                            : 'border-gray-200 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-300'
                            }`}
                        >
                          {proofUrl ? (
                            <div className="relative w-full h-full p-2">
                              <img src={proofUrl} alt="Preview" className="w-full h-full object-cover rounded-[24px]" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px] flex items-center justify-center">
                                <p className="text-white text-[10px] font-black uppercase">Changer la photo</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 text-gray-400 group-hover:text-blue-600 transition-colors">
                                <Camera size={24} />
                              </div>
                              <p className="text-xs font-bold text-gray-500">Cliquez pour ajouter le reçu</p>
                              <p className="text-[9px] text-gray-400 mt-1 uppercase font-black tracking-widest">Format JPG, PNG (Max 2MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    <button
                      disabled={isLoading}
                      type="submit"
                      className="w-full bg-orange-500 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-[10px]"
                    >
                      {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Soumettre la preuve"}
                    </button>
                  </form>
                </div>

                <div className="bg-blue-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Landmark size={80} /></div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-blue-300 mb-6">Coordonnées de Virement</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">CCP (Algérie Poste)</p>
                      <p className="text-lg font-black tracking-tight">00799999 01 01234567 89</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Propriétaire</p>
                      <p className="text-sm font-bold uppercase">Cheap Travel International</p>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] font-medium text-blue-200 leading-relaxed italic">
                        Une fois validée, la somme sera créditée instantanément sur votre solde B2B.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-blue-900 tracking-tighter">Historique Trésorerie</h3>
                    <button
                      onClick={fetchWalletRequests}
                      className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Montant</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {walletRequests.map(wr => (
                          <tr key={wr.id}>
                            <td className="px-6 py-6 font-bold text-blue-900 text-xs">#{wr.id}</td>
                            <td className="px-6 py-6 font-black text-sm">{wr.amount.toLocaleString()} DA</td>
                            <td className="px-6 py-6 text-xs text-gray-500 font-medium">{new Date(wr.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-6">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${wr.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                wr.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {wr.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {walletRequests.length === 0 && (
                          <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">Aucune demande</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-12 rounded-[50px] border border-gray-100 shadow-xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-blue-900 text-white rounded-2xl"><TrendingUp size={24} /></div>
                  <h3 className="text-2xl font-black text-blue-900 tracking-tighter">Markup & Commission</h3>
                </div>
                <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                  Configurez votre marge bénéficiaire automatique. Ce pourcentage sera ajouté à tous les tarifs "Net" du catalogue pour vos clients finaux.
                </p>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Markup de l'Agence (%)</label>
                    <div className="flex items-center space-x-6">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-900"
                        value={markupPercent}
                        onChange={(e) => setMarkupPercent(parseFloat(e.target.value))}
                      />
                      <span className="text-3xl font-black text-blue-900 w-24 text-right">{markupPercent}%</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest mb-4 italic">Simulation de vente :</p>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-500 text-xs">Exemple Prix Net Cheap Travel :</span>
                      <span className="text-blue-900">100 000 DA</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold mt-2">
                      <span className="text-gray-500 text-xs text-xs">Votre Marge (+{markupPercent}%) :</span>
                      <span className="text-green-600">+{((100000 * markupPercent) / 100).toLocaleString()} DA</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-black mt-4 pt-4 border-t border-gray-200">
                      <span className="text-blue-900 tracking-tight">Prix Final Client :</span>
                      <span className="text-blue-900">{(100000 * (1 + markupPercent / 100)).toLocaleString()} DA</span>
                    </div>
                  </div>

                  <button
                    disabled={isLoading}
                    onClick={handleUpdateMarkup}
                    className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-[10px]"
                  >
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Appliquer la configuration"}
                  </button>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[50px] border border-gray-100 shadow-xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-blue-900 text-white rounded-2xl"><Building2 size={24} /></div>
                  <h3 className="text-2xl font-black text-blue-900 tracking-tighter">Coordonnées Agence</h3>
                </div>
                <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                  Gérez les informations légales de votre agence affichées sur vos vouchers et billets.
                </p>

                <form onSubmit={handleUpdateAgencyDetails} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nom de l'Agence</label>
                    <input
                      required
                      type="text"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:outline-none font-bold text-blue-900 transition-all text-sm"
                      value={settingsForm.agencyName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, agencyName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Responsable (FullName)</label>
                    <input
                      required
                      type="text"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:outline-none font-bold text-blue-900 transition-all text-sm"
                      value={settingsForm.fullName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, fullName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Téléphone Pro</label>
                      <input
                        required
                        type="text"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:outline-none font-bold text-blue-900 transition-all text-sm"
                        value={settingsForm.agencyPhone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, agencyPhone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Contact</label>
                      <input
                        disabled
                        type="email"
                        className="w-full px-6 py-4 bg-gray-100 border border-transparent rounded-2xl font-bold text-gray-400 cursor-not-allowed text-sm"
                        value={user?.email}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Adresse du Siège</label>
                    <textarea
                      required
                      rows={2}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:outline-none font-bold text-blue-900 transition-all text-sm resize-none"
                      value={settingsForm.agencyAddress}
                      onChange={(e) => setSettingsForm({ ...settingsForm, agencyAddress: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-[10px]"
                  >
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Enregistrer les modifications"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {view === 'booking' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-blue-900 tracking-tighter">Catalogue B2B</h3>
                  <p className="text-gray-400 text-sm font-medium">Réservez instantanément pour vos clients finaux</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Chercher un voyage..." className="bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-900/5 transition-all w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.filter(pkg => pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) || pkg.type.toLowerCase().includes(searchQuery.toLowerCase())).map(pkg => (
                  <div key={pkg.id} className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-gray-100 group">
                    <div className="h-56 relative overflow-hidden">
                      <img src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                      <div className="absolute top-4 left-4 bg-orange-500 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{pkg.type.replace('_', ' ')}</div>
                    </div>
                    <div className="p-8">
                      <h4 className="text-xl font-black text-blue-900 mb-2 truncate">{pkg.title}</h4>
                      <p className="text-gray-400 text-xs mb-6 line-clamp-2">{pkg.description}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prix Agence</span>
                          <span className="text-xl font-black text-blue-900">{((pkg.priceAdult || pkg.price) * 0.95).toLocaleString()} DA</span>
                        </div>
                        <button onClick={() => handleStartBooking(pkg)} className="bg-orange-500 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Réserver</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'form' && selectedPkg && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setView('booking')} className="flex items-center space-x-2 text-blue-900 font-black text-[10px] uppercase tracking-widest mb-8 hover:translate-x-[-4px] transition-transform">
                <ArrowLeft size={16} />
                <span>Retour au catalogue</span>
              </button>
              <BookingForm
                user={user}
                initialService={selectedPkg.type}
                packageName={selectedPkg.title}
                packageId={selectedPkg.id}
                initialBasePrice={(selectedPkg.priceAdult || selectedPkg.price) * 0.95}
                priceAdult={(selectedPkg.priceAdult || selectedPkg.price) * 0.95}
                priceChild={selectedPkg.priceChild ? selectedPkg.priceChild * 0.95 : undefined}
                priceBaby={selectedPkg.priceBaby ? selectedPkg.priceBaby * 0.95 : undefined}
                availableStock={selectedPkg.stock}
                onSuccess={handleBookingSuccess}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgencySpace;
