import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';  // Add Leaflet CSS import
import axios from '../../utils/axios';
import EditStopsPanel from './EditStopsPanel';
import EditVehiclesPanel from './EditVehiclesPanel';
import EditLinesPanel from './EditLinesPanel';
import { getRouteCoordinates } from '../../utils/osrm';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import 'leaflet-polylinedecorator';
import { useMapEvents } from 'react-leaflet';

// Import icons
import busStopIcon from '../../assets/bus-stop.png';
import busIcon from '../../assets/bus-icon.png';

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

// Add this at the top, outside the component
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
          visitedStops: new Set(),  // Always initialize visitedStops
        },
      ];
    })
  );

// Add this helper function at the top of the file, after the icons
const calculateBearing = (from, to) => {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const lon1 = from.lng * Math.PI / 180;
  const lon2 = to.lng * Math.PI / 180;
  
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  if (bearing < 0) bearing += 360;
  return bearing;
};

const AdminMap = () => {
  const { user } = useAuth();
  const defaultPosition = [38.6748, 39.2225]; // Elazığ coordinates
  const zoom = 13;
  
  const [map, setMap] = useState(null);
  const [mode, setMode] = useState('view');
  const [stops, setStops] = useState([]);
  const [lines, setLines] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [stopRoutePath, setStopRoutePath] = useState([]);
  const polylineRef = useRef(null);
  const decoratorRef = useRef(null);
  const [vehiclePaths, setVehiclePaths] = useState({});
  const vehiclePositionsRef = useRef({});
  const vehicleStateRef = useRef({});
  const [, forceUpdate] = useState({});
  const animationRef = useRef(null);
  const [tempStopPos, setTempStopPos] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stopsRes, linesRes, vehiclesRes] = await Promise.all([
        axios.get('/stops'),
        axios.get('/lines'),
        axios.get('/vehicles')
      ]);

      setStops(stopsRes.data);
      setLines(linesRes.data);
      setVehicles(vehiclesRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!selectedLineId) return;
      if (mode !== 'makeLine') return;
      
      const line = lines.find(l => l._id === selectedLineId);
      if (!line) return;

      // Add console log to debug
      console.log('Selected line:', line);
      console.log('Direction:', line.direction);

      const stopPoints = line.stopIds
        .map(stopId => {
          const stop = stops.find(s => s._id === stopId);
          return stop ? [stop.location.coordinates[1], stop.location.coordinates[0]] : null;
        })
        .filter(Boolean);

      const coordinates = await getRouteCoordinates(stopPoints);
      setRoutePath(coordinates);
    };

    fetchRoute();
  }, [selectedLineId, lines, stops, mode]);

  useEffect(() => {
    setSelectedLineId(null);
    setRoutePath([]);
  }, [mode]);

  useEffect(() => {
    if (!map || !polylineRef.current) return;

    // Remove old decorator if it exists
    if (decoratorRef.current) {
      decoratorRef.current.remove();
    }

    if (routePath.length > 1 && mode === 'makeLine') {
      // Create new decorator
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
                // selectedLineId && lines.find(l => l._id === selectedLineId)?.direction?.toLowerCase() === 'inbound'
                //   ? '#3b82f6' // Blue for inbound
                //   : '#22c55e', // Green for outbound
                weight: 3
              }
            })
          }
        ]
      }).addTo(map);
    }

    return () => {
      if (decoratorRef.current) {
        decoratorRef.current.remove();
      }
    };
  }, [map, routePath, mode, selectedLineId, lines]);

  const getPositionAlongPath = useCallback((path, progress, isReturning) => {
    if (!path || path.length < 2) return null;
    
    if (isReturning) {
      // Use reversed path for return journey
      const reversedPath = [...path].reverse();
      const reverseProgress = 1 - progress;
      return getPositionAlongPath(reversedPath, reverseProgress);
    }

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
  }, []);

  useEffect(() => {
    const fetchVehiclePaths = async () => {
      const paths = {};
      const newVehicleState = initVehicleState(vehicles, lines);

      for (const vehicle of vehicles) {
        if (vehicle.lineId) {
          const line = lines.find(l => l._id === vehicle.lineId);
          if (line) {
            const stopPoints = line.stopIds
              .map(stopId => {
                const stop = stops.find(s => s._id === stopId);
                return stop ? [stop.location.coordinates[1], stop.location.coordinates[0]] : null;
              })
              .filter(Boolean);
            
            const coordinates = await getRouteCoordinates(stopPoints);
            paths[vehicle._id] = coordinates;
          }
        }
      }
      setVehiclePaths(paths);
      vehicleStateRef.current = newVehicleState;
    };

    if (vehicles.length && lines.length && stops.length) {
      fetchVehiclePaths();
    }
  }, [vehicles, lines, stops]);

  useEffect(() => {
    if (!Object.keys(vehiclePaths).length) return;

    let lastUpdate = performance.now();
    let frameCount = 0;

    const frame = (now) => {
      const dt = (now - lastUpdate) / 3600000;
      lastUpdate = now;

      const newPositions = { ...vehiclePositionsRef.current };
      const vs = vehicleStateRef.current;

      vehicles.forEach(v => {
        const path = vehiclePaths[v._id];
        if (!path) return;

        const st = vs[v._id];
        if (!st) return;

        // Safety check for visitedStops
        if (!st.visitedStops) {
          st.visitedStops = new Set();
        }

        // Get the line and its stops for the current direction
        const line = lines.find(l => l._id === v.lineId);

        /* -------- handle active pause -------- */
        if (now < st.pauseUntil) {
          newPositions[v._id] = getPositionAlongPath(path, st.progress);
          return;
        }

        /* -------- advance progress by speed -------- */
        const total = path.reduce((d,p,i)=>
          i ? d + L.latLng(p).distanceTo(L.latLng(path[i-1])) : 0, 0) / 1000;
        const deltaProgress = (st.speed * dt) / total;
        
        st.progress += deltaProgress;
        if (st.progress >= 1) {
          st.progress = 0;
          st.direction = st.direction === 'Outbound' ? 'Inbound' : 'Outbound';
          st.visitedStops.clear();  // Clear visited stops when changing direction
        }

        /* -------- check stop proximity -------- */
        const pos = getPositionAlongPath(path, st.progress);
        const nextPos = getPositionAlongPath(path, st.progress + 0.001);
        if (!pos || !nextPos) return;

        const STOP_RADIUS = 20;            // m
        const MIN_GAP = 0.03;             // skip stops clearly behind the bus

        // Check all stops on this line
        line.stopIds.forEach((stopId, idx) => {
          if (st.visitedStops.has(stopId)) return;  // already served this stop

          const stop = stops.find(s => s._id === stopId);
          if (!stop) return;

          if (stop.direction !== 'Both' && stop.direction !== st.direction) return;

          const stopPos = [
            stop.location.coordinates[1],
            stop.location.coordinates[0],
          ];
          const dist = L.latLng(pos).distanceTo(L.latLng(stopPos));

          // progress of this stop along the *current* direction
          const stopProg = idx / (line.stopIds.length - 1);

          // skip if we are already past the stop by more than MIN_GAP
          if (st.progress > stopProg + MIN_GAP) return;

          if (dist < STOP_RADIUS) {
            // snap the bus exactly onto the stop, pause, mark visited
            newPositions[v._id] = stopPos;      // optional, looks cleaner
            st.pauseUntil = now + 1000;         // 1 s dwell time
            st.visitedStops.add(stopId);
            console.log(`Bus ${v._id} served stop ${stop.name}`);
          }
        });

        /* -------- random traffic event -------- */
        const TRAFFIC_CHECK_INTERVAL = 2000; // Check every 2 seconds
        if (now - st.lastTrafficCheck > TRAFFIC_CHECK_INTERVAL) {
          st.lastTrafficCheck = now;
          if (Math.random() < 0.10) { // 10% chance of traffic
            console.log(`Bus ${v._id} hit traffic at position:`, pos);
            st.pauseUntil = now + (500 + Math.random()*1000); // 0.5-1.5 seconds
          }
        }

        newPositions[v._id] = pos;
      });

      vehiclePositionsRef.current = newPositions;
      
      frameCount++;
      if (frameCount >= 1) {
        frameCount = 0;
        forceUpdate({});
        
        // Broadcast vehicle states to DepartureList
        window.postMessage({
          type: 'vehicleStateUpdate',
          states: vehicleStateRef.current
        }, '*');
      }

      animationRef.current = requestAnimationFrame(frame);
    };

    animationRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [vehiclePaths, vehicles, stops, getPositionAlongPath]);

  useEffect(() => {
    setTempStopPos(null);
  }, [mode]);

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading map data...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  const handleLineSelect = async (lineId, path) => {
    setSelectedLineId(lineId);
    setRoutePath(path || []);
  };

  const handleStopSelect = (stopId, path) => {
    setSelectedStopId(stopId);
    
    if (mode === 'editStops') {
      setStopRoutePath(path || []);
      setTempStopPos(null);
    } else if (mode === 'makeLine') {
      // Clear the selection after a brief delay to provide visual feedback
      setTimeout(() => {
        setSelectedStopId(null);
      }, 200);
    }
  };

  const handleMapClick = (e) => {
    if (mode === 'editStops') {
      console.log('Map click raw event:', e);
      console.log('Map click coordinates:', e.latlng);
      
      // Ensure we're setting numbers
      const lat = Number(e.latlng.lat);
      const lng = Number(e.latlng.lng);
      
      console.log('Parsed coordinates:', { lat, lng });
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Store as [lng, lat] for GeoJSON compatibility
        setTempStopPos([lng, lat]);
      } else {
        console.error('Invalid coordinates from map click:', { lat, lng });
      }
    }
  };

  const renderStops = () => {
    return stops.map(stop => {
      const isLineMode = mode === 'makeLine';
      const isSelectable = isLineMode && selectedStopId !== stop._id;

      // Create direction-based icon color
      const iconColor = stop.direction === 'Inbound' ? '#3b82f6' : 
                       stop.direction === 'Outbound' ? '#22c55e' : 
                       '#6b7280'; // Gray for "Both"

      // Create custom colored icon
      const coloredIcon = new L.Icon({
        iconUrl: busStopIcon,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: `stop-icon-${stop.direction?.toLowerCase()}` // For CSS styling
      });

      return (
        <Marker 
          key={stop._id} 
          position={[stop.location.coordinates[1], stop.location.coordinates[0]]}
          icon={coloredIcon}
          opacity={isSelectable ? 1 : 0.7}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              if (isLineMode) {
                handleStopSelect(stop._id, [[stop.location.coordinates[1], stop.location.coordinates[0]]]);
              }
            }
          }}
        >
          <Popup>
            <div className="font-semibold">{stop.name}</div>
            <div className="text-sm text-gray-600 mb-2">
              [{stop.location.coordinates[1].toFixed(6)}, {stop.location.coordinates[0].toFixed(6)}]
            </div>
            {mode === 'editStops' && (
              <div className="mt-2">
                <div className="text-sm font-medium mb-1">Direction:</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStopDirectionChange(stop._id, 'Outbound')}
                    className={`px-2 py-1 text-xs rounded ${
                      stop.direction === 'Outbound' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Outbound
                  </button>
                  <button
                    onClick={() => handleStopDirectionChange(stop._id, 'Inbound')}
                    className={`px-2 py-1 text-xs rounded ${
                      stop.direction === 'Inbound' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Inbound
                  </button>
                  <button
                    onClick={() => handleStopDirectionChange(stop._id, 'Both')}
                    className={`px-2 py-1 text-xs rounded ${
                      stop.direction === 'Both' 
                        ? 'bg-gray-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>
            )}
          </Popup>
        </Marker>
      );
    });
  };

  const renderVehicles = () => {
    return vehicles.map(vehicle => {
      const position = vehiclePositionsRef.current[vehicle._id];
      const state = vehicleStateRef.current[vehicle._id];
      if (!position || !state) return null;

      return (
        <Marker
          key={vehicle._id}
          position={position}
          icon={vehicleIcon}
        >
          <Popup>
            <div>
              <div className="font-semibold">{vehicle.type} {vehicle.number}</div>
              <div className="text-sm">
                Speed: {state.speed.toFixed(0)} km/h
              </div>
              <div className="text-sm">Direction: {state.direction}</div>
              <div className="text-sm">Status: {vehicle.status}</div>
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  // Add this function to handle direction changes
  const handleStopDirectionChange = async (stopId, newDirection) => {
    try {
      await axios.patch(`/api/stops/${stopId}`, { direction: newDirection });
      // Update local state
      setStops(prev =>
        prev.map(s =>
          s._id === stopId ? { ...s, direction: newDirection } : s
        )
      );
    } catch (error) {
      console.error('Failed to update stop direction:', error);
    }
  };

  return (
    <>
      {/* Add Back to Home button in top-left corner */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Link 
          to="/"
          className="px-4 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-700 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <MapContainer 
        center={defaultPosition}
        zoom={zoom}
        className="h-screen w-screen"
        ref={setMap}
        onClick={handleMapClick}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MapClickHandler onMapClick={handleMapClick} />
        
        {mode === 'editStops' && tempStopPos && (
          <Marker 
            position={[tempStopPos[1], tempStopPos[0]]}
            icon={stopIcon}
            opacity={0.7}
          />
        )}

        {/* Always render stops and lines */}
        {renderStops()}

        {/* Draw the selected route */}
        {routePath.length > 1 && mode === 'makeLine' && (
          <Polyline
            ref={polylineRef}
            positions={routePath}
            pathOptions={{ 
              color: selectedLineId && lines.find(l => l._id === selectedLineId)?.direction?.toLowerCase() === 'inbound'
                ? '#3b82f6' // Blue for inbound
                : '#22c55e', // Green for outbound
              weight: 6, 
              opacity: 0.8 
            }}
          />
        )}

        {/* Draw the selected stop route */}
        {stopRoutePath.length > 1 && mode === 'editStops' && (
          <Polyline
            positions={stopRoutePath}
            pathOptions={{ 
              color: selectedStopId && stops.find(s => s._id === selectedStopId)?.direction?.toLowerCase() === 'inbound'
                ? '#3b82f6' // Blue for inbound
                : '#22c55e', // Green for outbound
              weight: 6, 
              opacity: 0.8 
            }}
          />
        )}

        {/* Render mode-specific components */}
        {mode === 'editStops' && (
          <EditStopsPanel 
            onDone={fetchData} 
            stops={stops} 
            setStops={setStops}
            onStopSelect={handleStopSelect}
            selectedStopId={selectedStopId}
            panelMode={mode}
            tempStopPos={tempStopPos}
            setTempStopPos={setTempStopPos}
          />
        )}

        {mode === 'makeLine' && (
          <EditLinesPanel 
            onDone={fetchData}
            lines={lines}
            setLines={setLines}
            stops={stops}
            onLineSelect={handleLineSelect}
            selectedLineId={selectedLineId}
            panelMode={mode}
            selectedStopId={selectedStopId}
          />
        )}

        {mode === 'addVehicle' && (
          <EditVehiclesPanel 
            onDone={fetchData}
            vehicles={vehicles}
            setVehicles={setVehicles}
            lines={lines}
          />
        )}

        {mode === 'view' && (
          <>
            {renderVehicles()}
          </>
        )}
      </MapContainer>

      {/* Mode buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] flex space-x-2">
        <button 
          onClick={() => setMode('editStops')}
          className={`px-4 py-2 rounded ${mode === 'editStops' ? 'bg-red-500' : 'bg-blue-500'} text-white shadow-lg hover:bg-opacity-90`}
        >
          Manage Stops
        </button>
        <button 
          onClick={() => setMode('makeLine')}
          className={`px-4 py-2 rounded ${mode === 'makeLine' ? 'bg-red-500' : 'bg-blue-500'} text-white shadow-lg hover:bg-opacity-90`}
        >
          Manage Lines
        </button>
        <button 
          onClick={() => setMode('addVehicle')}
          className={`px-4 py-2 rounded ${mode === 'addVehicle' ? 'bg-red-500' : 'bg-blue-500'} text-white shadow-lg hover:bg-opacity-90`}
        >
          Manage Vehicles
        </button>
        <button 
          onClick={() => setMode('view')}
          className={`px-4 py-2 rounded ${mode === 'view' ? 'bg-red-500' : 'bg-blue-500'} text-white shadow-lg hover:bg-opacity-90`}
        >
          View
        </button>
      </div>
    </>
  );
};

const MapClickHandler = ({ onMapClick }) => {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
};

export default AdminMap; 