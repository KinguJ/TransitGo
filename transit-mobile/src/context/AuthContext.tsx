import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AsyncStorage } from '../utils/storage';
import api from '../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (token: string) => {
    console.log('Loading user with token:', token);
    try {
      // Set token in API instance
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try /me endpoint first
      try {
        const response = await api.get('/users/me');
        console.log('User data loaded from /me:', response.data);
        setUser(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        return;
      } catch (meError) {
        console.log('Falling back to /users endpoint');
      }

      // Fallback to /users endpoint
      const response = await api.get('/users');
      const userData = response.data[0];
      
      if (!userData) {
        throw new Error('User not found');
      }

      console.log('User data loaded from /users:', userData);
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Failed to load user:', error.response?.data || error.message);
      logout();
      throw error;
    }
  };

  const login = async (token: string) => {
    console.log('Login called with token:', token);
    try {
      await AsyncStorage.setItem('token', token);
      await loadUser(token);
      console.log('Login completed successfully');
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      logout();
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logging out');
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing auth');
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('Found token:', token ? 'yes' : 'no');
        
        if (token) {
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            await loadUser(token);
          } catch (error: any) {
            console.error('Init auth error:', error.response?.data || error.message);
            logout();
          }
        }
      } catch (error) {
        console.error('Error accessing AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 