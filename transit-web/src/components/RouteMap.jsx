import React, { useState, useEffect, useRef, useReducer } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../utils/axios';
import { getRouteCoordinates } from '../utils/osrm';
import 'leaflet-polylinedecorator';
import { useDevClock } from '../context/ClockContext';

// Import icons
import busStopIcon from '../assets/bus-stop.png';
import busIcon from '../assets/bus-icon.png';
import tramIcon from '../assets/tram-icon.png';
import metroIcon from '../assets/metro-icon.png';

// Create custom icons
const stopIcon = new L.Icon({
  iconUrl: busStopIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const createVehicleIcon = (vehicleType) => {
  let iconUrl;
  switch (vehicleType) {
    case 'Metro':
      iconUrl = metroIcon;
      break;
    case 'Tram':
      iconUrl = tramIcon;
      break;
    case 'Bus':
    default:
      iconUrl = busIcon;
      break;
  }
  
  return new L.Icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Helper function to normalize MongoDB ObjectId
const normalizeId = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

// helper – km between consecutive points summed
const pathLengthKm = (pts) =>
  pts.reduce((d,p,i)=>
    i ? d + L.latLng(p).distanceTo(L.latLng(pts[i-1])) : 0, 0) / 1000;

const RouteMap = () => {
  const { lineId } = useParams();
  const simNow = useDevClock();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState([]);
  const [variants, setVariants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [map, setMap] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [direction, setDirection] = useState('Outbound');
  const [activeVehicles, setActiveVehicles] = useState(new Set());
  const [zoom, setZoom] = useState(13);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [departureCount, setDepartureCount] = useState(0);
  const [lastDepartureTime, setLastDepartureTime] = useState(null);
  
  const vehiclePositionsRef = useRef({});
  const vehicleStateRef = useRef({});
  const animationRef = useRef(null);
  const polylineRef = useRef(null);
  const decoratorRef = useRef(null);
  const idleQueueRef = useRef([]);
  const spawnedDeparturesRef = useRef(new Set());
  const directionDepartureCountRef = useRef({});
  const pathsRef = useRef({});
  
  // ==== keep track of the direction that is really on screen
  const liveDirRef = useRef('Outbound');
  useEffect(() => { liveDirRef.current = direction; }, [direction]);
  
  // Ensure we have a counter entry for the current direction
  useEffect(() => {
    if (!directionDepartureCountRef.current[direction]) {
      directionDepartureCountRef.current[direction] = 0;
    }
  }, [direction]);

  // Add state for API responses
  const [apiData, setApiData] = useState({
    stops: [],
    lines: [],
    vehicles: []
  });

  const defaultPosition = [38.6748, 39.2225]; // Elazığ coordinates

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsRes, linesRes, vehiclesRes] = await Promise.all([
          axios.get('/stops'),
          axios.get('/lines'),
          axios.get('/vehicles')
        ]);

        // Store API responses
        setApiData({
          stops: stopsRes.data,
          lines: linesRes.data,
          vehicles: vehiclesRes.data
        });

        const myNumber = linesRes.data.find(l => 
          normalizeId(l._id) === lineId
        )?.number;

        if (!myNumber) throw new Error('Line not found');

        const allVariants = linesRes.data.filter(l => l.number === myNumber);
        if (allVariants.length === 0) throw new Error('Line not found');

        setVariants(allVariants);
        
        const defaultDir = allVariants.find(l => l.direction === 'Inbound')?.direction
                         || allVariants[0].direction;
        setDirection(defaultDir);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [lineId]);

  // Effect to update stops and vehicles when direction changes
  useEffect(() => {
    if (!direction || variants.length === 0 || !apiData.stops.length) return;

    const activeLine = variants.find(l => l.direction === direction);
    if (!activeLine) {
      console.error('No line found for direction:', direction);
      return;
    }

    // Get all vehicles for this line number (both directions)
    const allLineVehicles = apiData.vehicles.filter(v => {
      const vehicleLine = apiData.lines.find(l => 
        normalizeId(l._id) === normalizeId(v.lineId)
      );
      return vehicleLine && 
             vehicleLine.number === activeLine.number;
    });

    // Filter vehicles for current direction
    const lineVehicles = allLineVehicles.filter(v => {
      const vehicleLine = apiData.lines.find(l => 
        normalizeId(l._id) === normalizeId(v.lineId)
      );
      return vehicleLine?.direction === direction;
    });

    // Get stops in order using apiData
    const lineStops = activeLine.stopIds
      .map(id => apiData.stops.find(s => s && normalizeId(s._id) === normalizeId(id)))
      .filter(Boolean);

    const getRoute = async () => {
      const thisRunDir = direction;          // remember
      if (!lineStops.length) {
        console.error('No stops found for line');
        return;
      }

      const stopPoints = lineStops.map(stop => [
        stop.location.coordinates[1],
        stop.location.coordinates[0]
      ]);

      const transportType = activeLine.type || 'Bus';
      const coords = await getRouteCoordinates(stopPoints, transportType);

      // if user switched before we finished, abort
      if (liveDirRef.current !== thisRunDir) return;
      
      // For Metro and Tram with 'Both' direction, create paths for both directions
      if (activeLine.direction === 'Both') {
        pathsRef.current['Outbound'] = coords;
        pathsRef.current['Inbound'] = [...coords].reverse(); // Reverse for inbound
      } else {
        pathsRef.current[direction] = coords;      // cache the path for this dir
      }

      if (liveDirRef.current === direction) {
        setRoutePath(coords);                    // still draw it if user is watching
      }
      
      setVehicles(lineVehicles);
      setStops(lineStops);

      // Don't reset departure count - let it be tracked per direction
    };

    getRoute();
  }, [direction, variants, apiData]);

  // Animation frame effect
  useEffect(() => {
    if (!vehicles.length) return;

    let lastUpdate = performance.now();

    const frame = (now) => {
      const dt = (now - lastUpdate) / 1000; // Convert to seconds
      lastUpdate = now;

      const newPositions = { ...vehiclePositionsRef.current };
      const vs = vehicleStateRef.current;

      Array.from(activeVehicles).forEach(vehicleId => {
        const st = vs[vehicleId];
        if (!st || st.completed) return;

        const vPath = pathsRef.current[st.direction];
        if (!vPath || vPath.length < 2) return;          // path not ready yet

        // Handle active pause
        if (now < st.pauseUntil) {
          const pos = getPositionAlongPath(vPath, st.progress, st.direction === 'Inbound');
          if (pos) newPositions[vehicleId] = pos;
          return;
        }

        // Advance progress - simplified calculation
        const routeLength = vPath.reduce((total, point, i) => {
          if (i === 0) return 0;
          const prev = vPath[i - 1];
          return total + L.latLng(prev).distanceTo(L.latLng(point));
        }, 0);

        // Speed in meters per second, convert to progress per second
        const speedMPS = st.speed * 1000 / 3600; // Convert km/h to m/s
        const progressPerSecond = speedMPS / routeLength;
        st.progress += progressPerSecond * dt;

        // Safety: never exceed 100%
        st.progress = Math.min(st.progress, 1);

        // Check if route completed
        if (st.progress >= 1) {
          st.completed = true;
          st.progress = 1;
          newPositions[vehicleId] = vPath[vPath.length - 1];

          // Remove the completed bus from active vehicles
          setActiveVehicles(prev => {
            const newSet = new Set(prev);
            newSet.delete(vehicleId);
            return newSet;
          });
          return;
        }

        const pos = getPositionAlongPath(vPath, st.progress, st.direction === 'Inbound');
        if (!pos) return;

        // Check stop proximity
        const STOP_RADIUS = 50; // meters
        stops.forEach(stop => {
          if (st.visitedStops.has(stop._id)) return;

          const stopPos = [
            stop.location.coordinates[1], // lat
            stop.location.coordinates[0]  // lng
          ];
          const dist = L.latLng(pos).distanceTo(L.latLng(stopPos));

          if (dist < STOP_RADIUS) {
            newPositions[vehicleId] = stopPos;
            st.pauseUntil = now + 500; // Pause for 1 second (halved from 2 seconds)
            st.visitedStops.add(stop._id);
            return;
          }
        });

        newPositions[vehicleId] = pos;
      });

      vehiclePositionsRef.current = newPositions;
      forceUpdate({});

      animationRef.current = requestAnimationFrame(frame);
    };

    animationRef.current = requestAnimationFrame(frame);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [vehicles, stops, activeVehicles]);

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

  // Spawn effect - launch all departures that are overdue
  useEffect(() => {
    if (!stops.length || !variants.length) return;

    const line = variants.find(l => l.direction === direction);
    const transportType = line?.type || 'Bus';
    
    // For Metro and Tram, they have direction: 'Both', so we spawn from that line
    // For Bus, we spawn from the current direction
    const linesToSpawn = (transportType === 'Metro' || transportType === 'Tram') 
      ? variants.filter(l => l.direction === 'Both') 
      : variants.filter(l => l.direction === direction);

    linesToSpawn.forEach(currentLine => {
      const currentDirection = currentLine.direction;
      
      // For 'Both' direction lines, we need to create both inbound and outbound paths
      const directionsToCreate = currentDirection === 'Both' 
        ? ['Outbound', 'Inbound']
        : [currentDirection];

      directionsToCreate.forEach(pathDirection => {
        const currentPath = pathsRef.current[pathDirection] || pathsRef.current[currentDirection];
        if (!currentPath || currentPath.length === 0) return; // path not ready yet

        // rough travel time (min) – tune avgSpeed as you like
        const avgSpeedKmH = 35;
        const tripMinutes = (pathLengthKm(currentPath) / avgSpeedKmH) * 60;

        if (!currentLine?.schedule || !currentLine.schedule.frequency) return;

        const freq = parseInt(currentLine.schedule.frequency);
        if (!freq || freq <= 0) return; // Invalid frequency

        const [fh, fm] = currentLine.schedule.firstDeparture.split(':').map(Number);
        const firstMin = fh * 60 + fm;

        // Use DevClock for schedule calculations
        const simHours = simNow.getHours();
        const simMinutes = simNow.getMinutes();
        const nowMin = simHours * 60 + simMinutes;

        // outside service hours?
        const [lh, lm] = currentLine.schedule.lastDeparture.split(':').map(Number);
        const lastMin = lh * 60 + lm;
        if (nowMin < firstMin || nowMin > lastMin) {
          // Reset departure counter for next day
          const currentDirectionSlots = Array.from(spawnedDeparturesRef.current).filter(slot => slot.startsWith(pathDirection));
          currentDirectionSlots.forEach(slot => spawnedDeparturesRef.current.delete(slot));
          directionDepartureCountRef.current[pathDirection] = 0;
          if (pathDirection === direction) {
            setDepartureCount(0);
            setLastDepartureTime(null);
          }
          // Remove vehicles for this direction that are outside service hours
          setActiveVehicles(prev => {
            const newSet = new Set();
            prev.forEach(vehicleId => {
              const state = vehicleStateRef.current[vehicleId];
              if (state && state.direction !== pathDirection) {
                newSet.add(vehicleId); // Keep vehicles from other directions
              }
            });
            return newSet;
          });
          return;
        }

        // Get current departure count for this direction
        const currentDepartureCount = directionDepartureCountRef.current[pathDirection] || 0;

        // Calculate how many buses should be running based on current time
        const expectedDepartures = Math.floor((nowMin - firstMin) / freq) + 1;

        // Check each departure slot that should have happened by now
        for (let i = currentDepartureCount; i < expectedDepartures; i++) {
          const departureSlot = `${pathDirection}-${i}`;
          const departureMinute = firstMin + (i * freq);
          
          const elapsed = nowMin - departureMinute;
          if (elapsed < 0) continue;                    // not due yet
          if (elapsed > tripMinutes) {                  // finished – mark & skip
            spawnedDeparturesRef.current.add(departureSlot);
            continue;
          }

          const progress0 = elapsed / tripMinutes;      // 0-1 starting point
          
          // If this departure time has passed and we haven't spawned it yet
          if (!spawnedDeparturesRef.current.has(departureSlot)) {
            // Create a unique vehicle for this departure
            const vehicleId = `${transportType.toLowerCase()}-${pathDirection}-${i}-${Date.now()}`;

            // Start from the correct terminus based on direction
            const startPos =
              pathDirection === 'Inbound'
                ? currentPath[currentPath.length - 1]   // last point → real inbound origin
                : currentPath[0];                       // first point → outbound origin

            vehicleStateRef.current[vehicleId] = {
              progress: progress0,
              speed: (40 + Math.random() * 20) * 50, // 400-600 km/h (50x faster)
              pauseUntil: 0,
              direction: pathDirection,
              visitedStops: new Set(),
              completed: false,
              departureTime: new Date(simNow),
              departureIndex: i,
              busNumber: transportType,
            };
            vehiclePositionsRef.current[vehicleId] = startPos;
            
            setActiveVehicles(prev => new Set([...prev, vehicleId]));
            directionDepartureCountRef.current[pathDirection] = i + 1;
            if (pathDirection === direction) {
              setDepartureCount(i + 1); // Update state for display
              setLastDepartureTime(simNow);
            }
            spawnedDeparturesRef.current.add(departureSlot); // Mark this departure as spawned
            
            console.log(`🚌 Spawned ${transportType.toLowerCase()} ${vehicleId} at ${simNow.toLocaleTimeString()} (departure #${i + 1})`);
          }
        }
      });
    });
  }, [simNow, variants, vehicles, direction, stops]);

  const getPositionAlongPath = (path, progress, isInbound) => {
    if (!path || path.length < 2) return null;
    
    // Path is already oriented correctly
    const workingPath = path;
    
    const totalDistance = workingPath.reduce((acc, point, i) => {
      if (i === 0) return 0;
      const prev = workingPath[i - 1];
      return acc + L.latLng(prev).distanceTo(L.latLng(point));
    }, 0);

    let targetDistance = totalDistance * progress;
    let coveredDistance = 0;

    for (let i = 1; i < workingPath.length; i++) {
      const prev = workingPath[i - 1];
      const current = workingPath[i];
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

    return workingPath[workingPath.length - 1];
  };

  // Create SimClock component inline to access simNow from parent scope
  const SimClock = () => {
    return (
      <div className="fixed bottom-4 right-4 bg-white p-2 rounded shadow z-[1000]">
        Sim Time: {simNow.toLocaleTimeString()}
      </div>
    );
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
          to={`/transport/${variants.find(l => l.direction === direction)?.type?.toLowerCase() || 'bus'}`}
          className="px-4 py-2 bg-white rounded-md shadow-md hover:bg-gray-50 text-gray-900 flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to Routes</span>
        </Link>
      </div>

      {/* Route info panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-md shadow-md">
        <h2 className="font-bold text-lg">
          {(variants.find(l => l.direction === direction) || variants.find(l => l.direction === 'Both'))?.longName}
        </h2>
        
        {/* Direction toggle */}
        <div className="mt-2">
          {(() => {
            const activeLine = variants.find(l => l.direction === direction) || variants.find(l => l.direction === 'Both');
            const transportType = activeLine?.type || 'Bus';
            
            // For Metro and Tram, show both directions simultaneously
            if (transportType === 'Metro' || transportType === 'Tram') {
              return (
                <div className="text-sm text-gray-600">
                  <span className="px-2 py-1 rounded bg-gray-800 text-white">
                    Both Directions Active
                  </span>
                </div>
              );
            }
            
            // For Bus, show direction toggle with updated colors
            return (
              <>
                <button
                  className={`px-2 py-1 mr-2 rounded ${
                    direction === 'Outbound' ? 'bg-orange-600 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setDirection('Outbound')}
                >
                  Outbound
                </button>
                <button
                  className={`px-2 py-1 rounded ${
                    direction === 'Inbound' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setDirection('Inbound')}
                >
                  Inbound
                </button>
              </>
            );
          })()}
        </div>

        <div className="text-sm text-gray-600">
          {(() => {
            const activeLine = variants.find(l => l.direction === direction) || variants.find(l => l.direction === 'Both');
            return (
              <>
                <p>Route: {activeLine?.number}</p>
                <p>Schedule: {activeLine?.schedule?.firstDeparture} - {activeLine?.schedule?.lastDeparture}</p>
                <p>Frequency: Every {activeLine?.schedule?.frequency} minutes</p>
              </>
            );
          })()}
          {(() => {
            const activeLine = variants.find(l => l.direction === direction) || variants.find(l => l.direction === 'Both');
            const transportType = activeLine?.type || 'Bus';
            
            // For Metro/Tram, show vehicles from both directions
            if (transportType === 'Metro' || transportType === 'Tram') {
              const allVehicles = Array.from(activeVehicles);
              const outboundVehicles = allVehicles.filter(vehicleId => {
                const state = vehicleStateRef.current[vehicleId];
                return state && state.direction === 'Outbound';
              });
              const inboundVehicles = allVehicles.filter(vehicleId => {
                const state = vehicleStateRef.current[vehicleId];
                return state && state.direction === 'Inbound';
              });
              
              return (
                <>
                  <p className="mt-2">Active Vehicles: {allVehicles.length} (Out: {outboundVehicles.length}, In: {inboundVehicles.length})</p>
                  <p>Total Departures: Out: {directionDepartureCountRef.current['Outbound'] || 0}, In: {directionDepartureCountRef.current['Inbound'] || 0}</p>
                </>
              );
            } else {
              // For Bus, show current direction only
              const directionVehicles = Array.from(activeVehicles).filter(vehicleId => {
                const state = vehicleStateRef.current[vehicleId];
                return state && state.direction === direction;
              });
              return (
                <>
                  <p className="mt-2">Active Vehicles: {directionVehicles.length}</p>
                  <p>Total Departures: {directionDepartureCountRef.current[direction] || 0}</p>
                  {directionVehicles.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p className="font-medium">Running Buses:</p>
                      {directionVehicles.map(vehicleId => {
                        const state = vehicleStateRef.current[vehicleId];
                        const displayName = state?.busNumber || 'Bus';
                        const colorClass = state?.direction === 'Inbound' ? 'text-blue-600' : 'text-green-600';
                        
                        return (
                          <div key={vehicleId} className="ml-2">
                            <span className={colorClass}>{displayName}</span> - {state ? ` ${Math.round(state.progress * 100)}%` : ' Loading...'}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            }
          })()}
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
        {(() => {
          const activeLine = variants.find(l => l.direction === direction) || variants.find(l => l.direction === 'Both');
          const transportType = activeLine?.type || 'Bus';
          
          // For Metro and Tram, show both direction paths
          if (transportType === 'Metro' || transportType === 'Tram') {
            // Show both Outbound and Inbound paths
            const outboundPath = pathsRef.current['Outbound'];
            const inboundPath = pathsRef.current['Inbound'];
            
            return (
              <>
                {outboundPath && outboundPath.length > 0 && (
                  <Polyline
                    key="outbound"
                    positions={outboundPath}
                    pathOptions={{ 
                      color: transportType === 'Metro' ? '#dc2626' : '#22c55e',
                      weight: 4,
                      opacity: 0.8
                    }}
                  />
                )}
                {inboundPath && inboundPath.length > 0 && (
                  <Polyline
                    key="inbound"
                    positions={inboundPath}
                    pathOptions={{ 
                      color: transportType === 'Metro' ? '#dc2626' : '#22c55e',
                      weight: 4,
                      opacity: 0.6
                    }}
                  />
                )}
              </>
            );
          }
          
          // For Bus, show single direction path
          if (routePath.length > 0) {
            return (
              <Polyline
                ref={polylineRef}
                positions={routePath}
                pathOptions={{ 
                  color: direction?.toLowerCase() === 'inbound' ? '#3b82f6' : '#f97316', // Blue for inbound, Orange for outbound
                  weight: 4,
                  opacity: 0.8
                }}
              />
            );
          }
          
          return null;
        })()}

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
        {Array.from(activeVehicles).filter(vehicleId => {
          const state = vehicleStateRef.current[vehicleId];
          const activeLine = variants.find(l => l.direction === direction) || variants.find(l => l.direction === 'Both');
          const transportType = activeLine?.type || 'Bus';
          
          // For Metro and Tram, show vehicles from both directions
          if (transportType === 'Metro' || transportType === 'Tram') {
            return state; // Show all vehicles regardless of direction
          }
          
          // For Bus, filter by direction
          return state && state.direction === direction;
        }).map(vehicleId => {
          const position = vehiclePositionsRef.current[vehicleId];
          const state = vehicleStateRef.current[vehicleId];
          if (!position || !state) return null;

          // Get the transport type for the correct icon
          const activeLine = variants.find(l => l.direction === direction) || variants.find(l => l.direction === 'Both');
          const transportType = activeLine?.type || 'Bus';

          return (
            <Marker
              key={vehicleId}
              position={position}
              icon={createVehicleIcon(transportType)}
            >
              <Popup>
                <div>
                  <div className="font-semibold">{state.busNumber} ({state.direction})</div>
                  <div className="text-sm">Progress: {Math.round(state.progress * 100)}%</div>
                  <div className="text-sm">Speed: {Math.round(state.speed)} km/h</div>
                  <div className="text-sm">
                    Schedule: Every {activeLine?.schedule?.frequency} minutes
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <SimClock />
    </div>
  );
};

export default RouteMap; 