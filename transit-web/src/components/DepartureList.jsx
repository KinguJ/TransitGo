import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import { getCurrentLocation, calculateDistance } from '../utils/stationService';
import { useDevClock } from '../context/ClockContext';
import { useTransitSim } from '../sim/TransitSimContext';

// Helper function to normalize MongoDB ObjectId
const norm = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const DEV_MIN_PER_STOP = 2;

const DepartureCard = ({ line, platform, time, status, currentStop, direction, vehicleType, route }) => {
  const statusColors = {
    'On Time': 'bg-green-100 text-green-800',
    'Delayed': 'bg-red-100 text-red-800',
    'Approaching': 'bg-yellow-100 text-yellow-800',
    'At Stop': 'bg-blue-100 text-blue-800',
    'On Route': 'bg-blue-100 text-blue-800'
  };

  // Color for vehicle number based on direction (same as RouteMap.jsx)
  const numberColor = direction === 'Inbound' ? 'text-blue-600' : 'text-green-600';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">
          {vehicleType === 'bus' && <span className="mr-1" role="img" aria-label="bus">🚌</span>}
          <span className={numberColor}>{line}</span>
        </h3>
        <p className="text-gray-600 text-sm">
          <span className="text-green-600">📍</span> {route}
        </p>
        {currentStop && (
          <p className="text-gray-500 text-xs mt-1">
            Current stop: {currentStop}
          </p>
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
  const [nearestStation, setNearestStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const simNow = useDevClock();
  const { api } = useTransitSim();      // we only need lines & stops

  // Get nearest station
  useEffect(() => {
    const findNearestStation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user's location
        const location = await getCurrentLocation();
        
        // Get nearest station using the /nearby endpoint (which works) and take first result
        const response = await axios.get('/stops/nearby', {
          params: {
            lng: location.longitude,
            lat: location.latitude
          }
        });
        
        if (response.data && response.data.length > 0) {
          const station = {
            ...response.data[0], // Take the first (nearest) station
            distance: calculateDistance(
              location.latitude, 
              location.longitude, 
              response.data[0].location.coordinates[1], 
              response.data[0].location.coordinates[0]
            )
          };
          setNearestStation(station);
        }
      } catch (error) {
        console.error('Error finding nearest station:', error);
        setError('Unable to find nearest station');
      } finally {
        setLoading(false);
      }
    };
    
    findNearestStation();
  }, []);

  // Generate departures purely from schedules (like the original version)
  const generate = () => {
    if (!nearestStation || !api.lines.length) return [];

    const nowMin = simNow.getHours() * 60 + simNow.getMinutes();
    const out = [];

    api.lines.forEach(line => {
      if (!line.schedule || !line.schedule.frequency) return;
      if (!line.stopIds.includes(nearestStation._id)) return;

      const freq = parseInt(line.schedule.frequency);
      const [fh, fm] = line.schedule.firstDeparture.split(':').map(Number);
      const [lh, lm] = line.schedule.lastDeparture.split(':').map(Number);
      const firstMin = fh * 60 + fm;
      const lastMin  = lh * 60 + lm;
      if (nowMin < firstMin || nowMin > lastMin) return;

      // find the first departure time **not yet passed**
      const slotsSinceFirst = Math.floor((nowMin - firstMin) / freq);
      for (let k = 0; k < 10; k++) {              // look a few slots ahead
        const depMin = firstMin + (slotsSinceFirst + k) * freq;
        if (depMin > lastMin) break;
        const inMin = depMin - nowMin;
        // hide trips that are already finished (passed *every* stop)
        const maxTripMins = (line.stopIds.length - 1) * DEV_MIN_PER_STOP;
        if (inMin < -maxTripMins || inMin > 20) break;

        // compute route string from first → last stop
        const originStopId = line.stopIds[0];
        const destStopId   = line.stopIds[line.stopIds.length - 1];
        const origin = api.stops.find(s => norm(s._id) === norm(originStopId))?.name;
        const dest   = api.stops.find(s => norm(s._id) === norm(destStopId))?.name;
        const routeStr = origin && dest ? `${origin} → ${dest}` : null;

        // ---------- dynamic current-stop estimation ------------------
        const orderedStopIds = line.direction === 'Inbound'
          ? [...line.stopIds].reverse()
          : line.stopIds;

        const idxNearest = orderedStopIds.indexOf(nearestStation._id);
        if (idxNearest === -1) return;            // safety guard

        // positive → minutes *until* departure, negative → minutes *since* departure
        const minsSinceDep = Math.max(0, -inMin);
        const stopsPassed  = Math.floor(minsSinceDep / DEV_MIN_PER_STOP);

        const currentIdx = Math.min(stopsPassed, orderedStopIds.indexOf(nearestStation._id));
        const currentStopId = orderedStopIds[currentIdx];
        const currentStopName = api.stops.find(
          s => norm(s._id) === norm(currentStopId)
        )?.name;

        out.push({
          id: `${line._id}-${depMin}`,
          line: line.number,
          platform: `${nearestStation.name}`,
          time: inMin > 0 ? `${inMin} min` : inMin === 0 ? 'Now' : `${Math.abs(inMin)} min ago`,
          status: inMin > 0 ? 'On Time'
                 : currentIdx === orderedStopIds.indexOf(nearestStation._id) ? 'Approaching'
                 : 'On Route',
          currentStop: currentStopName,
          direction: line.direction,
          vehicleType: 'bus',
          route: routeStr
        });
        
        // Optional: limit to first departure per line
        break;
      }
    });

    return out.sort((a, b) => {
      const aNum = a.time === 'Now' ? 0 : parseInt(a.time);
      const bNum = b.time === 'Now' ? 0 : parseInt(b.time);
      return aNum - bNum;
    });
  };

  useEffect(() => {
    if (!nearestStation || !api.lines.length) return;
    setDepartures(generate());   // recompute whenever simNow ticks
  }, [nearestStation, api.lines, api.stops, simNow]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {nearestStation ? `Departures from ${nearestStation.name}` : 'Departure Times'}
        </h2>
        <p className="text-gray-600">
          {nearestStation 
            ? `Your nearest station • ${nearestStation.distance?.toFixed(2)} km away`
            : 'Real-time departures from your nearest station'
          }
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Finding your nearest station...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Departures</h3>
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {departures.length > 0 ? (
            departures.slice(0, 6).map(departure => (
              <DepartureCard
                key={departure.id}
                {...departure}
                vehicleType={departure.vehicleType}
                route={departure.route}
                currentStop={departure.currentStop}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {nearestStation 
                ? `No incoming departures for ${nearestStation.name} at this time`
                : 'No departures scheduled at this time'
              }
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default DepartureList; 