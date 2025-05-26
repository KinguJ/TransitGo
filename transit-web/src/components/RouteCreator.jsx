import React, { useState, useEffect } from 'react';
import { Polyline, useMapEvents, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Import bus stop icon
import busStopIconUrl from '../assets/bus-stop.png';

// Create a custom bus stop icon
const busStopIcon = new L.Icon({
  iconUrl: busStopIconUrl,
  iconSize: [32, 32],     // Adjust size as needed
  iconAnchor: [16, 16],   // Center point of the icon
  popupAnchor: [0, -16],  // Position of popups relative to icon
});

const RouteCreator = () => {
  const [waypoints, setWaypoints] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const map = useMap();

  // Only fetch the route, never add the control
  useEffect(() => {
    if (waypoints.length >= 2) {
      const router = L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'
      });

      // Create proper waypoint objects
      const waypointObjects = waypoints.map(wp => ({
        latLng: L.latLng(wp[0], wp[1]),
        name: ''
      }));

      router.route(waypointObjects, (err, routes) => {
        if (!err && routes && routes.length > 0) {
          setRoutePath(routes[0].coordinates.map(c => [c.lat, c.lng]));
        }
      });
    } else {
      setRoutePath([]);
    }
  }, [waypoints]);

  // Prevent map clicks from firing when clicking the button
  useMapEvents({
    click: (e) => {
      if (isCreating) {
        const mapRect = map.getContainer().getBoundingClientRect();
        // Check if click is inside the button area
        if (e.originalEvent && e.originalEvent.clientX < mapRect.left + 220 && e.originalEvent.clientY < mapRect.top + 100) {
          return;
        }
        setWaypoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
      }
    }
  });

  const handleClearRoute = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setWaypoints([]);
    setRoutePath([]);
    setIsCreating(false);
  };

  return (
    <>
      <div 
        className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-lg shadow-md"
        onClick={e => e.stopPropagation()} // Stop click bubbling
      >
        <div className="flex gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              setIsCreating(!isCreating);
            }}
            className={`px-4 py-2 rounded ${
              isCreating ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}
          >
            {isCreating ? 'Stop Creating' : 'Create Route'}
          </button>
          
          {waypoints.length > 0 && (
            <button
              onClick={handleClearRoute}
              className="px-4 py-2 rounded bg-gray-500 text-white"
            >
              Clear Route
            </button>
          )}
        </div>
        
        {isCreating && (
          <p className="text-sm text-gray-600 mt-2">
            Click on the map to add route points ({waypoints.length} points added)
          </p>
        )}
      </div>

      {/* Render bus stop markers */}
      {waypoints.map((point, index) => (
        <Marker 
          key={`marker-${index}`}
          position={point}
          icon={busStopIcon}
        />
      ))}

      {/* Render route path */}
      {routePath.length > 0 && (
        <Polyline
          positions={routePath}
          color="#6366F1"
          weight={6}
          opacity={0.8}
        />
      )}
    </>
  );
};

export default RouteCreator; 