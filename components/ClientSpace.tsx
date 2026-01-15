
import React from 'react';
// Added Moon to lucide-react imports
import { ShoppingBag, Clock, Heart, CheckCircle, CreditCard, ArrowRight, Moon } from 'lucide-react';

const ClientSpace: React.FC = () => {
  const activeVisas = [
    { country: 'France', status: 'In Progress', icon: '🇫🇷', deadline: '2024-06-12' },
    { country: 'Saudi Arabia', status: 'Approved', icon: '🇸🇦', deadline: '2024-05-30' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Welcome Back, Omar!</h2>
          <p className="text-gray-500">Manage your bookings and visa applications here.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">Edit Profile</button>
          <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">Support Chat</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visa Tracker */}
        <div className="md:col-span-2 space-y-6">
          <div className="border border-gray-100 rounded-xl p-6 bg-blue-50/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <CheckCircle className="text-green-500" size={20} />
                <span>Active Visa Applications</span>
              </h3>
              <a href="#" className="text-blue-600 text-sm font-medium hover:underline">Track All</a>
            </div>
            <div className="space-y-4">
              {activeVisas.map((visa, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{visa.icon}</span>
                    <div>
                      <p className="font-semibold">{visa.country}</p>
                      <p className="text-xs text-gray-400">Application #{10234 + i}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      visa.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {visa.status}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Due: {visa.deadline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 p-6 rounded-xl hover:shadow-md transition-shadow">
              <ShoppingBag className="text-orange-500 mb-4" />
              <h4 className="font-bold mb-1">Upcoming Trips</h4>
              <p className="text-sm text-gray-500 mb-4">You have 1 upcoming trip to Istanbul.</p>
              <button className="text-orange-600 font-bold text-sm flex items-center group">
                View Details <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="bg-white border border-gray-100 p-6 rounded-xl hover:shadow-md transition-shadow">
              <CreditCard className="text-blue-500 mb-4" />
              <h4 className="font-bold mb-1">My Wallet</h4>
              <p className="text-sm text-gray-500 mb-4">Balance: <span className="text-blue-900 font-bold">$1,240.00</span></p>
              <button className="text-blue-600 font-bold text-sm flex items-center group">
                Top Up <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar / Quick Actions */}
        <div className="space-y-6">
          <div className="bg-blue-900 text-white p-6 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2">Plan Omrah</h3>
              <p className="text-blue-100 text-sm mb-4">Get personalized packages for your next spiritual journey.</p>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors">Get Started</button>
            </div>
            <Moon className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32" />
          </div>

          <div className="border border-gray-100 rounded-xl p-6 bg-gray-50">
            <h4 className="font-bold mb-4 flex items-center space-x-2">
              <Clock size={18} className="text-gray-400" />
              <span>Recent Activity</span>
            </h4>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                  <div>
                    <p className="text-xs font-medium">Billeterie search for Dubai</p>
                    <p className="text-[10px] text-gray-400">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSpace;
