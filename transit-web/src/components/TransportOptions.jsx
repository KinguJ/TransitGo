import React from 'react';
import { useNavigate } from 'react-router-dom';

const TransportCard = ({ type, letter, color, available, onClick }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg cursor-pointer ${!available && 'opacity-50'}`}
      onClick={onClick}
    >
      <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center mb-4 text-white text-3xl font-bold`}>
        {letter}
      </div>
      <h3 className="font-semibold text-gray-900 text-lg">{type}</h3>
      {!available && (
        <span className="text-sm text-gray-500">Currently unavailable</span>
      )}
    </div>
  );
};

const TransportOptions = () => {
  const navigate = useNavigate();

  const options = [
    {
      type: 'Bus',
      letter: 'B',
      color: 'bg-blue-500',
      available: true
    },
    {
      type: 'Metro',
      letter: 'M',
      color: 'bg-red-500',
      available: true
    },
    {
      type: 'Tram',
      letter: 'T',
      color: 'bg-green-500',
      available: true
    }
  ];

  const handleTransportSelect = (type) => {
    navigate(`/transport/${type.toLowerCase()}`);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Transport Options</h2>
        <p className="text-gray-600">Available transportation methods in your area</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option, index) => (
          <TransportCard 
            key={index} 
            {...option} 
            onClick={() => handleTransportSelect(option.type)}
          />
        ))}
      </div>
    </section>
  );
};

export default TransportOptions; 