import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Departure = {
  id: string;
  line: string;
  platform: string;
  time: string;
  status: string;
};

type Vehicle = {
  _id: string;
  type: string;
  number: string;
  route: {
    destination: string;
    platform: number;
  };
  schedule: {
    frequency: number;
    startTime: string;
    endTime: string;
  };
  status: string;
};

type TransitCardData = {
  id: string;
  name: string;
  cardNumber: string;
  balance: number;
  expiryDate: string;
};

type TransportOption = {
  type: string;
  icon: React.FC<{ color: string }>;
  color: string;
  available: boolean;
};

type Station = {
  name: string;
  lines: string[];
  distance: string;
  features: string[];
};

type TripDetails = {
  from: string;
  to: string;
  date: string;
  time: string;
};

const DepartureCard: React.FC<Departure> = ({ line, platform, time, status }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'On Time':
        return styles.statusOnTime;
      case 'Delayed':
        return styles.statusDelayed;
      case 'Approaching':
        return styles.statusApproaching;
      default:
        return styles.statusOnTime;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'On Time':
        return styles.statusTextGreen;
      case 'Delayed':
        return styles.statusTextRed;
      case 'Approaching':
        return styles.statusTextYellow;
      default:
        return styles.statusTextGreen;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <View>
          <Text style={styles.lineName}>{line}</Text>
          <Text style={styles.platform}>{platform}</Text>
        </View>
        <View style={styles.timeStatusContainer}>
          <Text style={styles.time}>{time}</Text>
          <View style={[styles.statusBadge, getStatusStyle(status)]}>
            <Text style={[styles.statusText, getStatusTextStyle(status)]}>{status}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const TransitCard: React.FC<TransitCardData> = ({ name, cardNumber, balance, expiryDate }) => {
  return (
    <View style={styles.transitCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.expiryDate}>Expires: {expiryDate}</Text>
        </View>
        <Text style={styles.cardNumber}>{cardNumber}</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const AddCardBox: React.FC = () => {
  return (
    <View style={styles.addCardBox}>
      <Text style={styles.plusSign}>+</Text>
      <Text style={styles.addCardText}>Add New Card</Text>
    </View>
  );
};

const TransportCard: React.FC<TransportOption> = ({ type, icon: Icon, color, available }) => {
  return (
    <View style={[styles.transportCard, !available && styles.transportCardDisabled]}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon color="white" />
      </View>
      <Text style={styles.transportType}>{type}</Text>
      {!available && (
        <Text style={styles.unavailableText}>Currently unavailable</Text>
      )}
    </View>
  );
};

const StationBadge: React.FC<{ text: string; color?: string }> = ({ text, color = '#f3f4f6' }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={[styles.badgeText, { 
      color: color === '#f3f4f6' ? '#1f2937' : '#1f2937'
    }]}>
      {text}
    </Text>
  </View>
);

const StationCard: React.FC<Station> = ({ name, lines, distance, features }) => {
  return (
    <View style={styles.stationCard}>
      <View style={styles.stationHeader}>
        <Text style={styles.stationName}>{name}</Text>
        <Text style={styles.distance}>{distance} km</Text>
      </View>

      <View style={styles.badgeContainer}>
        {/* Transport Lines */}
        <View style={styles.badgeRow}>
          {lines.map((line, index) => (
            <StationBadge
              key={index}
              text={line}
              color={
                line.startsWith('Bus') ? '#dcfce7' :
                line.startsWith('Metro') ? '#dbeafe' :
                '#fef3c7'
              }
            />
          ))}
        </View>

        {/* Station Features */}
        <View style={styles.badgeRow}>
          {features.map((feature, index) => (
            <StationBadge key={index} text={feature} />
          ))}
        </View>
      </View>
    </View>
  );
};

const TripPlanner: React.FC = () => {
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    time: 'now'
  });

  const handleClear = () => {
    setTripDetails({
      from: '',
      to: '',
      date: new Date().toISOString().split('T')[0],
      time: 'now'
    });
  };

  return (
    <View style={styles.tripPlannerSection}>
      <Text style={styles.sectionTitle}>Trip Planner</Text>
      <Text style={styles.sectionSubtitle}>Plan your journey from start to destination</Text>

      <View style={styles.formContainer}>
        {/* From Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={styles.input}
              value={tripDetails.from}
              onChangeText={(text) => setTripDetails(prev => ({ ...prev, from: text }))}
              placeholder="Enter starting point"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* To Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>To</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={styles.input}
              value={tripDetails.to}
              onChangeText={(text) => setTripDetails(prev => ({ ...prev, to: text }))}
              placeholder="Enter destination"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>When</Text>
          <View style={styles.timeSelection}>
            <TouchableOpacity 
              style={[styles.timeOption, tripDetails.time === 'now' && styles.timeOptionSelected]}
              onPress={() => setTripDetails(prev => ({ ...prev, time: 'now' }))}
            >
              <Text style={[styles.timeOptionText, tripDetails.time === 'now' && styles.timeOptionTextSelected]}>
                Now
              </Text>
            </TouchableOpacity>
            {['morning', 'afternoon', 'evening'].map((time) => (
              <TouchableOpacity 
                key={time}
                style={[styles.timeOption, tripDetails.time === time && styles.timeOptionSelected]}
                onPress={() => setTripDetails(prev => ({ ...prev, time }))}
              >
                <Text style={[styles.timeOptionText, tripDetails.time === time && styles.timeOptionTextSelected]}>
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.planButton}>
            <Text style={styles.planButtonText}>Plan My Trip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [transitCards] = useState<TransitCardData[]>([
    {
      id: '1',
      name: "Unlimited Pass",
      cardNumber: "**** **** **** 1234",
      balance: 42.50,
      expiryDate: "12/31/2025"
    },
    {
      id: '2',
      name: "Standard Pass",
      cardNumber: "**** **** **** 5678",
      balance: 25.75,
      expiryDate: "06/30/2024"
    }
  ]);

  const fetchDepartures = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/vehicles');
      const vehicles = await response.json();
      
      // Transform vehicle data into departure format
      const currentTime = new Date();
      const departureList = vehicles.map((vehicle: Vehicle) => {
        const nextDepartureMinutes = Math.ceil(currentTime.getMinutes() / vehicle.schedule.frequency) 
          * vehicle.schedule.frequency;
        const nextDepartureTime = new Date(currentTime.setMinutes(nextDepartureMinutes));

        return {
          id: vehicle._id,
          line: `${vehicle.type} ${vehicle.number}`,
          platform: `Platform ${Math.floor(Math.random() * 5) + 1} → ${vehicle.route.destination}`,
          time: nextDepartureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: vehicle.status
        };
      });

      setDepartures(departureList);
    } catch (error) {
      console.error('Error fetching departures:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDepartures();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDepartures();
    const interval = setInterval(fetchDepartures, 20000); // Match web app's 20-second interval
    return () => clearInterval(interval);
  }, []);

  // Add filtered departures
  const filteredDepartures = departures.filter(departure => 
    departure.line.toLowerCase().includes(searchQuery.toLowerCase()) ||
    departure.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add transport options data
  const transportOptions: TransportOption[] = [
    {
      type: 'Bus',
      icon: ({ color }) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} fill="none">
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v6a2 2 0 002 2h2"
          />
        </Svg>
      ),
      color: '#22c55e', // green-500
      available: true
    },
    {
      type: 'Metro',
      icon: ({ color }) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} fill="none">
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </Svg>
      ),
      color: '#3b82f6', // blue-500
      available: true
    },
    {
      type: 'Tram',
      icon: ({ color }) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} fill="none">
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm0 5h14M5 14h14"
          />
        </Svg>
      ),
      color: '#eab308', // yellow-500
      available: true
    },
    {
      type: 'Bike Share',
      icon: ({ color }) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} fill="none">
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </Svg>
      ),
      color: '#6b7280', // gray-500
      available: false
    }
  ];

  // Add stations data in HomeScreen component
  const stations: Station[] = [
    {
      name: 'Central Station',
      lines: ['Metro Line 1', 'Bus 42', 'Tram 7'],
      distance: '0.5',
      features: ['Ticket Machine', 'Waiting Area', 'Elevator']
    },
    {
      name: 'Shopping District',
      lines: ['Bus 42', 'Bus 15'],
      distance: '0.8',
      features: ['Ticket Machine', 'Covered Waiting Area']
    },
    {
      name: 'University Station',
      lines: ['Metro Line 2', 'Tram 7'],
      distance: '1.2',
      features: ['Ticket Machine', 'Bike Parking']
    },
    {
      name: 'Airport Express',
      lines: ['Metro Line 3', 'Bus Airport'],
      distance: '1.5',
      features: ['Information Desk', 'Luggage Storage', 'Elevator']
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Welcome to TransitGo</Text>
          <Text style={styles.heroSubtitle}>Real-time transit information at your fingertips</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by line or destination..."
              placeholderTextColor="#bfdbfe"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Transit Cards Section */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>Your Transit Cards</Text>
          <Text style={styles.sectionSubtitle}>Manage your passes and balance</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cardsScroll}
          >
            {transitCards.map(card => (
              <TransitCard key={card.id} {...card} />
            ))}
            <AddCardBox />
          </ScrollView>
        </View>

        {/* Departures Section */}
        <View style={styles.departuresSection}>
          <Text style={styles.sectionTitle}>Departure Times</Text>
          <Text style={styles.sectionSubtitle}>Upcoming departures from nearby stations</Text>
          
          <View style={styles.departureList}>
            {filteredDepartures.map(departure => (
              <DepartureCard key={departure.id} {...departure} />
            ))}
          </View>
        </View>

        {/* Transport Options Section */}
        <View style={styles.transportSection}>
          <Text style={styles.sectionTitle}>Transport Options</Text>
          <Text style={styles.sectionSubtitle}>Available transportation methods in your area</Text>
          
          <View style={styles.transportGrid}>
            {transportOptions.map((option, index) => (
              <TransportCard key={index} {...option} />
            ))}
          </View>
        </View>

        {/* Nearby Stations Section */}
        <View style={styles.stationsSection}>
          <Text style={styles.sectionTitle}>Nearby Stations</Text>
          <Text style={styles.sectionSubtitle}>Find stations and their available services</Text>
          
          <View style={styles.stationsGrid}>
            {stations.map((station, index) => (
              <StationCard key={index} {...station} />
            ))}
          </View>
        </View>

        <TripPlanner />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  hero: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1d4ed8', // blue-700
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#bfdbfe', // blue-200
    marginBottom: 20,
  },
  departuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
  },
  departureList: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  platform: {
    fontSize: 14,
    color: '#4b5563',
  },
  timeStatusContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  time: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnTime: {
    backgroundColor: '#dcfce7',
  },
  statusDelayed: {
    backgroundColor: '#fee2e2',
  },
  statusApproaching: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextGreen: {
    color: '#166534',
  },
  statusTextRed: {
    color: '#991b1b',
  },
  statusTextYellow: {
    color: '#854d0e',
  },
  searchContainer: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  cardsSection: {
    padding: 20,
  },
  cardsScroll: {
    marginTop: 10,
    paddingBottom: 10,
  },
  transitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  expiryDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardNumber: {
    fontSize: 16,
    color: '#4b5563',
    fontFamily: 'monospace',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#4b5563',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  addCardBox: {
    backgroundColor: '#f3f4f6', // gray-100
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db', // gray-300
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusSign: {
    fontSize: 32,
    color: '#9ca3af', // gray-400
    marginBottom: 8,
  },
  addCardText: {
    fontSize: 16,
    color: '#4b5563', // gray-600
  },
  transportSection: {
    padding: 20,
  },
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  transportCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transportCardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  transportType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  unavailableText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  stationsSection: {
    padding: 20,
  },
  stationsGrid: {
    gap: 16,
  },
  stationCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  distance: {
    fontSize: 14,
    color: '#6b7280',
  },
  badgeContainer: {
    gap: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tripPlannerSection: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  timeSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  timeOptionSelected: {
    backgroundColor: '#2563eb',
  },
  timeOptionText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: 'white',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  clearButtonText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
  planButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  planButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen; 