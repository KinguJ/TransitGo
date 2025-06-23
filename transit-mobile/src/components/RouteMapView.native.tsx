import React, { useState, useEffect, useRef, useReducer } from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDevClock } from '../context/ClockContext';

// Platform-specific imports
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Polyline = RNMaps.Polyline;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
  } catch (error) {
    console.log('react-native-maps not available');
  }
}

// Simple routing function for mobile - uses straight lines for tram/metro
const getRouteCoordinates = (points: [number, number][], transportType: string = 'Bus'): [number, number][] => {
  // For tram and metro, use straight lines between stops
  if (transportType === 'Tram' || transportType === 'Metro') {
    return points;
  }
  
  // For buses, we could implement more complex routing in the future
  // For now, also use straight lines on mobile for simplicity
  return points;
};

// Helper function to normalize MongoDB ObjectId
const normalizeId = (id: string | any): string | null => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

interface Stop {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
}

interface Line {
  _id: string;
  name: string;
  longName: string;
  number: string;
  direction: string;
  type?: string;
  schedule: {
    firstDeparture: string;
    lastDeparture: string;
    frequency: string;
  };
  stopIds: string[];
}

interface RouteMapViewProps {
  line: {
    _id: string;
    name: string;
    stops: Stop[];
    path: [number, number][];
  };
  direction: string;
  allLines: Line[];
}

