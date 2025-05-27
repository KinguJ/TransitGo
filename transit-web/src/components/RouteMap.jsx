import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../utils/axios';
import { getRouteCoordinates } from '../utils/osrm';
import 'leaflet-polylinedecorator';

// Import icons
import busStopIcon from '../assets/bus-stop.png';
import busIcon from '../assets/bus-icon.png';

// Create custom icons
const stopIcon = new L.Icon({
  iconUrl: busStopIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const vehicleIcon = new L.Icon({
  iconUrl: busIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Initialize vehicle state
const initVehicleState = (vehicles, lines) =>
  Object.fromEntries(
    vehicles.map(v => {
      const line = lines.find(l => l._id === v.lineId);
      return [
        v._id,
        {
          progress: 0,
          speed: 2500 + Math.random() * 1500,
          pauseUntil: 0,
          direction: line?.direction || 'Outbound',
          lastTrafficCheck: 0,
          visitedStops: new Set(),
          completed: false,
        },
      ];
    })
  );

// Helper function to normalize MongoDB ObjectId
const normalizeId = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

const RouteMap = () => {
  const { lineId } = useParams();
  const [map, setMap] = useState(null);
  const [line, setLine] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [stops, setStops] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const defaultPosition = [38.6748, 39.2225]; // Elazığ coordinates
  const zoom = 13;

  const vehiclePositionsRef = useRef({});
  const vehicleStateRef = useRef({});
  const animationRef = useRef(null);
  const [, forceUpdate] = useState({});
  const polylineRef = useRef(null);
  const decoratorRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsRes, linesRes, vehiclesRes] = await Promise.all([
          axios.get('/stops'),
          axios.get('/lines'),
          axios.get('/vehicles')
        ]);

        // Log the response format
        console.log('Lines response:', linesRes.data[0]);
        console.log('Vehicles response:', vehiclesRes.data[0]);
        console.log('Looking for lineId:', lineId);

        // Find the specific line
        const lineData = linesRes.data.find(l => 
          normalizeId(l._id) === lineId
        );
        if (!lineData) {
          throw new Error('Line not found');
        }

        // Get vehicles for this line
        const lineVehicles = vehiclesRes.data.filter(v => 
          normalizeId(v.lineId) === lineId
        );

        // Get stops for this line
        const lineStops = stopsRes.data.filter(stop => 
          lineData.stopIds.some(id => 
            normalizeId(id) === normalizeId(stop._id)
          )
        );

        setLine(lineData);
        setVehicles(lineVehicles);
        setStops(lineStops);

        // Initialize vehicle states
        vehicleStateRef.current = initVehicleState(lineVehicles, [lineData]);

        // Get route coordinates
        const stopPoints = lineStops.map(stop => [
          stop.location.coordinates[1],
          stop.location.coordinates[0]
        ]);

        const coordinates = await getRouteCoordinates(stopPoints);
        setRoutePath(coordinates);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (decoratorRef.current && map) {
        decoratorRef.current.remove();
      }
    };
  }, [lineId, map]);

  // Animation frame effect
  useEffect(() => {
    if (!routePath.length || !vehicles.length) return;

    let lastUpdate = performance.now();
    let frameCount = 0;

    const frame = (now) => {
      const dt = (now - lastUpdate) / 3600000;
      lastUpdate = now;

      const newPositions = { ...vehiclePositionsRef.current };
      const vs = vehicleStateRef.current;

      // Check if all vehicles have completed their routes
      const allCompleted = vehicles.every(v => vs[v._id]?.completed);
      if (allCompleted) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }

      vehicles.forEach(v => {
        const st = vs[v._id];
        if (!st || st.completed) return;

        // Safety check for visitedStops
        if (!st.visitedStops) {
          st.visitedStops = new Set();
        }

        // Handle active pause
        if (now < st.pauseUntil) {
          newPositions[v._id] = getPositionAlongPath(routePath, st.progress);
          return;
        }

        // Advance progress by speed
        const total = routePath.reduce((d,p,i) =>
          i ? d + L.latLng(p).distanceTo(L.latLng(routePath[i-1])) : 0, 0) / 1000;
        const deltaProgress = (st.speed * dt) / total;
        
        st.progress += deltaProgress;
        if (st.progress >= 1) {
          // Mark the route as completed instead of resetting
          st.completed = true;
          st.progress = 1; // Keep at end position
          newPositions[v._id] = getPositionAlongPath(routePath, 1);
          return;
        }

        const pos = getPositionAlongPath(routePath, st.progress);
        if (!pos) return;

        // Check stop proximity
        const STOP_RADIUS = 20; // meters
        const MIN_GAP = 0.03;

        stops.forEach((stop, idx) => {
          if (st.visitedStops.has(stop._id)) return;

          // Only check stops that match the vehicle's direction
          if (stop.direction !== 'Both' && stop.direction !== st.direction) return;

          const stopPos = [
            stop.location.coordinates[1],
            stop.location.coordinates[0],
          ];
          const dist = L.latLng(pos).distanceTo(L.latLng(stopPos));

          const stopProg = idx / (stops.length - 1);
          if (st.progress > stopProg + MIN_GAP) return;

          if (dist < STOP_RADIUS) {
            newPositions[v._id] = stopPos;
            st.pauseUntil = now + 1000;
            st.visitedStops.add(stop._id);
          }
        });

        // Random traffic events
        const TRAFFIC_CHECK_INTERVAL = 2000;
        if (now - st.lastTrafficCheck > TRAFFIC_CHECK_INTERVAL) {
          st.lastTrafficCheck = now;
          if (Math.random() < 0.10) {
            st.pauseUntil = now + (500 + Math.random()*1000);
          }
        }

        newPositions[v._id] = pos;
      });

      vehiclePositionsRef.current = newPositions;
      
      frameCount++;
      if (frameCount >= 1) {
        frameCount = 0;
        forceUpdate({});
      }

      animationRef.current = requestAnimationFrame(frame);
    };

    animationRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [routePath, vehicles, stops]);

  // Add polyline decorator effect
  useEffect(() => {
    if (!map || !polylineRef.current || !routePath.length) return;

    if (decoratorRef.current) {
      decoratorRef.current.remove();
    }

    decoratorRef.current = L.polylineDecorator(polylineRef.current, {
      patterns: [
        {
          offset: 25,
          repeat: 50,
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            polygon: false,
            pathOptions: { 
              stroke: true,
              color: '#5d5d5d',
              weight: 3
            }
          })
        }
      ]
    }).addTo(map);

    return () => {
      if (decoratorRef.current) {
        decoratorRef.current.remove();
      }
    };
  }, [map, routePath]);

  const getPositionAlongPath = (path, progress) => {
    if (!path || path.length < 2) return null;
    
    const totalDistance = path.reduce((acc, point, i) => {
      if (i === 0) return 0;
      const prev = path[i - 1];
      return acc + L.latLng(prev).distanceTo(L.latLng(point));
    }, 0);

    let targetDistance = totalDistance * progress;
    let coveredDistance = 0;

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const segmentDistance = L.latLng(prev).distanceTo(L.latLng(current));

      if (coveredDistance + segmentDistance >= targetDistance) {
        const remainingDistance = targetDistance - coveredDistance;
        const ratio = remainingDistance / segmentDistance;
        
        return [
          prev[0] + (current[0] - prev[0]) * ratio,
          prev[1] + (current[1] - prev[1]) * ratio
        ];
      }

      coveredDistance += segmentDistance;
    }

    return path[path.length - 1];
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
          <h2 className="text-xl font-semibold text-gray-900">Error loading route</h2>
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
    <div className="h-screen w-screen relative">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Link
          to={`/transport/${line?.type?.toLowerCase() || 'bus'}`}
          className="px-4 py-2 bg-white rounded-md shadow-md hover:bg-gray-50 text-gray-900 flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to Routes</span>
        </Link>
      </div>

      {/* Route info panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-md shadow-md">
        <h2 className="font-bold text-lg">{line?.longName}</h2>
        <div className="text-sm text-gray-600">
          <p>Route: {line?.number}</p>
          <p>Direction: {line?.direction}</p>
          <p>Schedule: {line?.schedule?.firstDeparture} - {line?.schedule?.lastDeparture}</p>
          {vehicles.length > 0 && (
            <>
              <p className="mt-2">Active Vehicles: {vehicles.length}</p>
              {vehicles.map(v => (
                <div key={v._id} className="mt-1">
                  <p>Status: {v.status}</p>
                  <p>Occupancy: {v.occupancy || 'Unknown'}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <MapContainer 
        center={defaultPosition}
        zoom={zoom}
        className="h-full w-full"
        ref={setMap}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Route path */}
        {routePath.length > 0 && (
          <Polyline
            ref={polylineRef}
            positions={routePath}
            pathOptions={{ 
              color: line?.direction?.toLowerCase() === 'inbound' ? '#3b82f6' : '#22c55e',
              weight: 4,
              opacity: 0.8
            }}
          />
        )}

        {/* Stops */}
        {stops.map(stop => (
          <Marker
            key={stop._id}
            position={[stop.location.coordinates[1], stop.location.coordinates[0]]}
            icon={stopIcon}
          >
            <Popup>
              <div className="font-semibold">{stop.name}</div>
            </Popup>
          </Marker>
        ))}

        {/* Vehicles */}
        {vehicles.map(vehicle => {
          const position = vehiclePositionsRef.current[vehicle._id];
          if (!position) return null;

          return (
            <Marker
              key={vehicle._id}
              position={position}
              icon={vehicleIcon}
            >
              <Popup>
                <div>
                  <div className="font-semibold">{vehicle.number}</div>
                  <div className="text-sm">Status: {vehicle.status}</div>
                  <div className="text-sm">Occupancy: {vehicle.occupancy || 'Unknown'}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RouteMap; 