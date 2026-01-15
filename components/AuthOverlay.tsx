
import React, { useState } from 'react';
import { X, Mail, Lock, User, ChevronRight, ShieldCheck, AlertCircle, Fingerprint } from 'lucide-react';
import { UserRole, User as UserType } from '../types';
import { dbService } from '../services/dbService';

interface AuthOverlayProps {
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  initialRole?: UserRole;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onClose, onSuccess, initialRole = 'CLIENT' }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleanEmail = formData.email.trim().toLowerCase();

    try {
      // --- MODE CONNEXION ---
      if (isLogin) {
        // 1. Vérification Admin Backdoor
        if (cleanEmail === 'cheaptravel' && formData.password === 'cheaptravel123') {
           const adminUser: UserType = {
             id: 'ADMIN-MASTER',
             fullName: 'Directeur Cheap Travel',
             email: 'cheaptravel',
             role: 'ADMIN',
             walletBalance: 0
           };
           localStorage.setItem('ct_user', JSON.stringify(adminUser));
           onSuccess(adminUser);
           return;
        }

        // 2. Vérification existence réelle dans Supabase
        console.log("Recherche du compte pour:", cleanEmail);
        const userProfile = await dbService.getProfileByEmail(cleanEmail);
        
        if (userProfile) {
          // Succès: Le compte existe
          localStorage.setItem('ct_user', JSON.stringify(userProfile));
          onSuccess(userProfile);
        } else {
          // Échec: Le compte n'existe PAS
          setErrorMsg("Ce compte n'existe pas. Veuillez vous inscrire d'abord.");
        }
      } 
      // --- MODE INSCRIPTION ---
      else {
        const existingProfile = await dbService.getProfileByEmail(cleanEmail);
        
        if (existingProfile) {
          setErrorMsg("Cet email est déjà enregistré. Veuillez vous connecter.");
        } else {
          const userId = 'USER-' + btoa(cleanEmail).slice(0, 8).toUpperCase();
          const newProfile: UserType = {
            id: userId,
            fullName: formData.fullName || 'Voyageur Algérien',
            email: cleanEmail,
            role: 'CLIENT',
            walletBalance: 0
          };
          
          await dbService.updateProfile(newProfile);
          localStorage.setItem('ct_user', JSON.stringify(newProfile));
          onSuccess(newProfile);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMsg("Connexion à la base de données impossible.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side: Branding */}
          <div className={`transition-colors duration-500 md:w-5/12 p-10 text-white flex flex-col justify-between relative overflow-hidden ${isLogin ? 'bg-blue-900' : 'bg-orange-600'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Fingerprint size={180} />
            </div>
            
            <div className="relative z-10">
              <div className="text-xl font-black mb-12 tracking-tighter uppercase italic">
                Cheap <span className={isLogin ? 'text-orange-500' : 'text-blue-900'}>Travel</span>
              </div>
              <h2 className="text-3xl font-black mb-4 leading-tight">
                {isLogin ? 'Bon Retour.' : 'Nouveau Compte.'}
              </h2>
              <p className="text-blue-100 text-[10px] font-bold leading-relaxed uppercase tracking-widest">
                {isLogin ? 'Accès membre sécurisé' : 'Rejoignez nos voyageurs'}
              </p>
            </div>

            <div className="relative z-10 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
              Cloud-Sync: Profiles Table
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="md:w-7/12 p-10 bg-white">
            <div className="flex justify-end items-center mb-4">
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-8">
               <h3 className="text-2xl font-black text-blue-900 leading-none">
                {isLogin ? 'Connexion' : 'Inscription'}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                {isLogin ? 'Vérification du compte client' : 'Enregistrement base de données'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="text"
                      placeholder="Nom Complet"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500/10 focus:bg-white rounded-2xl text-sm font-bold transition-all"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    required
                    type="text"
                    placeholder="Adresse Email"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-900/10 focus:bg-white rounded-2xl text-sm font-bold transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    required
                    type="password"
                    placeholder="Mot de passe"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-900/10 focus:bg-white rounded-2xl text-sm font-bold transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <button 
                disabled={isLoading}
                type="submit" 
                className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 mt-4 ${isLogin ? 'bg-blue-900 shadow-blue-900/20 hover:bg-black' : 'bg-orange-600 shadow-orange-600/20 hover:bg-black'}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="uppercase tracking-[0.2em] text-[10px]">
                      {isLogin ? 'Vérifier & Entrer' : 'Créer mon Profil'}
                    </span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg(null);
                }}
                className="text-[10px] font-black text-gray-400 hover:text-blue-900 uppercase tracking-[0.2em] transition-colors"
              >
                {isLogin ? "Pas de compte ? Créer un profil" : "Déjà membre ? Se connecter"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
