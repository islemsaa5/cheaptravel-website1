
import React from 'react';
import { Booking, Traveler } from '../types';
import { LOGO_URL } from '../constants';
import { ShieldCheck, Phone, Mail, MapPin, Printer, Download, X } from 'lucide-react';

interface VoucherProps {
  booking: Booking;
  onClose: () => void;
}

const Voucher: React.FC<VoucherProps> = ({ booking, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[800px] bg-white shadow-2xl rounded-none md:rounded-[40px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 print:shadow-none print:rounded-none">
        {/* Header Controls (Hidden on print) */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-blue-900" size={20} />
            <h3 className="font-black text-blue-900 uppercase text-xs tracking-widest">Document Officiel</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handlePrint} className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:bg-black transition-all">
              <Printer size={16} />
              <span>Imprimer / PDF</span>
            </button>
            <button onClick={onClose} className="p-3 bg-white border border-gray-200 text-gray-400 rounded-2xl hover:text-red-500 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Voucher Content (A4ish Ratio) */}
        <div id="voucher-printable" className="p-12 md:p-16 flex-1 bg-white relative print:p-8">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-45deg]">
            <h1 className="text-9xl font-black uppercase tracking-tighter">Cheap Travel</h1>
          </div>

          <div className="relative z-10">
            {/* Logo & ID */}
            <div className="flex justify-between items-start mb-16">
              <div className="flex flex-col">
                <div className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">
                  Cheap <span className="text-orange-500">Travel</span>
                </div>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.4em] mt-1">Expertise & Voyage</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirmation No.</p>
                <p className="text-2xl font-black text-blue-900 tracking-tighter">#{booking.id}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {booking.status === 'Confirmed' ? 'Document Valide' : 'Réservation ' + booking.status}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="grid grid-cols-2 gap-12 mb-16">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Titulaire du Dossier</h4>
                  <p className="text-xl font-black text-blue-900">{booking.customerName}</p>
                  <p className="text-sm text-gray-600 mt-1">{booking.contact}</p>
                  <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold">{booking.address}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Prestation de Voyage</h4>
                  <p className="text-lg font-black text-blue-900">{booking.service.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500 italic">Date de réservation: {booking.date}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Récapitulatif Paiement</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500">Total Prestation</span>
                    <span className="text-blue-900 font-bold">{booking.amount.toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500">Frais d'agence</span>
                    <span className="text-blue-900 font-bold">Inclus</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Net à Payer</span>
                    <span className="text-2xl font-black text-orange-500">{booking.amount.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Travelers List */}
            <div className="mb-16">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Liste des Passagers / Voyageurs</h4>
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Nom Complet</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">N° Passeport</th>
                      <th className="px-6 py-4 text-right">Date de Naissance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {booking.travelers.map((t, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-bold text-blue-900">{t.firstName} {t.lastName}</td>
                        <td className="px-6 py-4">
                          <span className="text-[9px] font-black px-2 py-1 bg-blue-50 text-blue-600 rounded-md uppercase tracking-widest">
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium">{t.passportNumber}</td>
                        <td className="px-6 py-4 text-right text-gray-500">{t.dateOfBirth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer / Terms */}
            <div className="grid grid-cols-2 gap-12 pt-16 border-t-2 border-dashed border-gray-100">
              <div className="text-[10px] leading-relaxed text-gray-400 font-medium">
                <p className="font-black text-gray-600 mb-2 uppercase tracking-widest">Conditions de Vente</p>
                <p>1. Ce document constitue une confirmation officielle de réservation.</p>
                <p>2. Toute annulation est soumise aux conditions du prestataire final.</p>
                <p>3. Présentez ce voucher lors de l'enregistrement ou au guichet visa.</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="text-right">
                  <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Contact Agence</p>
                  <div className="flex flex-col text-[10px] text-gray-500 font-bold mt-2">
                    <span className="flex items-center justify-end space-x-2"><Phone size={10} /> <span>+213 (0) 540 74 70 40</span></span>
                    <span className="flex items-center justify-end space-x-2"><Mail size={10} /> <span>contact@cheaptravel.dz</span></span>
                    <span className="flex items-center justify-end space-x-2"><MapPin size={10} /> <span>Algiers, Algeria</span></span>
                  </div>
                </div>
                {/* Stamp Placeholder */}
                <div className="mt-8 border-4 border-blue-900/10 text-blue-900/20 p-4 rounded-full rotate-[-12deg] font-black uppercase text-center w-32 h-32 flex flex-col items-center justify-center border-dashed">
                  <span className="text-[10px]">Cheap Travel</span>
                  <span className="text-[8px]">Approuvé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voucher;
