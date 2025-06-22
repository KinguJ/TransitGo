import React, { useState } from 'react';
import Navbar from './components/Navbar';
import DepartureList from './components/DepartureList';
import TransportOptions from './components/TransportOptions';
import NearbyStations from './components/NearbyStations';
import TripPlanner from './components/TripPlanner';
import AppPromo from './components/AppPromo';
import Footer from './components/Footer';
import TransitCards from './components/TransitCards';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminMap from './components/admin/AdminMap';
import BusPage from './components/BusPage';
import MetroPage from './components/MetroPage';
import TramPage from './components/TramPage';
import RouteMap from './components/RouteMap';

// Create a wrapper component that uses the auth context
const AppContent = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={handleLoginClick} />
      <DepartureList />
      <TransitCards onLoginClick={handleLoginClick} />
      <TransportOptions />
      <NearbyStations />
      <TripPlanner />
      {/* <AppPromo /> */}
      <Footer />
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/transport/bus" element={<BusPage />} />
          <Route path="/transport/metro" element={<MetroPage />} />
          <Route path="/transport/tram" element={<TramPage />} />
          <Route path="/line/:lineId" element={<RouteMap />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminMap />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;