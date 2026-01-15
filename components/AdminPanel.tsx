
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { 
  LayoutDashboard, Users, Package, FileText, Settings, Plus, 
  Search, Trash2, Edit, CheckCircle, TrendingUp, DollarSign, 
  Moon, Ticket, Download, ShieldAlert, X, Image as ImageIcon,
  Clock, Plane, Globe, Filter, ChevronDown, UserCheck, Briefcase,
  AlertTriangle, CheckCircle2, Inbox, Building2, Wallet, Database, RefreshCcw, Upload, FileJson, Link, Link2Off, Baby, Camera, Trash, Server, MessageSquare, FileText as FileIcon, BarChart3, Bell, Send, Loader2, Mail, Zap
} from 'lucide-react';
import { Booking, TravelPackage, ServiceType, Subscriber } from '../types';
import { dbService } from '../services/dbService';
import { formatWhatsAppMessage } from '../constants';

// Added helper function to resolve styles for different booking statuses
const getStatusColor = (status: Booking['status']) => {
  switch (status) {
    case 'Confirmed':
      return 'bg-green-500/10 text-green-500 border border-green-500/20';
    case 'Completed':
      return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    case 'Pending':
      return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
    case 'Cancelled':
      return 'bg-red-500/10 text-red-500 border border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
  }
};

interface AdminPanelProps {
  bookings: Booking[];
  packages: TravelPackage[];
  onUpdateBooking: (id: string, status: Booking['status']) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onAddPackage: (pkg: TravelPackage) => Promise<void>;
  onUpdatePackage: (pkg: TravelPackage) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onResetSystem: () => Promise<void>;
  dbStatus: { connected: boolean, type: string, endpoint: string };
  onViewVoucher: (booking: Booking) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  bookings, 
  packages, 
  onUpdateBooking, 
  onDeleteBooking,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  onResetSystem,
  dbStatus,
  onViewVoucher
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'clients' | 'packages' | 'bookings' | 'agencies' | 'settings' | 'newsletter'>('stats');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const packageImageRef = useRef<HTMLInputElement>(null);

  // Newsletter & Marketing State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [broadcastTarget, setBroadcastTarget] = useState<TravelPackage | null>(null);
  const [broadcastProgress, setBroadcastProgress] = useState(-1);

  // Calculate Unified Reach (Subscribers + Unique Customer emails from bookings)
  const unifiedAudience = useMemo(() => {
    const subscriberEmails = subscribers.map(s => s.email.toLowerCase());
    const customerEmails = bookings
      .filter(b => b.contact && b.contact.includes('@'))
      .map(b => b.contact!.toLowerCase());
    
    // Merge and Deduplicate
    const allEmails = Array.from(new Set([...subscriberEmails, ...customerEmails]));
    return {
      total: allEmails.length,
      subscribers: subscribers.length,
      customers: allEmails.length - subscribers.length,
      emails: allEmails
    };
  }, [subscribers, bookings]);

  useEffect(() => {
    dbService.getSubscribers().then(setSubscribers);
  }, [activeTab]);
  
  const [packageForm, setPackageForm] = useState<Partial<TravelPackage>>({
    title: '', price: 0, type: 'VOYAGE_ORGANISE', description: '', duration: '', stock: 20,
    priceAdult: 0, priceChild: 0, priceBaby: 0,
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=2071&auto=format&fit=crop'
  });

  const statsData = useMemo(() => {
    const totalRev = bookings.reduce((acc, curr) => acc + curr.amount, 0);
    const visaSales = bookings.filter(b => b.service === 'VISA' || b.service === 'E-VISA').length;
    const omrahSales = bookings.filter(b => b.service === 'OMRAH').length;

    return [
      { label: 'Revenu Global', val: `${totalRev.toLocaleString()} DA`, icon: DollarSign, trend: '+14%', color: 'blue' },
      { label: 'Visa & E-Visa', val: visaSales.toString(), icon: Globe, trend: '+5%', color: 'orange' },
      { label: 'Vols & Omrah', val: (omrahSales + bookings.filter(b => b.service === 'BILLETERIE').length).toString(), icon: Plane, trend: '+12%', color: 'purple' },
      { label: 'Audience Reach', val: unifiedAudience.total.toString(), icon: Zap, trend: 'Newsletter', color: 'green' },
    ];
  }, [bookings, packages, unifiedAudience]);

