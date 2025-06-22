import apiClient from './axios';

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

export const getNearbyStations = async (longitude, latitude, limit = 4) => {
  try {
    console.log('📍 Calling getNearbyStations with:', {
      longitude,
      latitude,
      limit,
      coordinateOrder: '[lng, lat]'
    });
    
    const params = {
      lng: longitude,
      lat: latitude
    };
    
    console.log('📡 API request params:', params);
    
    // Use your existing /stops/nearby endpoint
    const response = await apiClient.get('/stops/nearby', {
      params
    });
    
    console.log('✅ API response:', response.data);
    
    // Add distance calculation to each stop
    const stationsWithDistance = response.data.map(stop => ({
      ...stop,
      distance: calculateDistance(latitude, longitude, stop.location.coordinates[1], stop.location.coordinates[0])
    }));
    
    return stationsWithDistance;
  } catch (error) {
    console.error('❌ Error fetching nearby stations:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const getStationArrivals = async (stationId, limit = 3, devTime = null) => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString()
    });
    
    // Add devTime if provided
    if (devTime) {
      params.append('devTime', devTime.toISOString());
    }
    
    const response = await apiClient.get(`/stops/${stationId}/arrivals?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching station arrivals:', error);
    throw new Error('Failed to fetch arrival information');
  }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Debug functions
export const getAllStations = async () => {
  try {
    const response = await apiClient.get('/stops/debug/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching all stations:', error);
    throw error;
  }
};

export const checkDatabaseStatus = async () => {
  try {
    const response = await apiClient.get('/stops');
    return {
      totalStations: response.data.length,
      stations: response.data
    };
  } catch (error) {
    console.error('Error checking database status:', error);
    throw error;
  }
}; 