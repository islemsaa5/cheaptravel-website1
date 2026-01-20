
import React from 'react';
import { AppSpace, User } from '../types';
import { User as UserIcon, Briefcase, ShieldCheck, LogOut, LayoutDashboard, Settings, Crown, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentSpace: AppSpace;
  onSpaceChange: (space: AppSpace) => void;
  currentPage: string;
  onPageChange: (page: any) => void;
  user: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
  showAdminSwitch?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  currentSpace,
  onSpaceChange,
  currentPage,
  onPageChange,
  user,
  onAuthClick,
  onLogout,
  showAdminSwitch = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'billeterie', label: 'Billeterie' },
    { id: 'visa', label: 'Visas' },
    { id: 'omrah', label: 'Omrah' },
    { id: 'organised', label: 'Voyages Organisés' },
  ];

  const isAdmin = user?.role === 'ADMIN';
  const isAdminSpace = currentSpace === AppSpace.ADMIN;

  return (
    <nav className={`sticky top-0 z-[200] border-b transition-all duration-300 ${isAdminSpace ? 'bg-[#0f1218] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div
            className="flex items-center space-x-2 cursor-pointer group shrink-0"
            onClick={() => {
              onSpaceChange(AppSpace.CLIENT);
              onPageChange('home');
              setIsMenuOpen(false);
            }}
          >
            <div className="flex items-center">
              <div className="text-xl md:text-2xl font-bold flex flex-col leading-tight">
                <span className={`tracking-tighter uppercase italic transition-colors ${isAdminSpace ? 'text-white' : 'text-blue-900 group-hover:text-orange-500'}`}>Cheap <span className="text-orange-500">Travel</span></span>
              </div>
            </div>
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {currentSpace !== AppSpace.ADMIN && navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  // If clicking a catalog items, ensure we are in CLIENT space
                  if (item.id !== 'admin' && item.id !== 'profile') {
                    onSpaceChange(AppSpace.CLIENT);
                  }
                }}
                className={`text-[11px] uppercase tracking-widest font-black transition-all px-3 py-1.5 rounded-xl whitespace-nowrap ${currentPage === item.id
                  ? 'text-orange-500 bg-orange-50'
                  : 'text-gray-400 hover:text-blue-900 hover:bg-gray-50'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Section: User & Space Switcher - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Space Switcher - Always Visible */}
            <div className={`p-1.5 rounded-[20px] flex shadow-inner border transition-all ${isAdminSpace ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200/50'}`}>
              <button
                onClick={() => {
                  onSpaceChange(AppSpace.CLIENT);
                  onPageChange('home');
                }}
                className={`flex items-center space-x-2 px-4 lg:px-5 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${currentSpace === AppSpace.CLIENT ? 'bg-white shadow-md text-blue-900 font-bold' : isAdminSpace ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-blue-900 opacity-60 hover:opacity-100'
                  }`}
              >
                <UserIcon size={14} />
                <span className="hidden lg:inline">Portail Public</span>
              </button>

              <button
                onClick={() => {
                  onSpaceChange(AppSpace.AGENCY);
                  onPageChange('home');
                }}
                className={`flex items-center space-x-2 px-4 lg:px-5 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${currentSpace === AppSpace.AGENCY ? 'bg-orange-500 text-white shadow-md font-bold' : isAdminSpace ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-blue-900 opacity-60 hover:opacity-100'
                  }`}
              >
                <Briefcase size={14} />
                <span className="hidden lg:inline">Espace Agence</span>
              </button>

              {isAdmin && showAdminSwitch && (
                <button
                  onClick={() => {
                    onSpaceChange(AppSpace.ADMIN);
                    onPageChange('admin');
                  }}
                  className={`flex items-center space-x-2 px-4 lg:px-5 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${currentSpace === AppSpace.ADMIN ? (isAdminSpace ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'bg-orange-500 shadow-md text-white') : isAdminSpace ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-orange-500 opacity-60 hover:opacity-100'
                    }`}
                >
                  <ShieldCheck size={14} />
                  <span className="hidden lg:inline">Admin Mode</span>
                </button>
              )}
            </div>

            <div className={`h-8 w-[1px] mx-1 hidden sm:block ${isAdminSpace ? 'bg-white/5' : 'bg-gray-100'}`}></div>

            {user ? (
              <div className={`flex items-center space-x-3 border p-1.5 rounded-[24px] shadow-sm pr-5 group relative cursor-pointer transition-all ${isAdminSpace ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black uppercase shadow-lg ${user.role === 'ADMIN' ? 'bg-orange-500' : 'bg-blue-900'}`}>
                  {user.fullName.slice(0, 2)}
                </div>
                <div className="hidden lg:block">
                  <p className={`text-[10px] font-black truncate max-w-[100px] ${isAdminSpace ? 'text-white' : 'text-blue-900'}`}>{user.fullName}</p>
                  <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                    {user.role === 'ADMIN' ? 'Propriétaire' : user.role === 'AGENT' ? 'Partenaire B2B' : 'Client'}
                  </p>
                </div>

                {/* Profile Dropdown Desktop */}
                <div className={`absolute top-full right-0 mt-4 w-64 rounded-[32px] shadow-2xl border p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[210] scale-95 group-hover:scale-100 pointer-events-auto ${isAdminSpace ? 'bg-[#0f1218] border-white/10' : 'bg-white border-gray-100'}`}>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        onSpaceChange(AppSpace.ADMIN);
                        onPageChange('admin');
                      }}
                      className={`w-full flex items-center space-x-4 p-4 rounded-2xl text-[11px] font-black uppercase mb-2 transition-all ${isAdminSpace ? 'hover:bg-white/5 text-orange-500' : 'hover:bg-orange-50 text-orange-600'}`}
                    >
                      <ShieldCheck size={18} />
                      <span>Console Centrale</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (user.role === 'ADMIN') {
                        onSpaceChange(AppSpace.ADMIN);
                        onPageChange('admin');
                      } else if (user.role === 'AGENT') {
                        onSpaceChange(AppSpace.AGENCY);
                        onPageChange('home');
                      } else {
                        onSpaceChange(AppSpace.CLIENT);
                        onPageChange('profile');
                      }
                    }}
                    className={`w-full flex items-center space-x-4 p-4 rounded-2xl text-[11px] font-black uppercase mb-2 transition-all ${isAdminSpace ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-blue-900 hover:bg-gray-50'}`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Ma Console</span>
                  </button>
                  <div className={`h-px my-2 mx-2 ${isAdminSpace ? 'bg-white/5' : 'bg-gray-100'}`}></div>
                  <button onClick={onLogout} className="w-full flex items-center space-x-4 p-4 hover:bg-red-500/10 rounded-2xl text-[11px] font-black uppercase text-red-500 transition-all">
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

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black uppercase shadow-lg ${user.role === 'ADMIN' ? 'bg-orange-500' : 'bg-blue-900'}`}>
                {user.fullName.slice(0, 2)}
              </div>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2.5 rounded-xl transition-all border ${isAdminSpace ? 'bg-white/5 text-white border-white/10' : 'bg-gray-50 text-blue-900 border-gray-100'}`}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {
        isMenuOpen && (
          <div className={`md:hidden absolute top-20 left-0 right-0 border-b shadow-2xl animate-in slide-in-from-top-4 duration-300 z-50 overflow-y-auto max-h-[calc(100vh-80px)] ${isAdminSpace ? 'bg-[#0f1218] border-white/5' : 'bg-white border-gray-100'}`}>
            <div className="p-6 space-y-6">
              {/* Navigation Sections */}
              {currentSpace !== AppSpace.ADMIN && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Navigation</p>
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onPageChange(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${currentPage === item.id
                        ? 'text-orange-500 bg-orange-50 shadow-sm border border-orange-100'
                        : 'text-gray-500 hover:text-blue-900 hover:bg-gray-50'
                        }`}
                    >
                      <span>{item.label}</span>
                      {currentPage === item.id && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>}
                    </button>
                  ))}
                </div>
              )}

              <div className={`h-px mx-4 ${isAdminSpace ? 'bg-white/5' : 'bg-gray-100'}`}></div>

              {/* Space Switcher Mobile */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Navigation Espaces</p>
                <div className={`grid gap-3 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <button
                    onClick={() => {
                      onSpaceChange(AppSpace.CLIENT);
                      onPageChange('home');
                      setIsMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all ${currentSpace === AppSpace.CLIENT ? 'bg-blue-50 border-blue-600 text-blue-900' : isAdminSpace ? 'bg-white/5 border-transparent text-gray-500' : 'bg-gray-50 border-transparent text-gray-400'
                      }`}
                  >
                    <UserIcon size={20} className="mb-2" />
                    <span className="text-[10px] font-black uppercase">Public</span>
                  </button>

                  <button
                    onClick={() => {
                      onSpaceChange(AppSpace.AGENCY);
                      onPageChange('home');
                      setIsMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all ${currentSpace === AppSpace.AGENCY ? 'bg-orange-50 border-orange-500 text-orange-600' : isAdminSpace ? 'bg-white/5 border-transparent text-gray-500' : 'bg-gray-50 border-transparent text-gray-400'
                      }`}
                  >
                    <Briefcase size={20} className="mb-2" />
                    <span className="text-[10px] font-black uppercase">Agence</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        onSpaceChange(AppSpace.ADMIN);
                        onPageChange('admin');
                        setIsMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all ${currentSpace === AppSpace.ADMIN ? 'bg-blue-900 border-blue-900 text-white shadow-lg' : isAdminSpace ? 'bg-white/5 border-transparent text-gray-500' : 'bg-gray-50 border-transparent text-gray-400'
                        }`}
                    >
                      <ShieldCheck size={20} className="mb-2" />
                      <span className="text-[10px] font-black uppercase">Admin</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Auth Section Mobile */}
              <div className="pt-4 pb-8">
                {user ? (
                  <div className={`rounded-[32px] p-4 flex flex-col space-y-3 ${isAdminSpace ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center space-x-4 p-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black uppercase shadow-lg ${user.role === 'ADMIN' ? 'bg-orange-500' : 'bg-blue-900'}`}>
                        {user.fullName.slice(0, 2)}
                      </div>
                      <div>
                        <p className={`text-sm font-black ${isAdminSpace ? 'text-white' : 'text-blue-900'}`}>{user.fullName}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{user.role}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          onSpaceChange(AppSpace.ADMIN);
                          onPageChange('admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-4 p-4 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-tighter"
                      >
                        <Crown size={18} />
                        <span>Console Super Admin</span>
                      </button>
                    )}

                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-4 p-4 text-red-500 font-black uppercase text-[11px] hover:bg-red-500/10 rounded-2xl transition-all"
                    >
                      <LogOut size={18} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onAuthClick();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-blue-900 text-white p-6 rounded-[28px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl "
                  >
                    Me Connecter
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }
    </nav >
  );
};

export default Navbar;
