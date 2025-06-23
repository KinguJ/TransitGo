import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useDevClock } from '../../src/context/ClockContext';
import { transitAPI } from '../../src/utils/api';

interface Line {
  _id: string;
  name: string;
  mode: 'bus' | 'tram' | 'metro';
  color?: string;
  description?: string;
  stops?: string[];
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
      return '#2563EB'; // Blue - matching web app
    case 'tram':
      return '#059669'; // Green - matching web app
    case 'metro':
      return '#DC2626'; // Red - matching web app
    default:
      return '#6B7280'; // Gray
  }
};

export default function RouteListScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const devTime = useDevClock();

  // Badge component for header
  const Badge = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-surface/70 border border-surface/40 rounded-lg px-3 py-2 flex-row items-center">
      {children}
    </View>
  );

  useEffect(() => {
    if (mode) {
      fetchLines();
    }
  }, [mode]);

  const fetchLines = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📱 Fetching ${mode} lines from real database...`);
      
      const response = await transitAPI.getLines(mode);
      console.log('📱 Lines from API:', response.data);
      
      // Map the real data to our interface
      const mappedLines: Line[] = response.data.map((line: any) => ({
        _id: line._id,
        name: line.longName || `${mode?.toUpperCase()} Line ${line.number}`,
        mode: mode as any,
        color: getModeColor(mode || 'bus'),
        description: `${line.schedule?.firstDeparture} - ${line.schedule?.lastDeparture}`,
        stops: line.stopIds || [],
      }));

      setLines(mappedLines);
    } catch (err) {
      console.error('📱 Error fetching lines:', err);
      setError('Failed to load routes. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinePress = (lineId: string) => {
    router.push(`/routes/${lineId}` as any);
  };

  const renderLineItem = ({ item }: { item: Line }) => (
    <Pressable
      className="bg-surface rounded-card shadow-md border border-surface/60 p-4 mx-4 mb-4"
      onPress={() => handleLinePress(item._id)}
    >
      <View className="flex-row items-center">
        {/* Line Indicator */}
        <View
          className="w-14 h-14 rounded-card items-center justify-center mr-4"
          style={{
            backgroundColor: `${item.color || getModeColor(mode || 'bus')}20`,
          }}
        >
          <MaterialCommunityIcons
            name={getModeIcon(item.mode) as any}
            size={28}
            color={item.color || getModeColor(mode || 'bus')}
          />
        </View>

        {/* Line Details */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-text mb-1">
            {item.name}
          </Text>
          {item.description && (
            <Text className="text-subtext mb-2 text-base">
              {item.description}
            </Text>
          )}
          {item.stops && (
            <View className="flex-row items-center bg-surface/40 px-3 py-1 rounded-full self-start">
              <MaterialCommunityIcons
                name="map-marker-multiple"
                size={14}
                color="#9CA3AF"
              />
              <Text className="text-subtext text-sm ml-1 font-medium">
                {item.stops.length} stops
              </Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#9CA3AF"
        />
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <View className="bg-surface rounded-card shadow-md border border-surface/60 p-8 items-center min-w-[280px]">
        <View className="w-16 h-16 bg-surface/40 rounded-full items-center justify-center mb-4">
          <MaterialCommunityIcons
            name={getModeIcon(mode || 'bus') as any}
            size={32}
            color="#9CA3AF"
          />
        </View>
        <Text className="text-text font-semibold text-lg mb-2 text-center">
          No {mode} Routes Found
        </Text>
        <Text className="text-subtext text-center text-base leading-6">
          There are currently no {mode} routes available in this area.
        </Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
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
          Error Loading Routes
        </Text>
        <Text className="text-subtext text-center text-base mb-6 leading-6">
          {error || 'Something went wrong while loading routes.'}
        </Text>
        <Pressable
          className="bg-primary px-6 py-3 rounded-lg"
          onPress={fetchLines}
        >
          <Text className="text-white text-base font-semibold">Try Again</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <View className="bg-surface rounded-card shadow-md border border-surface/60 p-8 items-center min-w-[280px]">
        <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
          <ActivityIndicator size="large" color={getModeColor(mode || 'bus')} />
        </View>
        <Text className="text-text font-semibold text-lg mb-2 text-center">
          Loading Routes
        </Text>
        <Text className="text-subtext text-center text-base">
          Finding {mode} routes in your area...
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        {renderErrorState()}
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

      {/* Page Header */}
      <View className="bg-surface shadow-sm border-b border-surface/40 px-4 py-4">
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-card items-center justify-center mr-3"
            style={{
              backgroundColor: `${getModeColor(mode || 'bus')}20`,
            }}
          >
            <MaterialCommunityIcons
              name={getModeIcon(mode || 'bus') as any}
              size={24}
              color={getModeColor(mode || 'bus')}
            />
          </View>
          <View>
            <Text className="text-xl font-bold text-text capitalize">
              {mode} Routes
            </Text>
            <Text className="text-subtext">
              {lines.length} route{lines.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        </View>
      </View>

      {/* Routes List */}
      {lines.length > 0 ? (
        <FlatList
          data={lines}
          renderItem={renderLineItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
} 