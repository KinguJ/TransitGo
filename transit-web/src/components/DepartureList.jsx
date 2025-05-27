import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import L from 'leaflet';

const DepartureCard = ({ line, platform, time, status, nextStop }) => {
  const statusColors = {
    'On Time': 'bg-green-100 text-green-800',
    'Delayed': 'bg-red-100 text-red-800',
    'Approaching': 'bg-yellow-100 text-yellow-800',
    'At Stop': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{line}</h3>
        <p className="text-gray-600 text-sm">{platform}</p>
        {nextStop && (
          <p className="text-gray-500 text-xs mt-1">Next: {nextStop}</p>
        )}
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
  const [stops, setStops] = useState([]);
  const [lines, setLines] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const vehicleStatesRef = useRef({});
  const animationRef = useRef(null);

  // Initialize vehicle states
  const initVehicleState = (vehicles, lines) =>
    Object.fromEntries(
      vehicles.map(v => {
        const line = lines.find(l => l._id === v.lineId);
        return [
          v._id,
          {
            progress: 0,
            speed: (2500 + Math.random() * 1500) / 7, // Reduced speed by factor of 10
            pauseUntil: 0,
            direction: line?.direction || 'Outbound',
            lastTrafficCheck: 0,
            visitedStops: new Set(),
          },
        ];
      })
    );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsRes, linesRes, vehiclesRes] = await Promise.all([
          axios.get('/stops'),
          axios.get('/lines'),
          axios.get('/vehicles')
        ]);

        setStops(stopsRes.data);
        setLines(linesRes.data);
        setVehicles(vehiclesRes.data);
        vehicleStatesRef.current = initVehicleState(vehiclesRes.data, linesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Animation frame for vehicle movement
  useEffect(() => {
    if (!vehicles.length || !lines.length || !stops.length) return;

    let lastUpdate = performance.now();
    let frameCount = 0;

    const frame = (now) => {
      const dt = (now - lastUpdate) / 3600000; // Convert to hours
      lastUpdate = now;

      const vs = vehicleStatesRef.current;
      const newDepartures = [];

      vehicles.forEach(v => {
        const line = lines.find(l => l._id === v.lineId);
        if (!line) return;

        const st = vs[v._id];
        if (!st) return;

        // Safety check for visitedStops
        if (!st.visitedStops) {
          st.visitedStops = new Set();
        }

        // Handle active pause
        if (now < st.pauseUntil) {
          updateDepartureInfo(v, line, st, newDepartures);
          return;
        }

        // Advance progress
        const stopIds = line.stopIds;
        const total = stopIds.length - 1;
        const deltaProgress = (st.speed * dt) / total;
        
        st.progress += deltaProgress;
        if (st.progress >= 1) {
          st.progress = 0;
          st.direction = st.direction === 'Outbound' ? 'Inbound' : 'Outbound';
          st.visitedStops.clear();
        }

        // Check stops
        const currentStopIndex = Math.floor(st.progress * total);
        const nextStopIndex = st.direction === 'Outbound' 
          ? currentStopIndex + 1 
          : currentStopIndex - 1;

        const currentStop = stops.find(s => s._id === stopIds[currentStopIndex]);
        const nextStop = stops.find(s => s._id === stopIds[nextStopIndex]);

        if (currentStop && nextStop) {
          const distance = L.latLng(currentStop.location.coordinates).distanceTo(
            L.latLng(nextStop.location.coordinates)
          ) / 1000; // Convert to km

          const timeToNext = Math.round((distance / st.speed) * 60); // Convert to minutes

          // Check if we should stop
          if (distance < 0.02 && !st.visitedStops.has(nextStop._id)) { // 20 meters
            st.pauseUntil = now + 5000; // Increased to 5 seconds stop
            st.visitedStops.add(nextStop._id);
          }

          updateDepartureInfo(v, line, st, newDepartures, {
            currentStop,
            nextStop,
            timeToNext
          });
        }
      });

      setDepartures(newDepartures);
      
      frameCount++;
      if (frameCount >= 1) {
        frameCount = 0;
      }

      animationRef.current = requestAnimationFrame(frame);
    };

    animationRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [vehicles, lines, stops]);

  const updateDepartureInfo = (vehicle, line, state, departures, stopInfo = {}) => {
    const { currentStop, nextStop, timeToNext } = stopInfo;
    
    let status = 'On Time';
    if (state.pauseUntil > Date.now()) {
      status = 'At Stop';
    } else if (timeToNext < 2) {
      status = 'Approaching';
    } else if (timeToNext > 5) {
      status = 'Delayed';
    }

    departures.push({
      id: vehicle._id,
      line: `${vehicle.type} ${vehicle.number}`,
      platform: `${currentStop?.name || 'Unknown'} → ${nextStop?.name || 'Terminal'}`,
      time: timeToNext ? `${timeToNext} min` : 'Now',
      status,
      nextStop: nextStop?.name
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Departure Times</h2>
        <p className="text-gray-600">Real-time departures from nearby stations</p>
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