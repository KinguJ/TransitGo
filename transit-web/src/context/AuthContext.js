import { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext(null);

// Helper function to safely access storage
const safeStorageGet = (storageType, key) => {
  try {
    return storageType.getItem(key);
  } catch (error) {
    console.warn(`Cannot access ${storageType === localStorage ? 'localStorage' : 'sessionStorage'}:`, error);
    return null;
  }
};

const safeStorageSet = (storageType, key, value) => {
  try {
    storageType.setItem(key, value);
  } catch (error) {
    console.warn(`Cannot set ${storageType === localStorage ? 'localStorage' : 'sessionStorage'}:`, error);
  }
};

const safeStorageRemove = (storageType, key) => {
  try {
    storageType.removeItem(key);
  } catch (error) {
    console.warn(`Cannot remove from ${storageType === localStorage ? 'localStorage' : 'sessionStorage'}:`, error);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (token) => {
    console.log('Loading user with token:', token);
    try {
      // Try /me endpoint first
      try {
        const response = await axios.get('/users/me');
        console.log('User data loaded from /me:', response.data);
        setUser(response.data);
        safeStorageSet(sessionStorage, 'user', JSON.stringify(response.data));
        return;
      } catch (meError) {
        console.log('Falling back to /users endpoint');
      }

      // Fallback to /users endpoint
      const response = await axios.get('/users');
      // Just get the first user since the endpoint is protected and will only return our user
      const userData = response.data[0];
      
      if (!userData) {
        throw new Error('User not found');
      }

      console.log('User data loaded from /users:', userData);
      setUser(userData);
      safeStorageSet(sessionStorage, 'user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to load user:', error.response?.data || error.message);
      logout();
    }
  };

  const login = async (token) => {
    console.log('Login called with token:', token);
    try {
      safeStorageSet(localStorage, 'token', token);
      // Set token in axios headers immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await loadUser(token);
      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      logout();
      throw error; // Propagate error to Login component
    }
  };

  const logout = () => {
    console.log('Logging out');
    safeStorageRemove(localStorage, 'token');
    safeStorageRemove(sessionStorage, 'user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing auth');
      const token = safeStorageGet(localStorage, 'token');
      console.log('Found token:', token ? 'yes' : 'no');
      
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await loadUser(token);
        } catch (error) {
          console.error('Init auth error:', error.response?.data || error.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 