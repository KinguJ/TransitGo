import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import axios from 'axios';

// Types
type Vehicle = {
  _id: string;
  type: string;
  number: string;
  route: {
    destination: string;
    mainStations: string[];
  };
  schedule: {
    frequency: number;
    firstDeparture: string;
    lastDeparture: string;
  };
  status: 'On Time' | 'Delayed' | 'Out of Service';
};

type Departure = {
  id: string;
  line: string;
  platform: string;
  time: string;
  status: string;
};

const DepartureCard: React.FC<Departure> = ({ line, platform, time, status }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'On Time':
        return styles.statusOnTime;
      case 'Delayed':
        return styles.statusDelayed;
      default:
        return styles.statusApproaching;
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
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDepartures = async () => {
    try {
      const response = await axios.get<Vehicle[]>('http://localhost:5000/api/vehicles');
      const vehicles = response.data;
      
      // Transform vehicle data into departure format
      const currentTime = new Date();
      const departureList = vehicles.map(vehicle => {
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
    const interval = setInterval(fetchDepartures, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Departure Times</Text>
        <Text style={styles.headerSubtitle}>Upcoming departures from nearby stations</Text>
      </View>

      <View style={styles.departureList}>
        {departures.map(departure => (
          <DepartureCard key={departure.id} {...departure} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // gray-50 equivalent
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900 equivalent
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4b5563', // gray-600 equivalent
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    backgroundColor: '#dcfce7', // green-100 equivalent
  },
  statusDelayed: {
    backgroundColor: '#fee2e2', // red-100 equivalent
  },
  statusApproaching: {
    backgroundColor: '#fef3c7', // yellow-100 equivalent
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen;
