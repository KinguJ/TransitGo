import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Single request interceptor for token and debugging
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Single response interceptor for error handling and debugging
instance.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance; 