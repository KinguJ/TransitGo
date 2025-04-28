import React from 'react';

const TransportCard = ({ type, icon: Icon, color, available }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${!available && 'opacity-50'}`}>
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900">{type}</h3>
      {!available && (
        <span className="text-sm text-gray-500">Currently unavailable</span>
      )}
    </div>
  );
};

const TransportOptions = () => {
  const options = [
    {
      type: 'Bus',
      icon: props => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v6a2 2 0 002 2h2" />
        </svg>
      ),
      color: 'bg-green-500',
      available: true
    },
    {
      type: 'Metro',
      icon: props => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'bg-blue-500',
      available: true
    },
    {
      type: 'Tram',
      icon: props => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm0 5h14M5 14h14" />
        </svg>
      ),
      color: 'bg-yellow-500',
      available: true
    },
    {
      type: 'Bike Share',
      icon: props => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-gray-500',
      available: false
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Transport Options</h2>
        <p className="text-gray-600">Available transportation methods in your area</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {options.map((option, index) => (
          <TransportCard key={index} {...option} />
        ))}
      </div>
    </section>
  );
};

export default TransportOptions; 