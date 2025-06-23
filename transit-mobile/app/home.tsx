import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { transitAPI } from '../src/utils/api';
import NearestStationsHorizontal from '../src/components/NearestStationsHorizontal';
import DevClockOverlay from '../src/components/DevClockOverlay';
import { useDevClock } from '../src/context/ClockContext';
import { useAuth } from '../src/context/AuthContext';

// Types
interface TransitCard {
  _id: string;
  name: string;
  cardNumber: string;
  balance: number;
  expiryDate: string;
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState<TransitCard[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const devTime = useDevClock();
  const navigation = useNavigation();
  const { user } = useAuth();

  // Badge component for header
  const Badge = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-surface/70 border border-surface/40 rounded-lg px-3 py-2 flex-row items-center">
      {children}
    </View>
  );

  useEffect(() => {
    loadData();
  }, [user]); // Re-load when user changes

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user's transit cards (only if authenticated)
      if (user) {
        await loadCards();
      } else {
        setCards([]); // Clear cards if not authenticated
      }

      // Load vehicles for everyone
      await loadVehicles();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      console.log('📱 Loading transit cards...');
      const response = await transitAPI.getCards();
      console.log('📱 Cards loaded:', response.data);
      setCards(response.data || []);
    } catch (error) {
      console.error('📱 Error loading cards:', error);
      setCards([]); // Empty array if loading fails
    }
  };

  const loadVehicles = async () => {
    try {
      console.log('📱 Loading vehicles...');
      const response = await transitAPI.getVehicles();
      console.log('📱 Vehicles loaded:', response.data);
      // Take first 4 vehicles for the preview
      setVehicles(response.data?.slice(0, 4) || []);
    } catch (error) {
      console.error('📱 Error loading vehicles:', error);
      setVehicles([]);
    }
  };

  const handleSearch = () => {
    console.log('Search query:', searchQuery);
    // TODO: Implement real search functionality
  };

  const formatCardNumber = (cardNumber: string) => {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const featureItems = [
    { id: 'cards', title: 'My Cards', icon: 'credit-card', action: 'profile' },
    { id: 'balance', title: 'Balance Ops', icon: 'cash-sync', action: 'coming-soon' },
    { id: 'departures', title: 'Departure & Vehicles', icon: 'clock', action: 'routes' },
    { id: 'planner', title: 'Trip Planner', icon: 'routes', action: 'coming-soon' },
    { id: 'favorites', title: 'Favorites', icon: 'star', action: 'coming-soon' },
    { id: 'coming1', title: 'Coming Soon', icon: 'dots-horizontal', action: 'coming-soon' },
  ];

  const renderCard = ({ item }: { item: TransitCard }) => (
    <Pressable
      className="bg-surface rounded-card shadow-md border border-surface/60 p-4 mr-4 w-64 mb-6"
      onPress={() => router.push('/profile' as any)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-sm text-subtext mb-1">{item.name}</Text>
          <Text className="text-text font-mono text-sm">
            {formatCardNumber(item.cardNumber)}
          </Text>
        </View>
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
          <MaterialCommunityIcons name="credit-card" size={20} color="#2563EB" />
        </View>
      </View>
      
      <View className="border-t border-surface/40 pt-3 mt-3 mb-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-subtext text-sm">Balance</Text>
          <Text className="text-xl font-bold text-text">₺{item.balance.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-subtext text-xs">Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
          <View className="bg-success/20 px-2 py-1 rounded">
            <Text className="text-success text-xs font-medium">Active</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const getFeatureColor = (id: string) => ({
    departures: "#4F46E5", // primary
    cards:      "#16A34A", // success
    balance:    "#DC2626", // danger
    planner:    "#F59E0B", // warning
    favorites:  "#EAB308", // amber
  }[id] || "#374151");      // slate

  const renderFeatureItem = ({ item, index }: { item: any; index: number }) => (
    <Pressable
      className="bg-surface rounded-card shadow-md border border-surface/60 p-4 transition-all duration-200 hover:shadow-lg"
      onPress={() => {
        switch (item.action) {
          case 'routes':
            router.push('/routes' as any);
            break;
          case 'profile':
            router.push('/profile' as any);
            break;
          case 'coming-soon':
          default:
            Alert.alert('Coming Soon', 'This feature will be available soon!');
            break;
        }
      }}
    >
      <View 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: getFeatureColor(item.id) }}
      >
        <MaterialCommunityIcons name={item.icon} size={24} color="white" />
      </View>
      <Text className="font-semibold text-text text-base mb-1">
        {item.title}
      </Text>
      <Text className="text-sm text-subtext">
        {item.id === 'departures' ? 'Real-time updates' :
         item.id === 'cards' ? 'Manage your cards' :
         item.id === 'balance' ? 'Top up & history' :
         item.id === 'planner' ? 'Plan your trip' :
         item.id === 'favorites' ? 'Saved locations' :
         'More features'}
      </Text>
    </Pressable>
  );

  const getVehicleIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bus': return 'bus';
      case 'tram': return 'train';
      case 'metro': return 'subway';
      default: return 'bus';
    }
  };

  const getVehicleColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bus': return '#2563EB';
      case 'tram': return '#059669';
      case 'metro': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const renderVehicleItem = (vehicle: any, index: number) => (
    <View key={vehicle._id || index} className="bg-surface rounded-lg border border-surface/60 p-3 mr-3 min-w-32">
      <View className="items-center">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: `${getVehicleColor(vehicle.type)}20` }}
        >
          <MaterialCommunityIcons 
            name={getVehicleIcon(vehicle.type) as any} 
            size={20} 
            color={getVehicleColor(vehicle.type)} 
          />
        </View>
        <Text className="text-text font-medium text-sm text-center">
          {vehicle.type}
        </Text>
        <Text className="text-subtext text-xs text-center">
          ID: {vehicle.vehicleNumber || vehicle._id?.slice(-4)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
                {/* Unified Header - Drawer + App Info */}
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

        {/* Search Bar - Web App Style */}
        <View className="px-4 py-4 bg-bg">
          <View className="bg-surface rounded-lg shadow-sm border border-surface/60 flex-row items-center px-4 py-3">
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-text text-base"
              placeholder="Search stations, trips, or vehicles..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"

            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Transit Cards Section - Web App Style */}
        <View className="mb-6 bg-surface shadow-sm">
          <View className="flex-row justify-between items-center px-4 py-4">
            <Text className="text-2xl font-bold text-text">Your Transit Cards</Text>
            <Pressable onPress={() => router.push('/profile' as any)}>
              <Text className="text-primary font-medium">View All →</Text>
            </Pressable>
          </View>
          
          {!user ? (
            <View className="mx-4 bg-surface rounded-card shadow-sm border border-surface/60 p-6 items-center">
              <MaterialCommunityIcons name="account-circle" size={48} color="#6B7280" />
              <Text className="text-lg font-medium text-text mt-3">Sign In Required</Text>
              <Text className="text-subtext text-center mt-2">
                Please sign in to view and manage your transit cards
              </Text>
              <Pressable 
                className="bg-primary px-4 py-2 rounded-lg mt-4"
                onPress={() => router.push('/(auth)/sign-in' as any)}
              >
                <Text className="text-white font-medium">Sign In</Text>
              </Pressable>
            </View>
          ) : cards.length > 0 ? (
            <FlatList
              data={cards}
              renderItem={renderCard}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          ) : (
            <View className="mx-4 bg-surface rounded-card shadow-sm border border-surface/60 p-6 items-center">
              <MaterialCommunityIcons name="credit-card-plus" size={48} color="#6B7280" />
              <Text className="text-lg font-medium text-text mt-3">No Transit Cards</Text>
              <Text className="text-subtext text-center mt-2">
                Get your first transit card at any station or through the app
              </Text>
              <Pressable className="bg-primary px-4 py-2 rounded-lg mt-4">
                <Text className="text-white font-medium">Get Started</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Quick Actions - Web App Style */}
        <View className="mb-6 bg-surface shadow-sm">
          <View className="px-4 py-4">
            <Text className="text-2xl font-bold text-text mb-2">Departure & Vehicles</Text>
            <Text className="text-subtext mb-6">Real-time schedules and available vehicles</Text>
            
            {/* Main Action Button */}
            <Pressable
              className="bg-surface rounded-card shadow-md border border-surface/60 p-4 mb-6"
              onPress={() => router.push('/routes' as any)}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                  style={{ backgroundColor: "#4F46E5" }}
                >
                  <MaterialCommunityIcons name="clock" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-text text-base mb-1">
                    View All Routes & Schedules
                  </Text>
                  <Text className="text-sm text-subtext">
                    Real-time departure information
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            </Pressable>

            {/* Vehicles List */}
            <Text className="text-lg font-bold text-text mb-3">Available Vehicles</Text>
            {vehicles.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {vehicles.map((vehicle, index) => renderVehicleItem(vehicle, index))}
              </ScrollView>
            ) : (
              <View className="bg-surface/50 rounded-lg p-4 items-center">
                <MaterialCommunityIcons name="bus-alert" size={32} color="#6B7280" />
                <Text className="text-subtext mt-2">No vehicles available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Nearby Stations - Web App Style */}
        <View className="mb-6 bg-surface shadow-sm border-t border-surface/40">
          <View className="px-4 py-4">
            <Text className="text-2xl font-bold text-text mb-2">Nearby Stations</Text>
            <Text className="text-subtext mb-4">Stations closest to your location</Text>
          </View>
          <NearestStationsHorizontal />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 