

import React, { useState } from 'react';
import { Phone, MapPin, Mail, Facebook, Instagram, Linkedin, Send, CheckCircle, Loader2 } from 'lucide-react';
import { AGENCY_ADDRESS, WHATSAPP_NUMBER, AGENCY_EMAIL, INSTAGRAM_URL, FACEBOOK_URL } from '../constants';
import { dbService } from '../services/dbService';
import { AppSpace } from '../types';

interface FooterProps {
    onNavigate?: (page: string) => void;
    onSpaceChange?: (space: AppSpace) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, onSpaceChange }) => {
    const currentYear = new Date().getFullYear();
    const [subscriberEmail, setSubscriberEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subscriberEmail || isSubscribing) return;
        setIsSubscribing(true);
        try {
            await dbService.addSubscriber(subscriberEmail);
            setIsSubscribed(true);
            setSubscriberEmail('');
            setTimeout(() => setIsSubscribed(false), 5000);
        } catch (err) {
            console.error("Newsletter subscription failed", err);
        } finally {
            setIsSubscribing(false);
        }
    };

    return (
        <>
            {/* Newsletter Section */}
            <section className="bg-white py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-blue-900 rounded-[50px] p-12 md:p-20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                            <Send size={300} />
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-4xl font-black tracking-tighter mb-4">
                                Recevez les <span className="text-orange-500">Bons Plans</span> en priorité.
                            </h3>
                            <p className="text-blue-200 mb-10 font-medium">
                                Rejoignez 5,420+ voyageurs algériens qui reçoivent nos offres Flash Omrah et Visa chaque semaine.
                            </p>
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
                                    <button
                                        type="submit"
                                        disabled={isSubscribing}
                                        className="bg-orange-500 hover:bg-white hover:text-blue-900 text-white font-black px-10 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center min-w-[140px]"
                                    >
                                        {isSubscribing ? <Loader2 className="animate-spin" /> : "S'inscrire"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Footer */}
            <footer className="bg-blue-900 text-white py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Logo & Description */}
                        <div className="col-span-1">
                            <div className="text-2xl font-black tracking-tighter uppercase italic mb-4">
                                Cheap <span className="text-orange-500">Travel</span>
                            </div>
                            <p className="text-blue-200 text-sm leading-relaxed">
                                Votre partenaire de confiance pour tous vos besoins de voyage en Algérie.
                            </p>
                        </div>

                        {/* Contact Information */}
                        <div className="col-span-1">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-orange-500">
                                Contactez-nous
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <MapPin size={16} className="text-orange-500 mt-1 shrink-0" />
                                    <p className="text-sm text-blue-100">
                                        {AGENCY_ADDRESS}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Phone size={16} className="text-orange-500 shrink-0" />
                                    <a href={`tel:+${WHATSAPP_NUMBER}`} className="text-sm text-blue-100 hover:text-white transition-colors">
                                        +213 540 747 040
                                    </a>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Mail size={16} className="text-orange-500 shrink-0" />
                                    <a href={`mailto:${AGENCY_EMAIL}`} className="text-sm text-blue-100 hover:text-white transition-colors">
                                        {AGENCY_EMAIL}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="col-span-1">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-orange-500">
                                Nos Services
                            </h3>
                            <ul className="space-y-3 text-sm text-blue-100">
                                <li onClick={() => onNavigate?.('billeterie')} className="hover:text-white transition-colors cursor-pointer">Billeterie Aérienne</li>
                                <li onClick={() => onNavigate?.('visa')} className="hover:text-white transition-colors cursor-pointer">Visa & E-Visa</li>
                                <li onClick={() => onNavigate?.('omrah')} className="hover:text-white transition-colors cursor-pointer">Omrah</li>
                                <li onClick={() => onNavigate?.('organised')} className="hover:text-white transition-colors cursor-pointer">Voyages Organisés</li>
                                <li onClick={() => { onSpaceChange?.(AppSpace.AGENCY); onNavigate?.('home'); }} className="hover:text-white transition-colors cursor-pointer">Espace B2B</li>
                            </ul>
                        </div>

                        {/* Social & Legal */}
                        <div className="col-span-1">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-orange-500">
                                Suivez-nous
                            </h3>
                            <div className="flex space-x-4 mb-6">
                                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-orange-500 rounded-xl flex items-center justify-center transition-all">
                                    <Facebook size={18} />
                                </a>
                                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-orange-500 rounded-xl flex items-center justify-center transition-all">
                                    <Instagram size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-orange-500 rounded-xl flex items-center justify-center transition-all">
                                    <Linkedin size={18} />
                                </a>
                            </div>
                            <div className="space-y-2 text-xs text-blue-200">
                                <p className="hover:text-white transition-colors cursor-pointer">Conditions Générales</p>
                                <p className="hover:text-white transition-colors cursor-pointer">Politique de Confidentialité</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-blue-300">
                        <p>© {currentYear} Cheap Travel. Tous droits réservés.</p>
                        <p className="text-xs mt-4 md:mt-0">
                            Agrément n°1234/2024 - Ministère du Tourisme
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;

