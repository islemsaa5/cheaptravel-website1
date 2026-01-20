
import React, { useState, useEffect } from 'react';
import {
  User, Calendar, MapPin, CheckCircle, Clock, Plane, FileText,
  TrendingUp, Wallet, Star, ArrowRight, Moon, Globe, Sparkles,
  Mail, Phone, Settings, Bell, Shield, Loader2
} from 'lucide-react';
import { clientDataService } from '../services/clientDataService';
import { VisaApplication, Trip, UserActivity, LoyaltyPoints } from '../types';
import { authService } from '../services/authService';
import { WHATSAPP_LINK } from '../constants';

interface ClientSpaceProps {
  onNavigate?: (page: any) => void;
}

const ClientSpace: React.FC<ClientSpaceProps> = ({ onNavigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const data = await clientDataService.getClientDashboardData(user.id);
        setDashboardData(data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-black text-blue-900 mb-4">Authentification Requise</h2>
          <p className="text-gray-500">Veuillez vous connecter pour accéder à votre console.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 font-bold">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  const { visaApplications = [], upcomingTrips = [], recentActivities = [], loyaltyPoints, walletBalance = 0, stats } = dashboardData || {};

  // Get country emoji from country code
  const getCountryEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-600 to-blue-900 rounded-3xl flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-2xl shadow-blue-900/20">
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-blue-900 tracking-tight mb-2">Bienvenue, {user.fullName}!</h1>
                <p className="text-gray-500 font-medium flex items-center space-x-2">
                  <MapPin size={16} className="text-orange-500" />
                  <span>Gérez vos réservations et demandes de visa</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm border flex items-center space-x-2 ${isEditingProfile ? 'bg-blue-900 text-white border-blue-900' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'}`}
              >
                <Settings size={16} />
                <span>{isEditingProfile ? 'Enregistrer' : 'Modifier Profil'}</span>
              </button>
              <button
                onClick={() => window.open('https://wa.me/213XXXXXXXXX', '_blank')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 flex items-center space-x-2"
              >
                <Bell size={16} />
                <span>Support</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-[24px] p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Plane className="text-blue-600" size={24} />
              </div>
              <TrendingUp className="text-green-500" size={18} />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Voyages</p>
            <p className="text-3xl font-black text-blue-900">{stats?.totalTrips || 0}</p>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-2xl">
                <FileText className="text-green-600" size={24} />
              </div>
              <CheckCircle className="text-green-500" size={18} />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Visas Actifs</p>
            <p className="text-3xl font-black text-blue-900">{stats?.activeVisas || 0}</p>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <Wallet className="text-orange-600" size={24} />
              </div>
              <Sparkles className="text-orange-500" size={18} />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Portefeuille</p>
            <p className="text-3xl font-black text-blue-900">{walletBalance.toLocaleString()} DA</p>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-2xl">
                <Star className="text-purple-600" size={24} />
              </div>
              <Shield className="text-purple-500" size={18} />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Points Fidélité</p>
            <p className="text-3xl font-black text-blue-900">{loyaltyPoints?.pointsBalance || 0}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Visa Tracker & Trips */}
          <div className="lg:col-span-2 space-y-8">

            {/* Active Visa Applications */}
            <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-blue-900 flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-xl">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <span>Demandes de Visa Actives</span>
                </h3>
                <button className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-900 transition-colors flex items-center space-x-2">
                  <span>Tout Voir</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="space-y-4">
                {visaApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">Aucune demande de visa en cours</p>
                  </div>
                ) : (
                  visaApplications.map((visa: VisaApplication) => (
                    <div key={visa.id} className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 rounded-[24px] border border-gray-100 hover:shadow-lg transition-all hover:scale-[1.02] duration-300 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-4xl">{getCountryEmoji(visa.countryCode)}</span>
                          <div>
                            <p className="font-black text-lg text-blue-900">{visa.country}</p>
                            <p className="text-xs text-gray-400 font-bold">Demande #{visa.applicationNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${visa.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700 shadow-sm shadow-green-200'
                            : visa.status === 'IN_PROGRESS'
                              ? 'bg-orange-100 text-orange-700 shadow-sm shadow-orange-200'
                              : 'bg-blue-100 text-blue-700 shadow-sm shadow-blue-200'
                            }`}>
                            {visa.status === 'APPROVED' ? 'Approuvé' : visa.status === 'IN_PROGRESS' ? 'En Cours' : 'Soumis'}
                          </span>
                          {visa.deadline && (
                            <p className="text-[10px] text-gray-400 mt-2 font-bold flex items-center justify-end space-x-1">
                              <Clock size={10} />
                              <span>Échéance: {new Date(visa.deadline).toLocaleDateString('fr-FR')}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Trips */}
            <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-blue-900 flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Plane className="text-blue-600" size={24} />
                  </div>
                  <span>Voyages à Venir</span>
                </h3>
              </div>

              {upcomingTrips.length === 0 ? (
                <div className="text-center py-12">
                  <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold">Aucun voyage prévu pour le moment</p>
                </div>
              ) : (
                upcomingTrips.map((trip: Trip) => (
                  <div key={trip.id} className="bg-gradient-to-r from-blue-50 to-orange-50/30 p-6 rounded-[24px] border border-blue-100 hover:shadow-lg transition-all hover:scale-[1.02] duration-300 cursor-pointer mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                          <Globe className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <p className="font-black text-lg text-blue-900">{trip.destination}</p>
                          <p className="text-xs text-gray-500 font-bold">{trip.tripType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${trip.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                        }`}>
                        {trip.status === 'CONFIRMED' ? 'Confirmé' : trip.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-gray-600 font-bold flex items-center space-x-2">
                        <Calendar size={16} className="text-orange-500" />
                        <span>{new Date(trip.startDate).toLocaleDateString('fr-FR')}</span>
                      </p>
                      <button className="text-orange-600 font-black text-xs uppercase tracking-widest flex items-center space-x-2 hover:text-orange-800 transition-colors group">
                        <span>Voir Détails</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">

            {/* Omrah CTA */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-8 rounded-[32px] relative overflow-hidden shadow-2xl">
              <div className="absolute -bottom-8 -right-8 opacity-10">
                <Moon size={120} />
              </div>
              <div className="relative z-10">
                <div className="p-3 bg-white/10 rounded-2xl w-fit mb-4 backdrop-blur-sm">
                  <Moon className="text-orange-400" size={28} />
                </div>
                <h3 className="font-black text-2xl mb-3">Planifier Omrah</h3>
                <p className="text-blue-100 text-sm mb-6 leading-relaxed">Packages personnalisés pour votre voyage spirituel.</p>
                <button
                  onClick={() => onNavigate?.('omrah')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-500/30 hover:scale-105 duration-300 uppercase tracking-widest text-xs"
                >
                  Commencer
                </button>
              </div>
            </div>

            {/* Wallet Quick Access */}
            <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-black text-lg text-blue-900 flex items-center space-x-2">
                  <Wallet className="text-blue-600" size={20} />
                  <span>Mon Portefeuille</span>
                </h4>
                <Sparkles className="text-orange-500" size={20} />
              </div>
              <div className="mb-6">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Solde Actuel</p>
                <p className="text-4xl font-black text-blue-900">{walletBalance.toLocaleString()} DA</p>
              </div>
              <button
                onClick={() => window.open(WHATSAPP_LINK, '_blank')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 hover:scale-105 duration-300 uppercase tracking-widest text-xs flex items-center justify-center space-x-2"
              >
                <Wallet size={16} />
                <span>Recharger</span>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
              <h4 className="font-black text-lg mb-6 flex items-center space-x-2 text-blue-900">
                <Clock size={20} className="text-gray-400" />
                <span>Activité Récente</span>
              </h4>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Aucune activité récente</p>
                ) : (
                  recentActivities.map((activity: UserActivity) => (
                    <div key={activity.id} className="flex space-x-3 items-start group hover:bg-gray-50 p-3 rounded-2xl -mx-3 transition-all cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 group-hover:scale-150 transition-transform"></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 group-hover:text-blue-900 transition-colors">{activity.activityDescription}</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                          {new Date(activity.createdAt).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSpace;
