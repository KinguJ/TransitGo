import React from 'react';

const StationBadge = ({ text, color = 'bg-gray-100 text-gray-800' }) => (
  <span className={`${color} text-xs px-2 py-1 rounded-full font-medium`}>
    {text}
  </span>
);

const StationCard = ({ name, lines, distance, features }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <span className="text-sm text-gray-500">{distance} km</span>
      </div>

      <div className="space-y-4">
        {/* Transport Lines */}
        <div className="flex flex-wrap gap-2">
          {lines.map((line, index) => (
            <StationBadge
              key={index}
              text={line}
              color={
                line.startsWith('Bus') ? 'bg-green-100 text-green-800' :
                line.startsWith('Metro') ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }
            />
          ))}
        </div>

        {/* Station Features */}
        <div className="flex flex-wrap gap-2">
          {features.map((feature, index) => (
            <StationBadge key={index} text={feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

const NearbyStations = () => {
  const stations = [
    {
      name: 'Central Station',
      lines: ['Metro Line 1', 'Bus 42', 'Tram 7'],
      distance: '0.5',
      features: ['Ticket Machine', 'Waiting Area', 'Elevator']
    },
    {
      name: 'Shopping District',
      lines: ['Bus 42', 'Bus 15'],
      distance: '0.8',
      features: ['Ticket Machine', 'Covered Waiting Area']
    },
    {
      name: 'University Station',
      lines: ['Metro Line 2', 'Tram 7'],
      distance: '1.2',
      features: ['Ticket Machine', 'Bike Parking']
    },
    {
      name: 'Airport Express',
      lines: ['Metro Line 3', 'Bus Airport'],
      distance: '1.5',
      features: ['Information Desk', 'Luggage Storage', 'Elevator']
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Nearby Stations</h2>
        <p className="text-gray-600">Find stations and their available services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {stations.map((station, index) => (
          <StationCard key={index} {...station} />
        ))}
      </div>
    </section>
  );
};

export default NearbyStations; 