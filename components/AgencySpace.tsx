
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  Users, FileText, TrendingUp, AlertCircle, DollarSign, Briefcase, Plus,
  Ticket, Globe, Download, Settings, Lock, ShieldCheck, Wallet,
  LayoutDashboard, History, UserPlus, LogOut, ChevronRight,
  ArrowUpRight, Landmark, Mail, Building2, Fingerprint, ShieldAlert, CheckCircle, Search, ArrowLeft, MessageSquare, FileText as FileIcon
} from 'lucide-react';
import { User, Booking, TravelPackage, ServiceType } from '../types';
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
  onNavigateBilleterie: () => void;
}

const AgencySpace: React.FC<AgencySpaceProps> = ({ user, packages, bookings, onLogout, onLoginSuccess, onNewB2BBooking, onViewVoucher, onNavigateBilleterie }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'booking' | 'form' | 'history'>('dashboard');
  const [selectedPkg, setSelectedPkg] = useState<TravelPackage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    agencyName: '',
    fullName: '',
    email: '',
    password: '',
    licenseNumber: ''
  });

  const agencyBookings = useMemo(() => {
    return bookings.filter(b => b.agencyId === user?.id);
  }, [bookings, user]);

  const revenueData = [
    { name: 'Jan', sales: 4200, profit: 800 },
    { name: 'Feb', sales: 3100, profit: 600 },
    { name: 'Mar', sales: 5500, profit: 1100 },
    { name: 'Apr', sales: 4800, profit: 950 },
    { name: 'May', sales: 6200, profit: 1300 },
    { name: 'Jun', sales: 7100, profit: 1550 },
  ];

  const handleB2BAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    const emailToUse = formData.email.trim();
    const passwordToUse = formData.password;

    try {
      if (isRegistering) {
        // Register Agent
        const { user, error } = await authService.register({
          email: emailToUse,
          password: passwordToUse,
          agencyName: formData.agencyName || "Agence Partenaire",
          isAgent: true
        });

        if (error) {
          alert(error);
          setIsLoading(false);
          return;
        }
        if (user) onLoginSuccess(user);

      } else {
        // Login Agent
        const { user, error } = await authService.login(emailToUse, passwordToUse);

        if (error) {
          alert(error);
          setIsLoading(false);
          return;
        }
        // Check Role consistency just in case
        if (user && user.role !== 'AGENT' && user.role !== 'ADMIN') {
          alert("Ce compte n'est pas un compte Agence.");
          setIsLoading(false);
          return;
        }
        if (user) onLoginSuccess(user);
      }
    } catch (err) {
      console.error("Auth Error", err);
      alert("Erreur de connexion.");
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
  };

  if (!user || (user.role !== 'AGENT' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-[50px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row animate-in fade-in zoom-in-95 duration-500">
          <div className="lg:w-1/2 bg-blue-900 p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-800 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl opacity-50"></div>
            <div className="relative z-10">
              <div className="text-3xl font-black mb-16 tracking-tighter uppercase italic">
                Cheap <span className="text-orange-500">Travel</span> <span className="text-xs font-bold block text-blue-400 -mt-1 tracking-[0.4em]">B2B Enterprise</span>
              </div>
              <h2 className="text-5xl font-black mb-8 leading-tight">{isRegistering ? 'Partnership Starts Here.' : 'Console Partenaire.'}</h2>
              <div className="space-y-6">
                {[{ icon: Ticket, title: 'Tarifs Nets', desc: 'Accès direct aux prix de gros IATA sans frais supplémentaires.' }, { icon: ShieldCheck, title: 'Portefeuille Sécurisé', desc: 'Système de dépôt pour émission instantanée de billets.' }, { icon: Landmark, title: 'Visa Hub', desc: 'Traitement en masse des visas Omrah et groupes.' }].map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-4">
                    <div className="p-3 bg-white/10 rounded-2xl"><feature.icon size={20} className="text-orange-400" /></div>
                    <div><h4 className="font-bold text-sm">{feature.title}</h4><p className="text-blue-300 text-xs mt-1 leading-relaxed">{feature.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative z-10 mt-12 pt-12 border-t border-white/10 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Portail Officiel Agence</p>
              <div className="flex -space-x-3">{[1, 2, 3, 4].map(i => (<div key={i} className="w-8 h-8 rounded-full border-2 border-blue-900 bg-gray-200 overflow-hidden"><img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="Partner" /></div>))}</div>
            </div>
          </div>
          <div className="lg:w-1/2 p-12 lg:p-16 flex flex-col justify-center bg-gray-50/30">
            <div className="max-w-md mx-auto w-full">
              <h3 className="text-2xl font-black text-blue-900 mb-2">{isRegistering ? 'Inscription Partenaire' : 'Connexion Professionnelle'}</h3>
              <p className="text-gray-400 text-sm font-medium mb-10">{isRegistering ? 'Rejoignez notre réseau de distribution national.' : 'Entrez vos identifiants pour accéder à votre console.'}</p>
              <form onSubmit={(e) => handleB2BAuth(e)} className="space-y-4">
                {isRegistering && (
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input required type="text" placeholder="Nom Légal de l'Agence" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.agencyName} onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })} />
                  </div>
                )}
                <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" placeholder="Email ou Nom d'utilisateur" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="password" placeholder="Mot de passe" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 focus:outline-none font-bold text-blue-900 transition-all text-sm" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
                <button disabled={isLoading} type="submit" className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center space-x-3 mt-6">{isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="uppercase tracking-[0.2em] text-[10px]">{isRegistering ? 'Inscrire l\'agence' : 'Accéder au Portail'}</span><ChevronRight size={18} /></>}</button>
              </form>
              <div className="mt-10 flex flex-col items-center space-y-4">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black text-gray-400 hover:text-blue-900 uppercase tracking-widest transition-colors">{isRegistering ? "Déjà partenaire ? Se connecter" : "Devenir partenaire ? S'inscrire"}</button>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className={`flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between p-8 rounded-[40px] border shadow-2xl ${user.role === 'ADMIN' ? 'bg-[#0a0c10] border-white/10 text-white' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center space-x-6">
          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg ${user.role === 'ADMIN' ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-blue-900 text-white shadow-blue-900/20'}`}>{user.role === 'ADMIN' ? <ShieldAlert size={32} /> : <LayoutDashboard size={32} />}</div>
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${user.role === 'ADMIN' ? 'text-white' : 'text-blue-900'}`}>{user.role === 'ADMIN' ? 'Console de Direction' : 'Console B2B'}</h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="flex items-center space-x-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span>Système Opérationnel</span></span>
              <span className={`${user.role === 'ADMIN' ? 'text-gray-500' : 'text-gray-400'} text-[10px] font-bold uppercase tracking-widest border-l pl-4 border-gray-700`}>{user.role === 'ADMIN' ? 'Mode Propriétaire' : user.agencyName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full xl:w-auto">
          {user.role === 'ADMIN' ? (
            <div className="flex items-center space-x-3 bg-orange-500/10 border border-orange-500/20 p-5 rounded-[24px] text-orange-500 animate-pulse"><CheckCircle size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Connecté en tant que Super Admin</span></div>
          ) : (
            <>
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl flex items-center space-x-4 min-w-[200px]">
                <div className="p-3 bg-orange-500 text-white rounded-2xl"><Wallet size={20} /></div>
                <div><p className="text-[9px] font-black text-orange-800 uppercase tracking-widest mb-0.5">Solde B2B</p><p className="text-xl font-black text-orange-600">{user.walletBalance.toLocaleString()} DA</p></div>
              </div>
              <button className="bg-blue-900 text-white px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-900/10 shrink-0">+ Crédit</button>
            </>
          )}
          <button onClick={onLogout} className={`p-5 rounded-[24px] transition-all border ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-red-50 hover:text-red-500'}`}><LogOut size={20} /></button>
        </div>
      </div>

      {user.role === 'ADMIN' ? (
        <div className="bg-[#0f1218] border border-white/5 p-20 rounded-[60px] text-center text-white shadow-inner">
          <h3 className="text-5xl font-black mb-6 tracking-tighter">Accès Administrateur Validé</h3>
          <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">Identité vérifiée. Contrôle total activé.</p>
          <div className="flex flex-col items-center justify-center space-y-6"><div className="p-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-bounce"><div className="bg-[#0a0c10] p-4 rounded-full"><ChevronRight size={32} className="rotate-[-90deg] text-orange-500" /></div></div><p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">Cliquez sur "Super Admin" en haut</p></div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="flex items-center space-x-4 bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm w-fit">
            <button onClick={() => setView('dashboard')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>Tableau de Bord</button>
            <button onClick={() => setView('booking')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'booking' || view === 'form' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>Nouvelle Réservation</button>
            <button onClick={() => setView('history')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-blue-900'}`}>Historique Ventes</button>
          </div>

          {view === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[{ label: 'Ventes du Mois', val: '2.4M', color: 'blue', icon: TrendingUp }, { label: 'Commission Net', val: '185K', color: 'green', icon: DollarSign }, { label: 'Billets Émis', val: '342', color: 'orange', icon: Ticket }].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"><div className={`p-3 w-fit bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl mb-6`}><stat.icon size={20} /></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p><h3 className="text-3xl font-black text-blue-900 mt-2">{stat.val} <span className="text-xs font-bold">DA</span></h3></div>
                  ))}
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm"><div className="flex items-center justify-between mb-10"><h3 className="text-xl font-black text-blue-900">Activité Commerciale</h3><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temps Réel</span></div><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} /><Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} /><Area type="monotone" dataKey="sales" stroke="#1e3a8a" strokeWidth={4} fillOpacity={0.1} fill="#1e3a8a" /></AreaChart></ResponsiveContainer></div></div>
              </div>
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-blue-900 mb-6">Actions Rapides</h3>
                  <div className="space-y-3">
                    {[{ label: 'Groupe Visa', icon: UserPlus }, { label: 'Mes Agents', icon: Users }, { label: 'Factures GDS', icon: FileText }].map((action, i) => (<button key={i} className="w-full flex items-center p-5 bg-gray-50 hover:bg-blue-50 border border-transparent rounded-3xl transition-all text-left"><div className="p-3 bg-white text-blue-900 rounded-2xl shadow-sm"><action.icon size={18} /></div><span className="ml-4 text-xs font-black text-blue-900 tracking-tight">{action.label}</span><ArrowUpRight size={16} className="ml-auto text-gray-300" /></button>))}
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
              <h3 className="text-2xl font-black text-blue-900 mb-8 tracking-tighter">Historique des Ventes Agence</h3>
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
