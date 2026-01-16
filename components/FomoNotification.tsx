
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, X } from 'lucide-react';


interface FomoNotificationProps {
  overrideMessage?: { title: string; message: string } | null;
  onCloseOverride?: () => void;
}

const FomoNotification: React.FC<FomoNotificationProps> = ({ overrideMessage, onCloseOverride }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentInfo, setCurrentInfo] = useState({ name: '', city: '', package: '' });

  const data = [
    { name: "Yacine", city: "Alger", package: "Omrah Premium" },
    { name: "Sofia", city: "Oran", package: "E-Visa Dubaï" },
    { name: "Karim", city: "Constantine", package: "Istanbul Magic" },
    { name: "Amine", city: "Sétif", package: "Visa France" }
  ];

  // Handle Custom Overrides (System Notifications)
  useEffect(() => {
    if (overrideMessage) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onCloseOverride) onCloseOverride();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [overrideMessage]);

  // Handle Random Fomo
  useEffect(() => {
    if (overrideMessage) return; // Don't interrupt system messages

    const showRandom = () => {
      const random = data[Math.floor(Math.random() * data.length)];
      setCurrentInfo(random);
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 5000);
    };

    const interval = setInterval(showRandom, 15000);
    return () => clearInterval(interval);
  }, [overrideMessage]);

  if (!isVisible) return null;

  const isSystemMessage = !!overrideMessage;

  return (
    <div className="fixed bottom-32 left-10 z-[150] animate-in slide-in-from-left-12 duration-700 print:hidden">
      <div className={`bg-white/80 backdrop-blur-xl border p-4 rounded-3xl shadow-2xl flex items-center space-x-4 max-w-sm ${isSystemMessage ? 'border-blue-500/50 shadow-blue-900/20' : 'border-white/50'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${isSystemMessage ? 'bg-orange-500' : 'bg-blue-900'}`}>
          {isSystemMessage ? <Star size={20} /> : <ShoppingBag size={20} />}
        </div>
        <div>
          <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none mb-1">
            {isSystemMessage ? overrideMessage.title : 'Réservation Récente'}
          </p>
          <p className="text-xs text-gray-600 font-medium leading-tight">
            {isSystemMessage ? overrideMessage.message : (
              <>
                <span className="font-black text-blue-900">{currentInfo.name}</span> de {currentInfo.city} a réservé <span className="font-black text-orange-500">{currentInfo.package}</span>.
              </>
            )}
          </p>
          {!isSystemMessage && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[8px] font-black text-gray-400 uppercase">Il y a 2 minutes</span>
            </div>
          )}
        </div>
        <button onClick={() => { setIsVisible(false); if (onCloseOverride) onCloseOverride(); }} className="text-gray-300 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};


export default FomoNotification;
