import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

const TransitSimContext = createContext(null);
export const useTransitSim = () => useContext(TransitSimContext);

// Simple provider that provides basic API data for DepartureList - animation logic is in RouteMap.jsx
export const TransitSimProvider = ({ children }) => {
  const [api, setApi] = useState({ lines: [], stops: [], vehicles: [] });
  const [vehicles, setVehicles] = useState({});
  const [positions, setPositions] = useState({});

  // Fetch API data on mount
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const [linesRes, stopsRes, vehiclesRes] = await Promise.all([
          axios.get('/lines'),
          axios.get('/stops'),
          axios.get('/vehicles')
        ]);

        setApi({
          lines: linesRes.data,
          stops: stopsRes.data,
          vehicles: vehiclesRes.data
        });

        // Initialize vehicles object for DepartureList
        const vehiclesObj = {};
        vehiclesRes.data.forEach(vehicle => {
          vehiclesObj[vehicle._id] = {
            id: vehicle._id,
            lineId: vehicle.lineId,
            progress: 0.5, // Default progress
            direction: 'Outbound' // Default direction
          };
        });
        setVehicles(vehiclesObj);

      } catch (error) {
        console.error('Error fetching API data:', error);
      }
    };

    fetchApiData();
  }, []);

  const value = {
    api,
    vehicles,
    positions
  };

  return (
    <TransitSimContext.Provider value={value}>
      {children}
    </TransitSimContext.Provider>
  );
}; 