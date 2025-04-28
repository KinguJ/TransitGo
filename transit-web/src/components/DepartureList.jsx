import React, { useState, useEffect } from 'react';

const DepartureCard = ({ line, platform, time, status }) => {
  const statusColors = {
    'On Time': 'bg-green-100 text-green-800',
    'Delayed': 'bg-red-100 text-red-800',
    'Approaching': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{line}</h3>
        <p className="text-gray-600 text-sm">{platform}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-900 font-medium">{time}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
      </div>
    </div>
  );
};

const DepartureList = () => {
  const [departures, setDepartures] = useState([]);

  useEffect(() => {
    // Fetch departures from backend
    const fetchDepartures = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/vehicles');
        const vehicles = await response.json();
        
        // Transform vehicle data into departure format
        const currentTime = new Date();
        const departureList = vehicles.map(vehicle => {
          const nextDepartureMinutes = Math.ceil(currentTime.getMinutes() / vehicle.schedule.frequency) 
            * vehicle.schedule.frequency;
          const nextDepartureTime = new Date(currentTime.setMinutes(nextDepartureMinutes));

          return {
            id: vehicle._id,
            line: `${vehicle.type} ${vehicle.number}`,
            platform: `Platform ${Math.floor(Math.random() * 5) + 1} → ${vehicle.route.destination}`,
            time: nextDepartureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: vehicle.status
          };
        });

        setDepartures(departureList);
      } catch (error) {
        console.error('Error fetching departures:', error);
      }
    };

    fetchDepartures();
    const interval = setInterval(fetchDepartures, 5000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Departure Times</h2>
        <p className="text-gray-600">Upcoming departures from nearby stations</p>
      </div>

      <div className="space-y-4">
        {departures.map(departure => (
          <DepartureCard
            key={departure.id}
            {...departure}
          />
        ))}
      </div>
    </section>
  );
};

export default DepartureList; 