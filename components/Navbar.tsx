
import React from 'react';
import { AppSpace, User } from '../types';
import { User as UserIcon, Briefcase, ShieldCheck, LogOut, LayoutDashboard, Settings, Crown } from 'lucide-react';

interface NavbarProps {
  currentSpace: AppSpace;
  onSpaceChange: (space: AppSpace) => void;
  currentPage: string;
  onPageChange: (page: any) => void;
  user: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentSpace, 
  onSpaceChange, 
  currentPage, 
  onPageChange, 
  user, 
  onAuthClick, 
  onLogout 
}) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'billeterie', label: 'Billeterie' },
    { id: 'visa', label: 'Visas' },
    { id: 'omrah', label: 'Omrah' },
    { id: 'organised', label: 'Voyages Organisés' },
  ];

  const isAdmin = user?.role === 'ADMIN';

  const handleAdminTabClick = () => {
    if (isAdmin) {
      onSpaceChange(AppSpace.ADMIN);
      onPageChange('admin');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group" 
            onClick={() => {
              onSpaceChange(AppSpace.CLIENT);
              onPageChange('home');
            }}
          >
            <div className="flex items-center">
              <div className="text-2xl font-bold flex flex-col leading-tight">
                <span className="text-blue-900 tracking-tighter uppercase italic group-hover:text-orange-500 transition-colors">Cheap <span className="text-orange-500 group-hover:text-blue-900">Travel</span></span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`text-[11px] uppercase tracking-widest font-black transition-all px-3 py-1.5 rounded-xl ${
                  currentPage === item.id 
                    ? 'text-orange-500 bg-orange-50' 
                    : 'text-gray-400 hover:text-blue-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* User & Space Switcher */}
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-1.5 rounded-[20px] flex shadow-inner border border-gray-200/50">
              <button
                onClick={() => {
                  onSpaceChange(AppSpace.CLIENT);
                  onPageChange('home');
                }}
                className={`flex items-center space-x-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${
                  currentSpace === AppSpace.CLIENT ? 'bg-white shadow-md text-blue-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <UserIcon size={14} />
                <span className="hidden lg:inline">Client</span>
              </button>
              
              <button
                onClick={() => {
                  onSpaceChange(AppSpace.AGENCY);
                  onPageChange('home');
                }}
                className={`flex items-center space-x-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${
                  currentSpace === AppSpace.AGENCY ? 'bg-white shadow-md text-blue-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Briefcase size={14} />
                <span className="hidden lg:inline">B2B Agency</span>
              </button>
              
              {/* Super Admin Tab - ONLY visible if user is logged in as ADMIN */}
              {isAdmin && (
                <button
                  onClick={handleAdminTabClick}
                  className={`flex items-center space-x-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${
                    currentSpace === AppSpace.ADMIN 
                      ? 'bg-black text-white shadow-xl' 
                      : 'text-orange-600 bg-orange-500/20 font-black'
                  }`}
                >
                  <Crown size={14} className={currentSpace === AppSpace.ADMIN ? 'text-orange-500' : 'text-orange-600'} />
                  <span className="hidden lg:inline">Super Admin</span>
                </button>
              )}
            </div>
            
            <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden sm:block"></div>

            {user ? (
              <div className="flex items-center space-x-3 bg-white border border-gray-100 p-1.5 rounded-[24px] shadow-sm pr-5 group relative cursor-pointer">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black uppercase shadow-lg ${user.role === 'ADMIN' ? 'bg-orange-500' : 'bg-blue-900'}`}>
                  {user.fullName.slice(0, 2)}
                </div>
                <div className="hidden lg:block">
                  <p className="text-[10px] font-black text-blue-900 truncate max-w-[100px]">{user.fullName}</p>
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                    {user.role === 'ADMIN' ? 'Propriétaire' : user.role === 'AGENT' ? 'Partenaire B2B' : 'Client'}
                  </p>
                </div>
                
                {/* Profile Dropdown */}
                <div className="absolute top-full right-0 mt-4 w-64 bg-white rounded-[32px] shadow-2xl border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 scale-95 group-hover:scale-100">
                   {isAdmin && (
                     <button 
                        onClick={() => { 
                          onSpaceChange(AppSpace.ADMIN); 
                          onPageChange('admin'); 
                        }} 
                        className="w-full flex items-center space-x-4 p-4 hover:bg-orange-50 rounded-2xl text-[11px] font-black uppercase text-orange-600 mb-2 transition-all"
                      >
                        <ShieldCheck size={18} />
                        <span>Console Centrale</span>
                     </button>
                   )}
                   <button 
                    onClick={() => onPageChange(user.role === 'AGENT' ? 'home' : user.role === 'ADMIN' ? 'admin' : 'profile')} 
                    className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl text-[11px] font-black uppercase text-gray-500 hover:text-blue-900 mb-2 transition-all"
                   >
                     <LayoutDashboard size={18} />
                     <span>Ma Console</span>
                   </button>
                   <div className="h-px bg-gray-100 my-2 mx-2"></div>
                   <button onClick={onLogout} className="w-full flex items-center space-x-4 p-4 hover:bg-red-50 rounded-2xl text-[11px] font-black uppercase text-red-500 transition-all">
                     <LogOut size={18} />
                     <span>Déconnexion</span>
                   </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={onAuthClick}
                className="bg-blue-900 text-white px-8 py-3.5 rounded-2xl hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 active:scale-95"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
