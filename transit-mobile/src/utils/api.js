import axios from 'axios';
import { AsyncStorage } from './storage';

// Mobile-specific API configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000, // Longer timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for mobile-specific handling
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Could not get token from AsyncStorage:', error);
    }
    
    console.log('📱 Mobile API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      hasAuth: !!config.headers.Authorization,
    });
    return config;
  },
  (error) => {
    console.error('📱 Mobile API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for mobile-specific error handling
api.interceptors.response.use(
  (response) => {
    console.log('📱 Mobile API Success:', {
      status: response.status,
      url: response.config.url,
      dataCount: Array.isArray(response.data) ? response.data.length : 'object',
    });
    return response;
  },
  (error) => {
    console.error('📱 Mobile API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      networkError: error.code === 'NETWORK_ERROR',
    });

    // Mobile-specific error handling
    if (error.code === 'NETWORK_ERROR') {
      console.log('📱 Network error - check if backend is running on localhost:5000');
    }
    
    if (error.response?.status === 401) {
      console.log('📱 Unauthorized - implement login redirect');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to normalize MongoDB ObjectId
const normalizeId = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  return String(id);
};

// API methods that match the web app functionality
export const transitAPI = {
  // Get transit lines by mode (bus, tram, metro) - real implementation like web app
  getLines: async (mode) => {
    console.log(`📱 Getting ${mode} lines from real database...`);
    try {
      // Get all lines and vehicles like BusPage.jsx
      const [linesRes, vehiclesRes] = await Promise.all([
        api.get('/lines'),
        api.get('/vehicles')
      ]);

      // Filter vehicles by type (capitalize first letter to match DB)
      const modeType = mode.charAt(0).toUpperCase() + mode.slice(1);
      const modeVehicles = vehiclesRes.data.filter(v => v.type === modeType);
      
      // Get the line IDs that have vehicles of this type
      const modeLineIds = new Set(modeVehicles.map(v => normalizeId(v.lineId)));
      
      // Filter lines that have vehicles of this type
      const modeLines = linesRes.data.filter(line => 
        modeLineIds.has(normalizeId(line._id))
      );

      // Group by line number and only show one per number (prefer Inbound as default)
      const linesByNumber = {};
      modeLines.forEach(line => {
        const number = line.number;
        if (!linesByNumber[number] || line.direction === 'Inbound') {
          linesByNumber[number] = line;
        }
      });

      const uniqueLines = Object.values(linesByNumber);
      console.log(`📱 Found ${uniqueLines.length} unique ${mode} lines`);
      
      return { data: uniqueLines };
    } catch (error) {
      console.error(`📱 Error fetching ${mode} lines:`, error);
      throw error;
    }
  },
  
  // Get line details with stops
  getLine: async (id) => {
    console.log(`📱 Getting line details for ${id}...`);
    try {
      const [linesRes, stopsRes] = await Promise.all([
        api.get('/lines'),
        api.get('/stops')
      ]);

      const line = linesRes.data.find(l => normalizeId(l._id) === id);
      if (!line) {
        throw new Error('Line not found');
      }

      // Get stops for this line in order
      const lineStops = line.stopIds
        .map(stopId => stopsRes.data.find(s => normalizeId(s._id) === normalizeId(stopId)))
        .filter(Boolean);

      return {
        data: {
          ...line,
          stops: lineStops
        }
      };
    } catch (error) {
      console.error(`📱 Error fetching line details:`, error);
      throw error;
    }
  },
  
  // Stops/Stations
  getStops: () => api.get('/stops'),
  
  getStop: (id) => api.get(`/stops/${id}`),
  
  getNearbyStops: (lat, lng, limit = 4) => 
    api.get(`/stops/nearby?lat=${lat}&lng=${lng}&limit=${limit}`),
  
  // Vehicles
  getVehicles: () => api.get('/vehicles'),
  
  getVehiclesByLine: (lineId) => api.get(`/vehicles?lineId=${lineId}`),
  
  // Transit Cards - now with real authentication
  getCards: async () => {
    console.log('📱 Getting user cards from database...');
    try {
      return await api.get('/cards');
    } catch (error) {
      console.error('📱 Error fetching cards:', error);
      // Return empty array if not authenticated or error
      if (error.response?.status === 401) {
        console.log('📱 User not authenticated, returning empty cards');
        return { data: [] };
      }
      throw error;
    }
  },
  
  getCard: (id) => api.get(`/cards/${id}`),
  
  updateCard: async (id, updateData) => {
    console.log('📱 Updating card:', id, updateData);
    try {
      return await api.put(`/cards/${id}`, updateData);
    } catch (error) {
      console.error('📱 Error updating card:', error);
      throw error;
    }
  },
  
  // User-related (for future implementation)
  getUser: (id) => api.get(`/users/${id}`),
  
  // Generic get method
  get: (endpoint) => api.get(endpoint),
  post: (endpoint, data) => api.post(endpoint, data),
  put: (endpoint, data) => api.put(endpoint, data),
  delete: (endpoint) => api.delete(endpoint),
};

export default api; 