// Simple distance calculation between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const RouteMapView: React.FC<RouteMapViewProps> = ({ line, direction, allLines }) => {
  const simNow = useDevClock();
  const [activeVehicles, setActiveVehicles] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  
  const vehiclePositionsRef = useRef<{[key: string]: [number, number]}>({});
  const vehicleStateRef = useRef<{[key: string]: any}>({});
  const animationRef = useRef<number | null>(null);
  const spawnedDeparturesRef = useRef<Set<string>>(new Set());
  const directionDepartureCountRef = useRef<{[key: string]: number}>({});
  const pathsRef = useRef<{[key: string]: [number, number][]}>({}); 

  const { width } = Dimensions.get('window');
  const mapHeight = 200;

  // Default position (Elazığ coordinates)
  const defaultRegion = {
    latitude: 38.6748,
    longitude: 39.2225,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Calculate region from stops
  const getRegionFromStops = () => {
    if (!line.stops || line.stops.length === 0) return defaultRegion;

    const lats = line.stops.map(stop => stop.location.coordinates[1]);
    const lngs = line.stops.map(stop => stop.location.coordinates[0]);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const latDelta = (maxLat - minLat) * 1.5; // Add padding
    const lngDelta = (maxLng - minLng) * 1.5;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.005), // Minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  // Store path for current direction
  useEffect(() => {
    if (line.path && line.path.length > 0) {
      // Get the line data to determine transport type
      const currentLine = allLines.find(l => l.direction === direction);
      const transportType = currentLine?.type || 'Bus';
      
      // Apply routing logic based on transport type
      const routedPath = getRouteCoordinates(line.path, transportType);
      pathsRef.current[direction] = routedPath;
    }
  }, [line.path, direction, allLines]);

  // Initialize direction departure count
  useEffect(() => {
    if (!directionDepartureCountRef.current[direction]) {
      directionDepartureCountRef.current[direction] = 0;
    }
  }, [direction]);

  // Animation frame effect - same logic as web version
  useEffect(() => {
    if (activeVehicles.size === 0) return;

    let lastUpdate = performance.now();

    const frame = (now: number) => {
      const dt = (now - lastUpdate) / 1000; // Convert to seconds
      lastUpdate = now;

      const newPositions = { ...vehiclePositionsRef.current };
      const vs = vehicleStateRef.current;

      Array.from(activeVehicles).forEach(vehicleId => {
        const st = vs[vehicleId];
        if (!st || st.completed) return;

        const vPath = pathsRef.current[st.direction];
        if (!vPath || vPath.length < 2) return;

        // Handle active pause
        if (now < st.pauseUntil) {
          const pos = getPositionAlongPath(vPath, st.progress);
          if (pos) newPositions[vehicleId] = pos;
          return;
        }

        // Advance progress - simplified calculation
        const routeLength = vPath.reduce((total, point, i) => {
          if (i === 0) return 0;
          const prev = vPath[i - 1];
          return total + calculateDistance(prev[0], prev[1], point[0], point[1]);
        }, 0);

        // Speed in meters per second, convert to progress per second
        const speedMPS = st.speed * 1000 / 3600; // Convert km/h to m/s
        const progressPerSecond = speedMPS / routeLength;
        st.progress += progressPerSecond * dt;

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

        const pos = getPositionAlongPath(vPath, st.progress);
        if (!pos) return;

        // Check stop proximity
        const STOP_RADIUS = 50; // meters
        line.stops.forEach(stop => {
          if (st.visitedStops.has(stop._id)) return;

          const stopPos: [number, number] = [
            stop.location.coordinates[1], // lat
            stop.location.coordinates[0]  // lng
          ];
          const dist = calculateDistance(pos[0], pos[1], stopPos[0], stopPos[1]);

          if (dist < STOP_RADIUS) {
            newPositions[vehicleId] = stopPos;
            st.pauseUntil = now + 500; // Pause for 0.5 seconds
            st.visitedStops.add(stop._id);
            return;
          }
        });

        newPositions[vehicleId] = pos;
      });

      vehiclePositionsRef.current = newPositions;
      forceUpdate();

      animationRef.current = requestAnimationFrame(frame);
    };

    animationRef.current = requestAnimationFrame(frame);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeVehicles, line.stops]);

  // Spawn effect - same logic as web version
  useEffect(() => {
    if (!line.stops.length || !allLines.length) return;

    const currentPath = pathsRef.current[direction];
    if (!currentPath || currentPath.length === 0) return;

    const currentLine = allLines.find(l => l.direction === direction);
    if (!currentLine?.schedule || !currentLine.schedule.frequency) return;

    const freq = parseInt(currentLine.schedule.frequency);
    if (!freq || freq <= 0) return;

    const [fh, fm] = currentLine.schedule.firstDeparture.split(':').map(Number);
    const firstMin = fh * 60 + fm;

    // Use DevClock for schedule calculations
    const simHours = simNow.getHours();
    const simMinutes = simNow.getMinutes();
    const nowMin = simHours * 60 + simMinutes;

    // Outside service hours?
    const [lh, lm] = currentLine.schedule.lastDeparture.split(':').map(Number);
    const lastMin = lh * 60 + lm;
    if (nowMin < firstMin || nowMin > lastMin) {
      // Reset departure counter for next day
      const currentDirectionSlots = Array.from(spawnedDeparturesRef.current)
        .filter(slot => slot.startsWith(direction));
      currentDirectionSlots.forEach(slot => spawnedDeparturesRef.current.delete(slot));
      directionDepartureCountRef.current[direction] = 0;
      
      // Remove vehicles for this direction that are outside service hours
      setActiveVehicles(prev => {
        const newSet = new Set<string>();
        prev.forEach(vehicleId => {
          const state = vehicleStateRef.current[vehicleId];
          if (state && state.direction !== direction) {
            newSet.add(vehicleId);
          }
        });
        return newSet;
      });
      return;
    }

    // Get current departure count for this direction
    const currentDepartureCount = directionDepartureCountRef.current[direction] || 0;

    // Calculate how many buses should be running based on current time
    const expectedDepartures = Math.floor((nowMin - firstMin) / freq) + 1;

    const transportType = currentLine?.type || 'Bus';
    
    // For Metro and Tram, spawn vehicles for both directions
    const directionsToSpawn = (transportType === 'Metro' || transportType === 'Tram') 
      ? ['Outbound', 'Inbound'] 
      : [direction];

    directionsToSpawn.forEach(currentDirection => {
      const directionLine = allLines.find(l => l.direction === currentDirection);
      if (!directionLine?.schedule) return;

      const currentDepartureCount = directionDepartureCountRef.current[currentDirection] || 0;
      const expectedDepartures = Math.floor((nowMin - firstMin) / freq) + 1;

      // Check each departure slot that should have happened by now
      for (let i = currentDepartureCount; i < expectedDepartures; i++) {
        const departureSlot = `${currentDirection}-${i}`;
        const departureMinute = firstMin + (i * freq);
        
        // If this departure time has passed and we haven't spawned it yet
        if (nowMin >= departureMinute && !spawnedDeparturesRef.current.has(departureSlot)) {
          // Create a unique vehicle for this departure
          const vehicleId = `${transportType.toLowerCase()}-${currentDirection}-${i}-${Date.now()}`;

          // Start from first stop (index 0) regardless of direction
          const startPos: [number, number] = [
            line.stops[0].location.coordinates[1], // lat
            line.stops[0].location.coordinates[0]  // lng
          ];

          vehicleStateRef.current[vehicleId] = {
            progress: 0,
            speed: (40 + Math.random() * 20) * 50, // 400-600 km/h (50x faster)
            pauseUntil: 0,
            direction: currentDirection,
            visitedStops: new Set(),
            completed: false,
            departureTime: new Date(simNow),
            departureIndex: i,
            busNumber: directionLine.number || transportType,
          };
          vehiclePositionsRef.current[vehicleId] = startPos;
          
          setActiveVehicles(prev => new Set([...prev, vehicleId]));
          directionDepartureCountRef.current[currentDirection] = i + 1;
          spawnedDeparturesRef.current.add(departureSlot);
          
          console.log(`🚌 Spawned mobile ${transportType.toLowerCase()} ${vehicleId} at ${simNow.toLocaleTimeString()}`);
        }
      }
    });
  }, [simNow, allLines, direction, line.stops]);

  // Get position along path - same logic as web version
  const getPositionAlongPath = (path: [number, number][], progress: number): [number, number] | null => {
    if (!path || path.length < 2) return null;
    
    const totalDistance = path.reduce((acc, point, i) => {
      if (i === 0) return 0;
      const prev = path[i - 1];
      return acc + calculateDistance(prev[0], prev[1], point[0], point[1]);
    }, 0);

    let targetDistance = totalDistance * progress;
    let coveredDistance = 0;

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const segmentDistance = calculateDistance(prev[0], prev[1], current[0], current[1]);

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

  // Get active vehicles for current direction
  const getActiveVehiclesForDirection = () => {
    return Array.from(activeVehicles).filter(vehicleId => {
      const state = vehicleStateRef.current[vehicleId];
      return state && state.direction === direction;
    });
  };

  // Get vehicle count to display
  const getVehicleCountForDisplay = () => {
    const currentLine = allLines.find(l => l.direction === direction);
    const transportType = currentLine?.type || 'Bus';
    
    // For Metro and Tram, show all active vehicles
    if (transportType === 'Metro' || transportType === 'Tram') {
      return activeVehicles.size;
    }
    
    // For Bus, show only vehicles for current direction
    return getActiveVehiclesForDirection().length;
  };

  // Fallback for when react-native-maps is not available
  if (!MapView) {
    return (
      <View style={{ 
        height: mapHeight, 
        width: '100%', 
        borderRadius: 12, 
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
      }}>
        <MaterialCommunityIcons
          name="map"
          size={48}
          color="#9CA3AF"
        />
        <Text style={{ color: '#6B7280', marginTop: 8, fontSize: 16, fontWeight: '600' }}>
          Route Map
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 4 }}>
          {line.name}
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 2 }}>
          {line.stops.length} stops • {getVehicleCountForDisplay()} active vehicles
        </Text>
        
        {/* Vehicle Count Overlay */}
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0,0,0,0.7)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
          🚌 {getVehicleCountForDisplay()} active
        </Text>
        </View>
      </View>
    );
  }

  // Native platforms - real map
  return (
    <View style={{ height: mapHeight, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={getRegionFromStops()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Route Path */}
        {line.path && line.path.length > 1 && (
          <Polyline
            coordinates={line.path.map(point => ({
              latitude: point[0],
              longitude: point[1]
            }))}
            strokeColor={(() => {
              const currentLine = allLines.find(l => l.direction === direction);
              const transportType = currentLine?.type || 'Bus';
              
              if (transportType === 'Metro') return '#dc2626'; // Red for Metro
              if (transportType === 'Tram') return '#22c55e';  // Green for Tram
              
              // Bus colors based on direction
              return direction === 'Inbound' ? '#3b82f6' : '#f97316'; // Blue for inbound, Orange for outbound
            })()}
            strokeWidth={4}
            strokePattern={[1]}
          />
        )}

        {/* Stops */}
        {line.stops.map((stop, index) => (
          <Marker
            key={stop._id}
            coordinate={{
              latitude: stop.location.coordinates[1],
              longitude: stop.location.coordinates[0]
            }}
            title={stop.name}
            description={`Stop ${index + 1}`}
          >
            <View style={{
              backgroundColor: '#4F46E5',
              borderRadius: 12,
              padding: 4,
              borderWidth: 2,
              borderColor: 'white',
            }}>
              <MaterialCommunityIcons name="bus-stop" size={16} color="white" />
            </View>
          </Marker>
        ))}

        {/* Active Vehicles */}
        {(() => {
          const currentLine = allLines.find(l => l.direction === direction);
          const transportType = currentLine?.type || 'Bus';
          
          // For Metro and Tram, show vehicles from both directions
          const vehiclesToShow = (transportType === 'Metro' || transportType === 'Tram')
            ? Array.from(activeVehicles)
            : getActiveVehiclesForDirection();
            
          return vehiclesToShow;
        })().map(vehicleId => {
          const position = vehiclePositionsRef.current[vehicleId];
          const state = vehicleStateRef.current[vehicleId];
          if (!position || !state) return null;

          return (
            <Marker
              key={vehicleId}
              coordinate={{
                latitude: position[0],
                longitude: position[1]
              }}
              title={`Bus ${state.busNumber}`}
              description={`Progress: ${Math.round(state.progress * 100)}% • ${Math.round(state.speed)} km/h`}
            >
              <View style={{
                backgroundColor: (() => {
                  const state = vehicleStateRef.current[vehicleId];
                  if (!state) return '#f97316'; // Default orange
                  
                  // Get the transport type from the line data
                  const vehicleLine = allLines.find(l => l.direction === state.direction);
                  const transportType = vehicleLine?.type || 'Bus';
                  
                  if (transportType === 'Metro') return '#dc2626'; // Red for Metro
                  if (transportType === 'Tram') return '#22c55e';  // Green for Tram
                  
                  // Bus colors based on direction
                  return state.direction === 'Inbound' ? '#3b82f6' : '#f97316'; // Blue for inbound, Orange for outbound
                })(),
                borderRadius: 16,
                padding: 6,
                borderWidth: 2,
                borderColor: 'white',
              }}>
                <MaterialCommunityIcons 
                  name={(() => {
                    const state = vehicleStateRef.current[vehicleId];
                    if (!state) return 'bus';
                    
                    // Get the transport type from the line data
                    const vehicleLine = allLines.find(l => l.direction === state.direction);
                    const transportType = vehicleLine?.type || 'Bus';
                    
                    if (transportType === 'Metro') return 'subway';
                    if (transportType === 'Tram') return 'tram';
                    return 'bus';
                  })()} 
                  size={20} 
                  color="white" 
                />
              </View>
            </Marker>
          );
        })}
      </MapView>
      
      {/* Vehicle Count Overlay */}
      <View style={{
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
      }}>
        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
          🚌 {getVehicleCountForDisplay()} active
        </Text>
      </View>
    </View>
  );
};

export default RouteMapView;