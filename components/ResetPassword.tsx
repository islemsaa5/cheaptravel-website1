
import React, { useState } from 'react';
import { Lock, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';

interface ResetPasswordProps {
    onSuccess: () => void;
    onBack: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (newPassword !== confirmPassword) {
            setErrorMsg("Les mots de passe ne correspondent pas.");
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setIsLoading(true);
        try {
            const { success, error } = await authService.resetPassword(email.trim().toLowerCase(), newPassword);
            if (error) {
                setErrorMsg(error);
            } else if (success) {
                setSuccessMsg("Votre mot de passe a été réinitialisé avec succès !");
                setTimeout(() => onSuccess(), 3000);
            }
        } catch (err) {
            setErrorMsg("Erreur système. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Lock size={120} />
                </div>

                <button onClick={onBack} className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-900 transition-colors mb-8">
                    <ArrowLeft size={16} />
                    <span>Retour</span>
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-black text-blue-900 tracking-tighter leading-none mb-2">Nouveau Password</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sécurisez votre compte Cheap Travel</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 animate-in fade-in slide-in-from-top-2 flex items-center space-x-3">
                        <ShieldCheck size={20} />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{successMsg}</p>
                    </div>
                )}

                {!successMsg && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Confirmez votre Email</label>
                            <input
                                required
                                type="email"
                                placeholder="votre@email.com"
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-900/10 focus:bg-white rounded-2xl text-sm font-bold transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Nouveau mot de passe</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-900/10 focus:bg-white rounded-2xl text-sm font-bold transition-all"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Confirmez</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-900/10 focus:bg-white rounded-2xl text-sm font-bold transition-all"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            disabled={isLoading}
                            type="submit"
                            className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-black transition-all active:scale-95 flex items-center justify-center space-x-3 mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="uppercase tracking-[0.2em] text-[10px]">Mettre à jour</span>
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
