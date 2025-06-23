import React from 'react';
import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useDevClock } from '../src/context/ClockContext';
import ComingSoon from '../src/components/ComingSoon';

export default function LostFoundScreen() {
  const navigation = useNavigation();
  const devTime = useDevClock();

  // Badge component for header
  const Badge = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-surface/70 border border-surface/40 rounded-lg px-3 py-2 flex-row items-center">
      {children}
    </View>
  );

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
      <View className="flex-1">
        <ComingSoon
          title="Lost & Found"
          icon="flag-variant"
          description="Report lost items or search for found items in the public transport system. Help reunite people with their belongings!"
        />
      </View>
    </SafeAreaView>
  );
} 