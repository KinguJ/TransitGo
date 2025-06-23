import React from 'react';
import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useDevClock } from '../../src/context/ClockContext';

const transportModes = [
  {
    id: 'bus',
    title: 'Bus',
    icon: 'bus',
    color: '#2563EB', // Blue - matching web app
    description: 'City buses and express routes',
  },
  {
    id: 'tram',
    title: 'Tram',
    icon: 'train',
    color: '#059669', // Green - matching web app
    description: 'Light rail and tram lines',
  },
  {
    id: 'metro',
    title: 'Metro',
    icon: 'subway',
    color: '#DC2626', // Red - matching web app
    description: 'Underground metro system',
  },
];

export default function RoutesIndexScreen() {
  const navigation = useNavigation();
  const devTime = useDevClock();

  // Badge component for header
  const Badge = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-surface/70 border border-surface/40 rounded-lg px-3 py-2 flex-row items-center">
      {children}
    </View>
  );

  const handleModeSelect = (mode: string) => {
    router.push(`/routes/list?mode=${mode}` as any);
  };

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

      {/* Content */}
      <View className="flex-1 px-4 py-6">
        {/* Header Section */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-text mb-3">
            Choose Transport
          </Text>
          <Text className="text-subtext text-lg leading-6">
            Select the type of public transport you want to explore
          </Text>
        </View>

        {/* Transport Mode Cards */}
        <View className="space-y-4">
          {transportModes.map((mode) => (
            <Pressable
              key={mode.id}
              className="bg-surface rounded-card shadow-md border border-surface/60 p-6"
              onPress={() => handleModeSelect(mode.id)}
            >
              <View className="flex-row items-center">
                {/* Icon Container */}
                <View
                  className="w-16 h-16 rounded-card items-center justify-center mr-4"
                  style={{
                    backgroundColor: `${mode.color}20`, // 20% opacity
                  }}
                >
                  <MaterialCommunityIcons
                    name={mode.icon as any}
                    size={32}
                    color={mode.color}
                  />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <Text className="text-xl font-bold text-text mb-1">
                    {mode.title}
                  </Text>
                  <Text className="text-subtext text-base leading-5">
                    {mode.description}
                  </Text>
                </View>

                {/* Arrow */}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-subtext text-center text-base">
            Real-time schedules and route information
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
} 