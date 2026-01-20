
import React from 'react';
import { SERVICES_LIST } from '../constants';

const Services: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-blue-900 mb-4 tracking-tighter">Nos <span className="text-orange-500 italic">Solutions</span></h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base px-4">
            De la gestion officielle des visas aux circuits organisés, nous rendons le voyage simple et abordable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {SERVICES_LIST.map((service, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col items-center text-center group cursor-pointer hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gray-50 text-blue-900 rounded-[20px] flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-inner">
                {service.icon}
              </div>
              <h3 className="text-base font-black text-blue-900 mb-3 group-hover:text-orange-500 transition-colors uppercase tracking-widest">{service.label}</h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
