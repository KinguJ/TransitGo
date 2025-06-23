import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { transitAPI } from '../utils/api';

interface Station {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  distance?: number;
}

// Helper function to calculate distance using Haversine formula
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    // Fallback to Malatya coordinates
    return {
      latitude: 38.3552,
      longitude: 38.3095,
    };
  }
};

const NearestStationsHorizontal: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyStations();
  }, []);

  const fetchNearbyStations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current location
      const location = await getCurrentLocation();

      console.log('📱 Fetching nearby stations for location:', location);
      
      // Get real data from API
      const response = await transitAPI.getNearbyStops(
        location.latitude,
        location.longitude,
        4
      );
      console.log('📱 Nearby stations from API:', response.data);
      
      // Add distance calculation to each station
      const raw = response.data || [];
      const withDistance = raw.map((s: Station) => ({
        ...s,
        distance: haversineKm(
          location.latitude,
          location.longitude,
          s.location.coordinates[1], // lat
          s.location.coordinates[0]  // lon
        ),
      }));

      setStations(withDistance);
    } catch (err) {
      console.error('Error fetching nearby stations:', err);
      setError('Failed to load nearby stations');
    } finally {
      setLoading(false);
    }
  };

  const handleStationPress = (stationId: string) => {
    router.push(`/station/${stationId}` as any);
  };

  const renderStation = ({ item }: { item: Station }) => (
    <Pressable
      className="bg-surface rounded-card shadow-md border border-surface/60 p-4 mb-3 mx-4"
      onPress={() => handleStationPress(item._id)}
    >
      <View className="flex-row items-center">
        {/* Station Icon */}
        <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mr-4">
          <MaterialCommunityIcons
            name="map-marker"
            size={28}
            color="#4F46E5"
          />
        </View>

        {/* Station Info */}
        <View className="flex-1">
          {/* Station Name */}
          <Text
            className="text-text font-semibold text-base leading-5 mb-2"
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {/* Distance - More Prominent */}
          {item.distance !== undefined && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
                <MaterialCommunityIcons
                  name="walk"
                  size={16}
                  color="#4F46E5"
                />
                <Text className="text-primary text-sm ml-2 font-semibold">
                  {item.distance.toFixed(1)} km away
                </Text>
              </View>
              
              {/* Walking Time Estimate */}
              <Text className="text-subtext text-xs">
                ~{Math.ceil(item.distance * 12)} min walk
              </Text>
            </View>
          )}
        </View>

        {/* Arrow Icon */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#9CA3AF"
        />
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-12">
      <View className="bg-surface rounded-card shadow-md border border-surface/60 p-8 items-center mx-4 min-w-[280px]">
        <View className="w-16 h-16 bg-surface/40 rounded-full items-center justify-center mb-4">
          <MaterialCommunityIcons
            name="map-marker-off"
            size={32}
            color="#9CA3AF"
          />
        </View>
        <Text className="text-text font-semibold text-lg mb-2 text-center">
          No Nearby Stations
        </Text>
        <Text className="text-subtext text-center text-base leading-6">
          Unable to find stations in your area. Try enabling location services or check your connection.
        </Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View className="flex-1 justify-center items-center py-12">
      <View className="bg-surface rounded-card shadow-md border border-red-500/20 p-8 items-center mx-4 min-w-[280px]">
        <View className="w-16 h-16 bg-red-500/10 rounded-full items-center justify-center mb-4">
          <MaterialCommunityIcons
            name="alert-circle"
            size={32}
            color="#EF4444"
          />
        </View>
        <Text className="text-text font-semibold text-lg mb-2 text-center">
          Error Loading Stations
        </Text>
        <Text className="text-subtext text-center text-base mb-6 leading-6">
          {error || 'Something went wrong while loading nearby stations.'}
        </Text>
        <Pressable
          className="bg-primary px-6 py-3 rounded-lg"
          onPress={fetchNearbyStations}
        >
          <Text className="text-white text-base font-semibold">Try Again</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center py-12">
      <View className="bg-surface rounded-card shadow-md border border-surface/60 p-8 items-center mx-4 min-w-[280px]">
        <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
        <Text className="text-text font-semibold text-lg mb-2 text-center">
          Finding Stations
        </Text>
        <Text className="text-subtext text-center text-base">
          Locating nearby transit stations...
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  if (stations.length === 0) {
    return renderEmptyState();
  }

  return (
    <View className="py-2">
      <FlatList
        data={stations}
        renderItem={renderStation}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ 
          paddingBottom: 8
        }}
      />
    </View>
  );
};

export default NearestStationsHorizontal; 