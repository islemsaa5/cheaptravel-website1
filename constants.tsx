
import React from 'react';
import { Plane, Globe, ShieldCheck, Moon, Ticket, Briefcase, User } from 'lucide-react';
import { ServiceType, TravelPackage } from './types';

export const LOGO_URL = "https://i.ibb.co/VqV9kPd/cheap-travel-logo.png";
export const WHATSAPP_NUMBER = "213540747040";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const formatWhatsAppMessage = (text: string) => {
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(text)}`;
};

export const SERVICES_LIST: { type: ServiceType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    type: 'BILLETERIE', 
    label: 'Billeterie', 
    icon: <Ticket className="w-6 h-6" />, 
    description: 'Réservation de vols nationaux et internationaux connectée aux tarifs officiels.'
  },
  { 
    type: 'VISA', 
    label: 'Service Visa', 
    icon: <ShieldCheck className="w-6 h-6" />, 
    description: 'Assistance visa fiable pour toutes les destinations mondiales.'
  },
  { 
    type: 'E-VISA', 
    label: 'E-Visa', 
    icon: <Globe className="w-6 h-6" />, 
    description: 'Traitement rapide des visas numériques depuis chez vous.'
  },
  { 
    type: 'VOYAGE_ORGANISE', 
    label: 'Voyage Organisé', 
    icon: <Plane className="w-6 h-6" />, 
    description: 'Circuits de groupe et forfaits personnalisés avec guides experts.'
  },
  { 
    type: 'OMRAH', 
    label: 'Omrah', 
    icon: <Moon className="w-6 h-6" />, 
    description: 'Séjours spirituels avec hébergement premium et encadrement.'
  },
];

export const MOCK_PACKAGES: TravelPackage[] = [
  {
    id: '1',
    title: 'Istanbul Magic Tour',
    description: '5 Jours au cœur de la Turquie avec visites guidées et transferts.',
    price: 185000,
    priceAdult: 185000,
    priceChild: 129500,
    priceBaby: 55500,
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=2071&auto=format&fit=crop',
    type: 'VOYAGE_ORGANISE' as ServiceType,
    duration: '5 Jours',
    stock: 24
  },
  {
    id: '2',
    title: 'Omrah Premium Plus',
    description: 'Vols directs, hôtels 5 étoiles à proximité du Haram.',
    price: 240000,
    priceAdult: 240000,
    priceChild: 168000,
    priceBaby: 72000,
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=2000&auto=format&fit=crop',
    type: 'OMRAH' as ServiceType,
    duration: '15 Jours',
    stock: 12
  },
  {
    id: '3',
    title: 'Dubaï Shopping Festival',
    description: 'Séjour de luxe et E-Visa inclus pour toute la famille.',
    price: 215000,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop',
    type: 'E-VISA' as ServiceType,
    duration: '7 Jours',
    stock: 45
  },
];
