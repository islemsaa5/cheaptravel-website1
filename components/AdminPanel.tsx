
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
   PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import {
   LayoutDashboard, Users, Package, FileText, Settings, Plus,
   Search, Trash2, Edit, CheckCircle, TrendingUp, DollarSign,
   Moon, Ticket, Download, ShieldAlert, X, Image as ImageIcon,
   Clock, Plane, Globe, Filter, ChevronDown, UserCheck, Briefcase, FileDown,
   Bell, Loader2, CheckCircle2, Mail, Building2, Database, Server,
   UploadCloud, Play, Home, LogOut, User as UserIcon, AlertTriangle, Inbox,
   Wallet, RefreshCcw, Upload, FileJson, Link, Link2Off, Baby,
   Camera, Trash, MessageSquare, BarChart3, Send, Zap
} from 'lucide-react';
import { Booking, TravelPackage, ServiceType, Subscriber, User } from '../types';
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
   onNotify?: (message: string) => void;
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
   onViewVoucher,
   onNotify
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

   // AGENCY MANAGEMENT STATE
   const [agents, setAgents] = useState<User[]>([]);
   const [walletTopUp, setWalletTopUp] = useState<{ id: string, amount: string } | null>(null);

   // DELETE MODAL STATE
   const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'booking' | 'package' | 'subscriber', id: string, title?: string } | null>(null);

   // Calculate Unified Reach (Subscribers + Unique Customer emails from bookings)
   const unifiedAudience = useMemo(() => {
      const subscriberEmails = subscribers.map(s => s.email.toLowerCase());
      const customerEmails = bookings
         .filter(b => b.contact && b.contact.includes('@'))
         .map(b => {
            const parts = b.contact!.toLowerCase().split('|');
            return parts.find(p => p.includes('@'))?.trim() || '';
         })
         .filter(email => email.length > 0 && email.includes('@'));

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
      if (activeTab === 'newsletter') dbService.getSubscribers().then(setSubscribers);
      if (activeTab === 'agencies') dbService.getAgents().then(setAgents);
   }, [activeTab]);

   const handleUpdateAgentStatus = async (agent: User, status: 'APPROVED' | 'REJECTED') => {
      if (!confirm(`Voulez-vous vraiment changer le statut de ${agent.agencyName} en ${status} ?`)) return;
      const updated = { ...agent, status: status };
      await dbService.updateProfile(updated);
      setAgents(prev => prev.map(a => a.id === agent.id ? updated : a));
   };

   const handleTopUpWallet = async (agent: User) => {
      if (!walletTopUp || walletTopUp.id !== agent.id) return;
      const amount = parseInt(walletTopUp.amount);
      if (isNaN(amount) || amount <= 0) return alert("Montant invalide");

      if (!confirm(`Ajouter ${amount.toLocaleString()} DA au portefeuille de ${agent.agencyName} ?`)) return;

      const updated = { ...agent, walletBalance: agent.walletBalance + amount };
      await dbService.updateProfile(updated);
      setAgents(prev => prev.map(a => a.id === agent.id ? updated : a));
      setWalletTopUp(null);
      alert("Portefeuille mis à jour avec succès");
   };

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
               if (onNotify && broadcastTarget) onNotify(`Diffusion de l'offre "${broadcastTarget.title}" envoyée avec succès.`);
               setBroadcastProgress(-1);
               setBroadcastTarget(null);
            }, 2000);
         } else {
            setBroadcastProgress(progress);
         }
      }, 200);
   };

   const handleConfirmDelete = async () => {
      if (!deleteConfirm) return;

      const { type, id } = deleteConfirm;
      try {
         if (type === 'package') await onDeletePackage(id);
         if (type === 'booking') await onDeleteBooking(id);
         if (type === 'subscriber') await handleDeleteSubscriber(id, true); // Update sub handler signature below
      } catch (err) {
         console.error("Delete failed", err);
      } finally {
         setDeleteConfirm(null);
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
            setPackageForm(prev => ({ ...prev, image: reader.result as string }));
         };
         reader.readAsDataURL(file);
      }
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

   const generateBookingPDF = (booking: Booking) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // -- HEADER (No Logo) --
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('CHEAP TRAVEL - Agence de Voyage', 15, 15);

      // Invoice / Ticket details
      doc.setFontSize(30);
      doc.setTextColor(200, 200, 200);
      doc.setFont('helvetica', 'bold');
      doc.text(booking.status === 'Confirmed' ? 'TICKET' : 'DOCUMENT', pageWidth - 15, 25, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Réf: #${booking.id}`, pageWidth - 15, 32, { align: 'right' });
      doc.text(`Date: ${new Date(booking.date).toLocaleDateString('fr-FR')}`, pageWidth - 15, 37, { align: 'right' });

      // -- CLIENT INFO --
      doc.setDrawColor(240);
      doc.line(15, 45, pageWidth - 15, 45);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS CLIENT', 15, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(`Nom: ${booking.customerName}`, 15, 62);
      doc.text(`Contact: ${booking.contact || 'N/A'}`, 15, 67);
      doc.text(`Adresse: ${booking.address || 'Non renseignée'}`, 15, 72);

      // -- TRIP INFO --
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('DÉTAILS DU VOYAGE', pageWidth / 2, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(`Service: ${booking.service.replace('_', ' ')}`, pageWidth / 2, 62);
      if (booking.packageId) {
         const pkg = packages.find(p => p.id === booking.packageId);
         if (pkg) doc.text(`Offre: ${pkg.title}`, pageWidth / 2, 67);
      }
      doc.text(`Statut: ${booking.status === 'Confirmed' ? 'CONFIRMÉ' : booking.status}`, pageWidth / 2, 72);

      // -- TRAVELERS TABLE --
      if (booking.travelers && booking.travelers.length > 0) {
         const tableData = booking.travelers.map(t => [
            t.firstName,
            t.lastName,
            t.type,
            t.dateOfBirth || '-',
            t.passportNumber || '-'
         ]);

         autoTable(doc, {
            startY: 85,
            head: [['Prénom', 'Nom', 'Type', 'Date Naissance', 'Passeport']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 247, 250] }
         });
      }

      // -- TOTAL --
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 85;

      doc.setFillColor(245, 250, 255);
      doc.rect(pageWidth - 80, finalY + 10, 65, 25, 'F');

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL PAYÉ', pageWidth - 75, finalY + 18);

      doc.setFontSize(16);
      doc.setTextColor(37, 99, 235);
      doc.text(`${booking.amount.toLocaleString()} DA`, pageWidth - 75, finalY + 28);

      // -- FOOTER --
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('Merci de voyager avec Cheap Travel.', 15, 280);
      doc.text('Agence Agrée - Alger, Algérie - Tél: +213 555 123 456', 15, 285);

      // Save
      doc.save(`Ticket_CheapTravel_${booking.id}.pdf`);
   };

   const handleDeleteSubscriber = async (id: string, confirmed = false) => {
      if (confirmed) {
         setSubscribers(subscribers.filter(s => s.id !== id));
      } else {
         setDeleteConfirm({ type: 'subscriber', id, title: 'Abonné Newsletter' });
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
                           <h3 className="text-3xl font-black tracking-tighter mb-4">Moteur de <br />Marketing</h3>
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

            {activeTab === 'agencies' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden shadow-2xl">
                     <div className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-white/[0.01] gap-6">
                        <div>
                           <h3 className="text-3xl font-black text-white tracking-tighter">Réseau Partenaires B2B</h3>
                           <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Gérez les accréditations et les portefeuilles des agences.</p>
                        </div>
                        <div className="bg-blue-600/10 text-blue-400 px-6 py-3 rounded-2xl border border-blue-600/20 text-[11px] font-black uppercase tracking-widest">
                           {agents.length} Partenaires
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">
                                 <th className="px-10 py-8">Agence</th>
                                 <th className="px-6 py-8">Contact</th>
                                 <th className="px-6 py-8">Statut</th>
                                 <th className="px-6 py-8">Solde</th>
                                 <th className="px-10 py-8 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {agents.map(agent => (
                                 <tr key={agent.id} className="group hover:bg-white/[0.03] transition-all">
                                    <td className="px-10 py-8">
                                       <div className="flex items-center space-x-4">
                                          <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center font-bold">
                                             {agent.agencyName?.substring(0, 2).toUpperCase()}
                                          </div>
                                          <div>
                                             <p className="text-sm font-bold text-white">{agent.agencyName}</p>
                                             <p className="text-[10px] text-gray-500 font-bold tracking-wide">ID: {agent.id}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-8 text-xs font-bold text-gray-400">
                                       {agent.email}
                                    </td>
                                    <td className="px-6 py-8">
                                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${agent.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                          agent.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                          }`}>
                                          {agent.status || 'PENDING'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-8">
                                       <div className="flex items-center space-x-2">
                                          <Wallet size={14} className="text-white/40" />
                                          <span className="text-sm font-black text-white">{agent.walletBalance.toLocaleString()} DA</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                       <div className="flex items-center justify-end space-x-2">
                                          {walletTopUp?.id === agent.id ? (
                                             <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 shadow-lg animate-in fade-in zoom-in">
                                                <input
                                                   type="number"
                                                   placeholder="Montant"
                                                   autoFocus
                                                   className="w-24 text-xs font-bold p-2 outline-none bg-transparent text-white placeholder-gray-600"
                                                   onChange={(e) => setWalletTopUp({ ...walletTopUp, amount: e.target.value })}
                                                />
                                                <button onClick={() => handleTopUpWallet(agent)} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-500"><CheckCircle size={14} /></button>
                                                <button onClick={() => setWalletTopUp(null)} className="bg-white/10 text-gray-400 p-2 rounded-lg hover:bg-white/20 ml-1"><X size={14} /></button>
                                             </div>
                                          ) : (
                                             <button
                                                onClick={() => setWalletTopUp({ id: agent.id, amount: '' })}
                                                className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                                             >
                                                + Crédit
                                             </button>
                                          )}

                                          {agent.status !== 'APPROVED' && (
                                             <button onClick={() => handleUpdateAgentStatus(agent, 'APPROVED')} className="p-2 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-600 hover:text-white transition-all" title="Approuver"><CheckCircle size={16} /></button>
                                          )}
                                          {agent.status !== 'REJECTED' && (
                                             <button onClick={() => handleUpdateAgentStatus(agent, 'REJECTED')} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="Bloquer"><X size={16} /></button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                              {agents.length === 0 && (
                                 <tr><td colSpan={5} className="text-center py-10 text-gray-500 font-bold text-xs uppercase tracking-widest">Aucune agence inscrite pour le moment.</td></tr>
                              )}
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
                           <img src={pkg.image} className="w-full h-full object-cover opacity-50 transition-all duration-[2s]" />
                           <div className="absolute top-6 right-6 flex items-center space-x-3 transition-all z-[100]">
                              <button onClick={(e) => { e.stopPropagation(); handleBroadcast(pkg); }} className="bg-orange-500 p-3 rounded-2xl text-white hover:bg-black transition-all relative z-50 cursor-pointer shadow-xl hover:scale-110" title="Diffuser cette offre"><Bell size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingPkgId(pkg.id); setPackageForm(pkg); setShowPackageModal(true); }} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all relative z-50 cursor-pointer shadow-xl hover:scale-110"><Edit size={16} /></button>
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({ type: 'package', id: pkg.id, title: pkg.title });
                                 }}
                                 className="bg-red-500/10 backdrop-blur-md p-3 rounded-2xl text-red-500 hover:bg-red-600 hover:text-white transition-all relative z-50 cursor-pointer shadow-xl hover:scale-110"
                                 title="Supprimer cette offre"
                              >
                                 <Trash2 size={16} />
                              </button>
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
                              <tr key={bk.id} className="hover:bg-white/[0.03] transition-all group">
                                 <td className="px-10 py-8 text-blue-400 font-black text-[11px]">#{bk.id}</td>
                                 <td className="px-6 py-8"><p className="text-sm font-black text-white">{bk.customerName}</p></td>
                                 <td className="px-6 py-8"><span className="text-[9px] font-black uppercase bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-gray-300">{bk.service.replace('_', ' ')}</span></td>
                                 <td className="px-6 py-8">
                                    <div className="flex items-center space-x-3">
                                       <button
                                          onClick={() => generateBookingPDF(bk)}
                                          className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                                          title="Télécharger Ticket PDF"
                                       >
                                          <FileDown size={14} />
                                       </button>
                                       <select
                                          className={`text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest cursor-pointer outline-none appearance-none ${getStatusColor(bk.status)} bg-opacity-20 hover:bg-opacity-30 transition-all text-center`}
                                          value={bk.status}
                                          onChange={(e) => onUpdateBooking(bk.id, e.target.value as any)}
                                       >
                                          <option value="Pending" className="text-black bg-white">En Attente</option>
                                          <option value="Confirmed" className="text-black bg-white">Confirmé</option>
                                          <option value="Completed" className="text-black bg-white">Terminé</option>
                                          <option value="Cancelled" className="text-black bg-white">Annulé</option>
                                       </select>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8 text-right font-black text-white text-lg">
                                    <div className="flex flex-col items-end gap-2">
                                       <span>{bk.amount.toLocaleString()} DA</span>
                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setDeleteConfirm({ type: 'booking', id: bk.id, title: `Réservation #${bk.id}` });
                                          }}
                                          className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs flex items-center space-x-1"
                                          title="Supprimer la réservation"
                                       >
                                          <Trash2 size={12} />
                                          <span className="text-[9px] uppercase font-black tracking-widest">Suppr.</span>
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

         </div>

         {/* Broadcast Command Center Overlay */}
         {
            broadcastProgress >= 0 && (
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
            )
         }

         {/* MODAL (Existing logic for Package Edit/Add) */}
         {
            showPackageModal && (
               <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                  <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowPackageModal(false)}></div>
                  <div className="relative w-full max-w-3xl bg-[#0f1218] border border-white/10 rounded-[56px] p-12 lg:p-16 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
                     <div className="flex justify-between items-center mb-12">
                        <h3 className="text-4xl font-black text-white tracking-tighter">{editingPkgId ? 'Modifier' : 'Nouvelle Offre'}</h3>
                        <button onClick={() => setShowPackageModal(false)} className="p-4 bg-white/5 text-gray-500 rounded-full hover:text-white transition-all"><X size={24} /></button>
                     </div>
                     <form onSubmit={handleSavePackage} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="md:col-span-2 space-y-4">
                              <div className="relative group">
                                 <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                 <input type="text" placeholder="URL de l'image (https://...)" className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-8 py-5 text-white font-bold outline-none focus:border-blue-500 text-sm" value={packageForm.image} onChange={e => setPackageForm({ ...packageForm, image: e.target.value })} />
                              </div>

                              <div className="flex items-center space-x-4">
                                 <div className="flex-1 h-px bg-white/10"></div>
                                 <span className="text-[10px] font-black uppercase text-gray-500">OU UPLOAD</span>
                                 <div className="flex-1 h-px bg-white/10"></div>
                              </div>

                              <div className="relative group">
                                 <UploadCloud className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                 <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-8 py-4 text-gray-400 font-bold outline-none focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                                    onChange={handleImageUpload}
                                 />
                              </div>

                              {packageForm.image && (
                                 <div className="mt-4 rounded-3xl overflow-hidden border border-white/10 h-48 w-full bg-black/20">
                                    <img src={packageForm.image} alt="Aperçu" className="w-full h-full object-cover" />
                                 </div>
                              )}
                           </div>

                           <input required type="text" placeholder="Titre de l'Offre" className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-blue-500" value={packageForm.title} onChange={e => setPackageForm({ ...packageForm, title: e.target.value })} />

                           <div className="relative">
                              <select className="w-full appearance-none bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-bold outline-none focus:border-blue-500 text-sm" value={packageForm.type} onChange={e => setPackageForm({ ...packageForm, type: e.target.value as ServiceType })}>
                                 <option value="VOYAGE_ORGANISE">Voyage Organisé</option>
                                 <option value="OMRAH">Omrah</option>
                                 <option value="VISA">Visa</option>
                                 <option value="BILLETERIE">Billeterie</option>
                                 <option value="E-VISA">E-Visa</option>
                              </select>
                              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                           </div>
                        </div>

                        <textarea placeholder="Description détaillée du voyage..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-bold outline-none focus:border-blue-500 text-sm resize-none" value={packageForm.description} onChange={e => setPackageForm({ ...packageForm, description: e.target.value })}></textarea>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Prix Adulte</label>
                              <input
                                 type="number"
                                 placeholder="0 DA"
                                 className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white font-black text-sm"
                                 value={packageForm.priceAdult || ''}
                                 onChange={e => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    setPackageForm({ ...packageForm, priceAdult: val, price: val });
                                 }}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Enfant</label>
                              <input
                                 type="number"
                                 placeholder="0 DA"
                                 className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white font-black text-sm"
                                 value={packageForm.priceChild || ''}
                                 onChange={e => setPackageForm({ ...packageForm, priceChild: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Bébé</label>
                              <input
                                 type="number"
                                 placeholder="0 DA"
                                 className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white font-black text-sm"
                                 value={packageForm.priceBaby || ''}
                                 onChange={e => setPackageForm({ ...packageForm, priceBaby: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Stock</label>
                              <input
                                 type="number"
                                 placeholder="100"
                                 className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white font-black text-sm"
                                 value={packageForm.stock || ''}
                                 onChange={e => setPackageForm({ ...packageForm, stock: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Durée</label>
                              <input type="text" placeholder="Ex: 15 Jours" className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-bold text-sm" value={packageForm.duration} onChange={e => setPackageForm({ ...packageForm, duration: e.target.value })} />
                           </div>
                        </div>

                        <button type="submit" disabled={isActionLoading} className="w-full bg-blue-600 text-white font-black py-6 rounded-[32px] uppercase tracking-[0.4em] text-[11px] hover:bg-orange-600 transition-all shadow-2xl mt-4">
                           {isActionLoading ? 'Synchronisation...' : 'Valider Publication'}
                        </button>
                     </form>
                  </div>
               </div>
            )
         }
         {/* CUSTOM DELETE CONFIRMATION MODAL */}
         {
            deleteConfirm && (
               <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-200">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}></div>
                  <div className="relative bg-[#0f1218] border border-red-500/20 rounded-[40px] p-10 max-w-md w-full shadow-2xl shadow-red-900/20 animate-in zoom-in-95">
                     <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <AlertTriangle size={32} />
                     </div>
                     <h3 className="text-2xl font-black text-white text-center mb-2">Supression Définitive</h3>
                     <p className="text-gray-400 text-center text-sm font-bold mb-8">
                        Voulez-vous vraiment supprimer "{deleteConfirm.title}" ?<br />Cette action est irréversible.
                     </p>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setDeleteConfirm(null)} className="py-4 rounded-xl bg-white/5 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
                           Annuler
                        </button>
                        <button onClick={handleConfirmDelete} className="py-4 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                           Oui, Supprimer
                        </button>
                     </div>
                  </div>
               </div>
            )
         }

         <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #ffffff10; border-radius: 10px; }`}</style>
      </div >
   );
};

export default AdminPanel;
