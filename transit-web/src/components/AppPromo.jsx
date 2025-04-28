import React from 'react';

const AppPromo = () => {
  return (
    <section className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">Get the TransitGo Mobile App</h2>
            <p className="text-blue-100">
              Plan trips, buy tickets, and get real-time updates on the go.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              App Store
            </button>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              Google Play
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPromo; 