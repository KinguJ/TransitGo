import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useDevClock } from '../../src/context/ClockContext';
import { transitAPI } from '../../src/utils/api';
    import RouteMapView from '../../src/components/RouteMapView.web';



interface Line {
  _id: string;
  name: string;
  mode: 'bus' | 'tram' | 'metro';
  color?: string;
  description?: string;
  stops: Stop[];
  path?: [number, number][];
}

interface Stop {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
}

interface Departure {
  _id: string;
  lineId: string;
  lineName: string;
  destination: string;
  departureTime: string;
  estimatedArrival: string;
  delay?: number;
  status: 'onTime' | 'delayed' | 'cancelled';
}

const getModeIcon = (mode: string) => {
  switch (mode) {
    case 'bus':
      return 'bus';
    case 'tram':
      return 'train';
    case 'metro':
      return 'subway';
    default:
      return 'bus';
  }
};

const getModeColor = (mode: string) => {
  switch (mode) {
    case 'bus':
      return '#DC2626'; // Red
    case 'tram':
      return '#059669'; // Green
    case 'metro':
      return '#2563EB'; // Blue
    default:
      return '#6B7280'; // Gray
  }
};

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [line, setLine] = useState<Line | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'Inbound' | 'Outbound'>('Inbound');
  const [allLines, setAllLines] = useState<any[]>([]);
  const navigation = useNavigation();
  const devTime = useDevClock();

  // Badge component for header
  const Badge = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-surface/70 border border-surface/40 rounded-lg px-3 py-2 flex-row items-center">
      {children}
    </View>
  );

  useEffect(() => {
    if (id) {
      fetchRouteData();
    }
  }, [id]);

  useEffect(() => {
    if (allLines.length > 0) {
      updateLineForDirection();
    }
  }, [direction, allLines]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📱 Fetching route data for line ${id}...`);
      
      // Get all lines to find variants of this line number
      const [allLinesRes, stopsRes] = await Promise.all([
        transitAPI.get('/lines'),
        transitAPI.get('/stops')
      ]);

      // Find the specific line first
      const specificLine = allLinesRes.data.find((l: any) => l._id === id);
      if (!specificLine) {
        throw new Error('Line not found');
      }

      // Find all lines with the same number (both directions)
      const lineVariants = allLinesRes.data.filter((l: any) => 
        l.number === specificLine.number
      );

      setAllLines(lineVariants);
      
      // Set initial direction based on the clicked line or default to Inbound
      const initialDirection = specificLine.direction || 'Inbound';
      setDirection(initialDirection);

      // Find the line for the current direction
      const currentLine = lineVariants.find((l: any) => l.direction === initialDirection) || specificLine;
      
      // Get stops for this line in order
      const lineStops = currentLine.stopIds
        .map((stopId: string) => stopsRes.data.find((s: any) => s._id === stopId))
        .filter(Boolean);

      // Map to our interface
      const mappedLine: Line = {
        _id: currentLine._id,
        name: currentLine.longName || `Line ${currentLine.number}`,
        mode: currentLine.type?.toLowerCase() || 'bus',
        color: getModeColor(currentLine.type?.toLowerCase() || 'bus'),
        description: currentLine.schedule 
          ? `${currentLine.schedule.firstDeparture} - ${currentLine.schedule.lastDeparture}`
          : 'Schedule unavailable',
        stops: lineStops || [],
        path: lineStops?.map((stop: Stop) => [
          stop.location.coordinates[1], // lat
          stop.location.coordinates[0]  // lng
        ]) || [],
      };

      // Mock departures for now (real-time departures would require complex simulation)
      const mockDepartures: Departure[] = [
        {
          _id: '1',
          lineId: currentLine._id,
          lineName: mappedLine.name,
          destination: mappedLine.stops[mappedLine.stops.length - 1]?.name || 'Terminal',
          departureTime: '14:30',
          estimatedArrival: '14:45',
          status: 'onTime',
        },
        {
          _id: '2',
          lineId: currentLine._id,
          lineName: mappedLine.name,
          destination: mappedLine.stops[0]?.name || 'Origin',
          departureTime: '14:35',
          estimatedArrival: '14:52',
          delay: 2,
          status: 'delayed',
        },
        {
          _id: '3',
          lineId: currentLine._id,
          lineName: mappedLine.name,
          destination: mappedLine.stops[mappedLine.stops.length - 1]?.name || 'Terminal',
          departureTime: '14:45',
          estimatedArrival: '15:00',
          status: 'onTime',
        },
      ];

      setLine(mappedLine);
      setDepartures(mockDepartures);
    } catch (err) {
      console.error('📱 Error fetching route data:', err);
      setError('Failed to load route information. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const updateLineForDirection = async () => {
    if (!allLines.length) return;

    try {
      // Find the line for the selected direction
      const currentLine = allLines.find((l: any) => l.direction === direction);
      if (!currentLine) return;

      // Get stops for this direction
      const stopsRes = await transitAPI.get('/stops');
      const lineStops = currentLine.stopIds
        .map((stopId: string) => stopsRes.data.find((s: any) => s._id === stopId))
        .filter(Boolean);

      // Update the line data
      const mappedLine: Line = {
        _id: currentLine._id,
        name: currentLine.longName || `Line ${currentLine.number}`,
        mode: currentLine.type?.toLowerCase() || 'bus',
        color: getModeColor(currentLine.type?.toLowerCase() || 'bus'),
        description: currentLine.schedule 
          ? `${currentLine.schedule.firstDeparture} - ${currentLine.schedule.lastDeparture}`
          : 'Schedule unavailable',
        stops: lineStops || [],
        path: lineStops?.map((stop: Stop) => [
          stop.location.coordinates[1], // lat
          stop.location.coordinates[0]  // lng
        ]) || [],
      };

      setLine(mappedLine);
    } catch (err) {
      console.error('📱 Error updating line for direction:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'onTime':
        return '#059669'; // Green
      case 'delayed':
        return '#D97706'; // Orange
      case 'cancelled':
        return '#DC2626'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'onTime':
        return 'check-circle';
      case 'delayed':
        return 'clock-alert';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderDeparture = (departure: Departure, index: number) => (
    <View
      key={departure._id}
      className="bg-surface rounded-card p-4 mb-3 shadow-md border border-surface/60"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <MaterialCommunityIcons
              name={getModeIcon(line?.mode || 'bus') as any}
              size={16}
              color={line?.color || getModeColor(line?.mode || 'bus')}
            />
            <Text className="text-sm font-medium text-subtext ml-2">
              {departure.lineName}
            </Text>
          </View>
          <Text className="text-lg font-bold text-text mb-1">
            {departure.destination}
          </Text>
          <Text className="text-subtext">
            Departure: {departure.departureTime}
          </Text>
          <Text className="text-subtext">
            Arrival: {departure.estimatedArrival}
            {departure.delay && (
              <Text className="text-orange-400"> (+{departure.delay}min)</Text>
            )}
          </Text>
        </View>

        {/* Status */}
        <View className="items-center">
          <MaterialCommunityIcons
            name={getStatusIcon(departure.status) as any}
            size={24}
            color={getStatusColor(departure.status)}
          />
          <Text
            className="text-xs font-medium mt-1 capitalize"
            style={{ color: getStatusColor(departure.status) }}
          >
            {departure.status === 'onTime' ? 'On Time' : departure.status}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 justify-center items-center">
          <View className="bg-surface rounded-card shadow-md border border-surface/60 p-8 items-center min-w-[280px]">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
            <Text className="text-text font-semibold text-lg mb-2 text-center">
              Loading Route
            </Text>
            <Text className="text-subtext text-center text-base">
              Getting route details...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !line) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-surface rounded-card shadow-md border border-red-500/20 p-8 items-center min-w-[280px]">
            <View className="w-16 h-16 bg-red-500/10 rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons
                name="alert-circle"
                size={32}
                color="#EF4444"
              />
            </View>
            <Text className="text-text font-semibold text-lg mb-2 text-center">
              Error Loading Route
            </Text>
            <Text className="text-subtext text-center text-base mb-6 leading-6">
              {error || 'Route not found'}
            </Text>
            <Pressable
              className="bg-primary px-6 py-3 rounded-lg"
              onPress={fetchRouteData}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Unified Header - Same as Home */}
      <View className="bg-bg shadow-sm border-b border-surface/40">
        <View className="px-4 py-4">
          <View className="flex-row justify-between items-center">
            {/* Left: Hamburger Menu + Logo */}
            <View className="flex-row items-center">
              <Pressable
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                className="mr-4 p-2 -ml-2"
              >
                <MaterialCommunityIcons name="menu" size={24} color="#E5E7EB" />
              </Pressable>
              <Text className="text-xl font-bold text-primary">TransitGo</Text>
            </View>
            
            {/* Right: Location & Time */}
            <View className="flex-row items-center">
              <Badge>
                <MaterialCommunityIcons name="map-marker" size={16} color="#9CA3AF" />
                <Text className="ml-1 text-subtext font-medium text-sm">Elazığ</Text>
              </Badge>

              <View className="w-2" />

              <Badge>
                <View className="mr-2">
                  <Text className="text-xs text-subtext uppercase tracking-wide">Sim Time</Text>
                  <Text className="text-sm font-semibold text-text">
                    {devTime.toLocaleTimeString()}
                  </Text>
                </View>
              </Badge>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Route Header */}
        <View className="bg-surface border-b border-surface/40 px-4 py-4">
          <View className="flex-row items-center mb-4">
            <View
              className="w-14 h-14 rounded-card items-center justify-center mr-4"
              style={{
                backgroundColor: `${line.color || getModeColor(line.mode)}20`,
              }}
            >
              <MaterialCommunityIcons
                name={getModeIcon(line.mode) as any}
                size={28}
                color={line.color || getModeColor(line.mode)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-text">
                {line.name}
              </Text>
              {line.description && (
                <Text className="text-subtext text-base">
                  {line.description}
                  {(() => {
                    const currentLine = allLines.find((l: any) => l.direction === direction);
                    return currentLine?.schedule?.frequency && (
                      <Text className="text-primary font-medium">
                        {' '}• Every {currentLine.schedule.frequency} min
                      </Text>
                    );
                  })()}
                </Text>
              )}
              <View className="flex-row items-center bg-surface/40 px-3 py-1 rounded-full self-start mt-1">
                <MaterialCommunityIcons
                  name="map-marker-multiple"
                  size={14}
                  color="#9CA3AF"
                />
                <Text className="text-subtext text-sm ml-1 font-medium">
                  {line.stops.length} stops
                </Text>
              </View>
            </View>
          </View>

          {/* Direction Toggle - Only show if both directions exist */}
          {allLines.length > 1 && (
            <View className="flex-row bg-surface/40 rounded-lg p-1">
              {allLines.map((lineVariant: any) => (
                <Pressable
                  key={lineVariant.direction}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    direction === lineVariant.direction
                      ? 'bg-primary shadow-sm' 
                      : 'bg-transparent'
                  }`}
                  onPress={() => setDirection(lineVariant.direction)}
                >
                  <Text className={`text-center font-medium ${
                    direction === lineVariant.direction
                      ? 'text-white' 
                      : 'text-subtext'
                  }`}>
                    {lineVariant.direction}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Map Section */}
        <View className="p-4">
          <Text className="text-lg font-bold text-text mb-3">
            Route Map
          </Text>
          <RouteMapView 
            line={{
              ...line,
              path: line.path || []
            }} 
            direction={direction} 
            allLines={allLines} 
          />
        </View>

        {/* Stops Section */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-bold text-text mb-3">
            Stops ({line.stops.length})
          </Text>
          <View className="bg-surface rounded-card border border-surface/60">
            {line.stops.map((stop, index) => (
              <View key={stop._id}>
                <View className="flex-row items-center p-4">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: `${line.color || getModeColor(line.mode)}20`,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: line.color || getModeColor(line.mode),
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="text-text font-medium flex-1">
                    {stop.name}
                  </Text>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={16}
                    color="#9CA3AF"
                  />
                </View>
                {index < line.stops.length - 1 && (
                  <View className="h-px bg-surface/40 ml-14 mr-4" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Departures Section */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-text">
              Next Departures
            </Text>
            <Pressable onPress={fetchRouteData}>
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color="#4F46E5"
              />
            </Pressable>
          </View>
          
          {departures.length > 0 ? (
            departures.map((departure, index) => renderDeparture(departure, index))
          ) : (
            <View className="bg-surface rounded-card p-6 items-center border border-surface/60">
              <MaterialCommunityIcons
                name="clock-outline"
                size={48}
                color="#9CA3AF"
              />
              <Text className="text-text font-medium mt-2">
                No departures scheduled
              </Text>
              <Text className="text-subtext text-center mt-1">
                Check back later for updated schedules
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 