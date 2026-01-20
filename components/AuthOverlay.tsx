
import React, { useState } from 'react';
import { X, Mail, Lock, User, ChevronRight, ShieldCheck, AlertCircle, Fingerprint } from 'lucide-react';
import { UserRole, User as UserType } from '../types';
import { authService } from '../services/authService';

interface AuthOverlayProps {
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  initialRole?: UserRole;
  resendApiKey?: string;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onClose, onSuccess, initialRole = 'CLIENT', resendApiKey }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
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
      if (isForgot) {
        // RESET PASSWORD REQUEST
        const { success, error } = await authService.requestPasswordReset(formData.email, resendApiKey);
        if (error) {
          setErrorMsg(error);
        } else if (success) {
          setResetSent(true);
        }
      } else if (isLogin) {
        // LOGIN
        const { user, error } = await authService.login(cleanEmail, formData.password, 'CLIENT');
        if (error) {
          setErrorMsg(error);
        } else if (user) {
          onSuccess(user);
        }
      } else {
        // REGISTER
        const { user, error } = await authService.register({
          email: cleanEmail,
          password: formData.password,
          fullName: formData.fullName
        });
        if (error) {
          setErrorMsg(error);
        } else if (user) {
          onSuccess(user);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMsg("Erreur système. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const getBrandingColor = () => {
    if (isForgot) return 'bg-purple-600';
    return isLogin ? 'bg-blue-900' : 'bg-orange-600';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side: Branding */}
          <div className={`transition-colors duration-500 md:w-5/12 p-10 text-white flex flex-col justify-between relative overflow-hidden ${getBrandingColor()}`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Fingerprint size={180} />
            </div>

            <div className="relative z-10">
              <div className="text-xl font-black mb-12 tracking-tighter uppercase italic">
                Cheap <span className={isLogin && !isForgot ? 'text-orange-500' : 'text-blue-900'}>Travel</span>
              </div>
              <h2 className="text-3xl font-black mb-4 leading-tight">
                {isForgot ? 'Récupération.' : isLogin ? 'Bon Retour.' : 'Nouveau Compte.'}
              </h2>
              <p className="text-blue-100 text-[10px] font-bold leading-relaxed uppercase tracking-widest">
                {isForgot ? 'Réinitialisation sécurisée' : isLogin ? 'Accès membre sécurisé' : 'Rejoignez nos voyageurs'}
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
                {isForgot ? 'Mot de passe oublié' : isLogin ? 'Connexion' : 'Inscription'}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                {isForgot ? 'Instructions de récupération' : isLogin ? 'Vérification du compte client' : 'Enregistrement base de données'}
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
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {!isForgot && (
                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      required
                      type="password"
                      placeholder="Mot de passe"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-900/10 focus:bg-white rounded-2xl text-sm font-bold transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  {isLogin && (
                    <div className="flex justify-end px-2">
                      <button
                        type="button"
                        onClick={() => setIsForgot(true)}
                        className="text-[10px] font-black text-blue-900/50 hover:text-blue-900 uppercase tracking-widest transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isForgot && resetSent && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Un lien de réinitialisation a été envoyé à votre adresse email (simulation).
                  </p>
                </div>
              )}

              <button
                disabled={isLoading || (isForgot && resetSent)}
                type="submit"
                className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 mt-4 ${isForgot ? 'bg-purple-600 shadow-purple-600/20 hover:bg-black' :
                  isLogin ? 'bg-blue-900 shadow-blue-900/20 hover:bg-black' :
                    'bg-orange-600 shadow-orange-600/20 hover:bg-black'
                  } ${isForgot && resetSent ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="uppercase tracking-[0.2em] text-[10px]">
                      {isForgot ? (resetSent ? 'Lien Envoyé' : 'Réinitialiser') : isLogin ? 'Vérifier & Entrer' : 'Créer mon Profil'}
                    </span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <button
                onClick={() => {
                  if (isForgot) {
                    setIsForgot(false);
                    setIsLogin(true);
                  } else {
                    setIsLogin(!isLogin);
                  }
                  setErrorMsg(null);
                  setResetSent(false);
                }}
                className="text-xs font-black text-gray-500 hover:text-blue-900 uppercase tracking-[0.2em] transition-colors py-2 px-4 hover:bg-gray-50 rounded-xl"
              >
                {isForgot ? "Retour à la connexion" : isLogin ? "Pas de compte ? Créer un profil" : "Déjà membre ? Se connecter"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