  const chartData = useMemo(() => {
    const services = ['OMRAH', 'VISA', 'BILLETERIE', 'VOYAGE_ORGANISE'];
    return services.map(s => ({
       name: s,
       value: bookings.filter(b => b.service.includes(s)).length
    }));
  }, [bookings]);

  const COLORS = ['#1e3a8a', '#f97316', '#a855f7', '#10b981'];

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus = bookingFilter === 'All' || b.status === bookingFilter;
      const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           b.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingFilter, searchTerm]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(s => s.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [subscribers, searchTerm]);

  const handleBroadcast = (pkg: TravelPackage) => {
     if (unifiedAudience.total === 0) {
        alert("Aucun destinataire disponible pour la diffusion.");
        return;
     }
     setBroadcastTarget(pkg);
     setBroadcastProgress(0);
     
     let progress = 0;
     const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
           setBroadcastProgress(100);
           clearInterval(interval);
           setTimeout(() => {
              setBroadcastProgress(-1);
              setBroadcastTarget(null);
           }, 2000);
        } else {
           setBroadcastProgress(progress);
        }
     }, 200);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      if (editingPkgId) {
        await onUpdatePackage({ ...packageForm, id: editingPkgId } as TravelPackage);
      } else {
        const pkg: TravelPackage = {
          ...packageForm,
          id: 'PKG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        } as TravelPackage;
        await onAddPackage(pkg);
      }
      setShowPackageModal(false);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (confirm("Supprimer cet abonné ?")) {
       // Mock deletion as dbService doesn't have a direct deleteSub yet, 
       // but in a real app you'd call a service.
       setSubscribers(subscribers.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex min-h-[85vh] bg-[#0a0c10] rounded-[40px] overflow-hidden shadow-2xl border border-white/5 relative">
      {/* Sidebar */}
      <div className="w-72 bg-[#0f1218] border-r border-white/5 p-8 flex flex-col">
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-2">
            <ShieldAlert size={20} className="text-orange-500" />
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Direct Control</p>
          </div>
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Cheap <span className="text-orange-500">Admin</span></h2>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'bookings', label: 'Réservations', icon: FileText },
            { id: 'packages', label: 'Gestion Trips', icon: Package },
            { id: 'newsletter', label: 'Bons Plans', icon: Mail },
            { id: 'agencies', label: 'Réseau B2B', icon: Building2 },
            { id: 'settings', label: 'Système', icon: Database },
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setSearchTerm(''); }} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><item.icon size={16} /><span>{item.label}</span></button>
          ))}
        </nav>
        <div className="pt-8 mt-auto border-t border-white/5">
           <div className={`p-4 rounded-2xl border flex items-center space-x-3 ${dbStatus.connected ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
              <Server size={16} />
              <div className="overflow-hidden">
                <p className="text-[8px] font-black uppercase tracking-widest">Database</p>
                <p className="text-[10px] font-bold truncate opacity-50">{dbStatus.type}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2 uppercase italic">
              {activeTab === 'stats' ? 'Insights' : activeTab === 'bookings' ? 'Dossiers' : activeTab === 'packages' ? 'Catalogue' : activeTab === 'newsletter' ? 'Audience' : 'Settings'}
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Environnement de Gestion Cheap Travel</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500" size={16} /><input type="text" placeholder="Recherche..." className="bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 w-72 placeholder:text-gray-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            {activeTab === 'packages' && (<button onClick={() => setShowPackageModal(true)} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center space-x-3"><Plus size={18} /><span>Nouvelle Offre</span></button>)}
          </div>
        </header>

        {activeTab === 'stats' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[32px] hover:bg-white/10 transition-all group overflow-hidden"><div className={`p-4 bg-white/5 text-${stat.color}-400 rounded-2xl w-fit mb-6`}><stat.icon size={28} /></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p><div className="flex items-baseline justify-between"><h3 className="text-3xl font-black text-white">{stat.val}</h3><span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">{stat.trend}</span></div></div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 p-10 rounded-[40px] flex flex-col md:flex-row items-center gap-12">
                  <div className="w-full h-72">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                              {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                           </Pie>
                           <RechartsTooltip contentStyle={{ backgroundColor: '#0f1218', border: 'none', borderRadius: '16px' }} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-4">
                     <h3 className="text-xl font-black text-white mb-6">Répartition Activité</h3>
                     {chartData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                           <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                              <span className="text-[10px] font-black uppercase text-gray-400">{d.name}</span>
                           </div>
                           <span className="text-sm font-black text-white">{d.value}</span>
                        </div>
                     ))}
                  </div>
               </div>
               
               <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-10 rounded-[40px] text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-orange-500/20 group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Send size={240} /></div>
                  <div className="relative z-10">
                     <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl w-fit mb-6"><Zap size={24} /></div>
                     <h3 className="text-3xl font-black tracking-tighter mb-4">Moteur de <br/>Marketing</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-2">
                           <span className="opacity-60">Newsletter Direct</span>
                           <span>{unifiedAudience.subscribers}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-2">
                           <span className="opacity-60">Anciens Clients</span>
                           <span>{unifiedAudience.customers}</span>
                        </div>
                        <div className="pt-2">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Portée Totale</p>
                           <p className="text-4xl font-black">{unifiedAudience.total}</p>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setActiveTab('newsletter')} className="relative z-10 mt-8 w-full bg-black/20 hover:bg-black/40 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Consulter l'audience</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden shadow-2xl">
               <div className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-white/[0.01] gap-6">
                  <div>
                     <h3 className="text-3xl font-black text-white tracking-tighter">Inscriptions Newsletter</h3>
                     <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Gérez votre base de leads marketing</p>
                  </div>
                  <div className="bg-blue-600/10 text-blue-400 px-6 py-3 rounded-2xl border border-blue-600/20 text-[11px] font-black uppercase tracking-widest">
                    Audience Validée: {subscribers.length}
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">
                           <th className="px-10 py-8">ID</th>
                           <th className="px-6 py-8">Email Abonné</th>
                           <th className="px-6 py-8">Date d'inscription</th>
                           <th className="px-10 py-8 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {filteredSubscribers.map((sub) => (
                           <tr key={sub.id} className="group hover:bg-white/[0.03] transition-all">
                              <td className="px-10 py-8 text-blue-400 font-black text-[11px]">#{sub.id}</td>
                              <td className="px-6 py-8 font-bold text-white">{sub.email}</td>
                              <td className="px-6 py-8 text-xs text-gray-500 font-bold">{new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}</td>
                              <td className="px-10 py-8 text-right">
                                 <button onClick={() => handleDeleteSubscriber(sub.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden group flex flex-col hover:bg-white/10 transition-all">
                <div className="h-60 relative overflow-hidden">
                  <img src={pkg.image} className="w-full h-full object-cover opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all duration-[2s]" />
                  <div className="absolute top-6 right-6 flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleBroadcast(pkg)} className="bg-orange-500 p-3 rounded-2xl text-white hover:bg-black transition-all" title="Diffuser cette offre"><Bell size={16} /></button>
                    <button onClick={() => { setEditingPkgId(pkg.id); setPackageForm(pkg); setShowPackageModal(true); }} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all"><Edit size={16} /></button>
                  </div>
                  <div className="absolute bottom-6 left-6 bg-blue-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">{pkg.type.replace('_', ' ')}</div>
                </div>
                <div className="p-10 flex-1 flex flex-col">
                  <h4 className="text-2xl font-black text-white tracking-tighter mb-3 leading-tight group-hover:text-blue-400 transition-colors">{pkg.title}</h4>
                  <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Prix Client</p>
                      <p className="text-2xl font-black text-orange-500">{(pkg.priceAdult || pkg.price).toLocaleString()} DA</p>
                    </div>
                    <div className="flex items-center space-x-2 text-green-500 text-[10px] font-black uppercase"><Inbox size={14} /><span>{pkg.stock} places</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookings' && (
           <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden shadow-2xl animate-in fade-in">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                 <h3 className="text-3xl font-black text-white tracking-tighter">Ventes & Flux</h3>
                 <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-3">
                    <Filter size={16} className="text-blue-500" />
                    <select className="bg-transparent text-[11px] font-black text-white uppercase outline-none" value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)}>
                       <option value="All">Tout</option>
                       <option value="Pending">En Attente</option>
                       <option value="Confirmed">Confirmé</option>
                    </select>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">
                          <th className="px-10 py-8">Réf</th>
                          <th className="px-6 py-8">Client</th>
                          <th className="px-6 py-8">Service</th>
                          <th className="px-6 py-8">Statut</th>
                          <th className="px-10 py-8 text-right">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {filteredBookings.map(bk => (
                          <tr key={bk.id} className="hover:bg-white/[0.03] transition-all">
                             <td className="px-10 py-8 text-blue-400 font-black text-[11px]">#{bk.id}</td>
                             <td className="px-6 py-8"><p className="text-sm font-black text-white">{bk.customerName}</p></td>
                             <td className="px-6 py-8"><span className="text-[9px] font-black uppercase bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-gray-300">{bk.service.replace('_', ' ')}</span></td>
                             <td className="px-6 py-8"><span className={`text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest ${getStatusColor(bk.status)}`}>{bk.status}</span></td>
                             <td className="px-10 py-8 text-right font-black text-white text-lg">{bk.amount.toLocaleString()} DA</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

      </div>

      {/* Broadcast Command Center Overlay */}
      {broadcastProgress >= 0 && (
         <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
            <div className="relative w-full max-w-xl bg-[#0f1218] border border-white/10 rounded-[60px] p-16 text-center shadow-2xl">
               <div className="mb-10 relative inline-block">
                  <div className="w-32 h-32 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto relative z-10">
                     {broadcastProgress < 100 ? <Loader2 className="animate-spin" size={60} /> : <CheckCircle2 className="text-green-500 scale-125 transition-transform" size={60} />}
                  </div>
                  <div className="absolute inset-0 bg-blue-600/10 rounded-full animate-ping opacity-20"></div>
               </div>
               
               <h3 className="text-4xl font-black text-white tracking-tighter mb-4">
                  {broadcastProgress < 100 ? 'Diffusion Active' : 'Diffusion Terminée'}
               </h3>
               
               <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-12 max-w-sm mx-auto leading-relaxed">
                  {broadcastProgress < 100 
                    ? `Envoi de l'offre "${broadcastTarget?.title}" à ${unifiedAudience.total} contacts via Email & Push...` 
                    : `L'offre a été transmise avec succès à l'ensemble de votre base de données.`}
               </p>

               <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4 p-0.5">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${broadcastProgress}%` }}></div>
               </div>
               <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">
                  <span>Progression</span>
                  <span>{Math.round(broadcastProgress)}%</span>
               </div>

               {broadcastProgress === 100 && (
                 <button onClick={() => setBroadcastProgress(-1)} className="mt-12 w-full bg-white text-black font-black py-5 rounded-3xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Retour à la console</button>
               )}
            </div>
         </div>
      )}

      {/* MODAL (Existing logic for Package Edit/Add) */}
      {showPackageModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowPackageModal(false)}></div>
           <div className="relative w-full max-w-3xl bg-[#0f1218] border border-white/10 rounded-[56px] p-12 lg:p-16 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-12">
                 <h3 className="text-4xl font-black text-white tracking-tighter">{editingPkgId ? 'Modifier' : 'Nouvelle Offre'}</h3>
                 <button onClick={() => setShowPackageModal(false)} className="p-4 bg-white/5 text-gray-500 rounded-full hover:text-white transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSavePackage} className="space-y-10">
                 <input required type="text" placeholder="Titre de l'Offre" className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-blue-500" value={packageForm.title} onChange={e => setPackageForm({...packageForm, title: e.target.value})} />
                 <div className="grid grid-cols-2 gap-8">
                    <input type="number" placeholder="Prix Client" className="bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black" value={packageForm.priceAdult} onChange={e => setPackageForm({...packageForm, priceAdult: parseInt(e.target.value), price: parseInt(e.target.value)})} />
                    <input type="text" placeholder="Durée" className="bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black" value={packageForm.duration} onChange={e => setPackageForm({...packageForm, duration: e.target.value})} />
                 </div>
                 <button type="submit" disabled={isActionLoading} className="w-full bg-blue-600 text-white font-black py-6 rounded-[32px] uppercase tracking-[0.4em] text-[11px] hover:bg-orange-600 transition-all shadow-2xl">
                    {isActionLoading ? 'Synchronisation...' : 'Valider Publication'}
                 </button>
              </form>
           </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #ffffff10; border-radius: 10px; }`}</style>
    </div>
  );
};

export default AdminPanel;
