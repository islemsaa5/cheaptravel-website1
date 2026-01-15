
import React from 'react';
import { SERVICES_LIST } from '../constants';

const Services: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 font-poppins">Nos Solutions de Voyage</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            De la gestion officielle des visas aux circuits organisés dans le monde entier, nous rendons le voyage simple, abordable et sans stress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {SERVICES_LIST.map((service, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-3 group-hover:text-orange-500 transition-colors">{service.label}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {service.description.replace('Réservation de vols nationaux et internationaux connectée aux tarifs officiels.', 'Réservations de vols avec accès direct aux tarifs GDS.')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
