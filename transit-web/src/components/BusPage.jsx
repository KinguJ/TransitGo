import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

// Helper function to normalize MongoDB ObjectId
const normalizeId = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const BusPage = () => {
  const [busRoutes, setBusRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusRoutes = async () => {
      try {
        const [linesRes, vehiclesRes] = await Promise.all([
          axios.get('/lines'),
          axios.get('/vehicles')
        ]);

        // Log the response format
        console.log('Lines response:', linesRes.data[0]);
        console.log('Vehicles response:', vehiclesRes.data[0]);

        // Filter bus vehicles first
        const busVehicles = vehiclesRes.data.filter(v => v.type === 'Bus');
        
        // Get the line IDs that have bus vehicles
        const busLineIds = new Set(busVehicles.map(v => normalizeId(v.lineId)));
        
        // Filter lines that have bus vehicles
        const busLines = linesRes.data.filter(line => 
          busLineIds.has(normalizeId(line._id))
        );

        // Combine line and vehicle data
        const routes = busLines.map(line => {
          const vehicle = busVehicles.find(v => 
            normalizeId(v.lineId) === normalizeId(line._id)
          );
          const [, destination] = line.longName.split(' → ');
          
          return {
            id: normalizeId(line._id),
            routeNumber: line.number,
            name: line.longName,
            status: vehicle?.status || 'Unknown',
            nextDeparture: vehicle ? '5 min' : 'No vehicle assigned', // This should come from a schedule API
            destination: destination || 'Unknown Destination',
            occupancy: vehicle?.occupancy || 'Unknown',
            direction: line.direction,
            schedule: {
              firstDeparture: line.schedule?.firstDeparture,
              lastDeparture: line.schedule?.lastDeparture
            }
          };
        });

        setBusRoutes(routes);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBusRoutes();
  }, []);

  const handleRouteClick = (lineId) => {
    navigate(`/line/${lineId}`);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'on time':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupancyColor = (occupancy) => {
    switch (occupancy.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Error loading bus routes</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bus Routes</h1>
              <p className="mt-2 text-sm text-gray-600">Live updates and schedules for all bus routes</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              ← Back to Options
            </Link>
          </div>
        </div>

        {busRoutes.length === 0 ? (
          <div className="bg-white shadow sm:rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">No bus routes available</h3>
            <p className="mt-2 text-gray-600">Check back later for updates</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {busRoutes.map((route) => (
                <li 
                  key={route.id}
                  onClick={() => handleRouteClick(route.id)}
                  className="cursor-pointer"
                >
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-600">{route.routeNumber}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{route.name}</div>
                          <div className="text-sm text-gray-500">
                            Schedule: {route.schedule.firstDeparture} - {route.schedule.lastDeparture}
                          </div>
                          <div className="text-xs text-gray-400">Direction: {route.direction}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                          {route.status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOccupancyColor(route.occupancy)}`}>
                          {route.occupancy}
                        </span>
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Next: </span>
                          {route.nextDeparture}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusPage; 