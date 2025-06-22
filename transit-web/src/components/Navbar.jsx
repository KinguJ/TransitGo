import React, { useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useDevClock } from '../context/ClockContext';
import Login from './Login';
import Register from './Register';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const simNow = useDevClock();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLoginClick = () => {
    setShowDropdown(false);
    setShowLogin(true);
  };

  const handleRegisterClick = () => {
    setShowDropdown(false);
    setShowRegister(true);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <>
      <nav className="bg-white shadow-md relative z-[2000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">TransitGo</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stations, trips, or vehicles..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  🔍
                </span>
              </div>
            </div>

            {/* Dev Clock */}
            <div className="flex items-center">
              <div className="bg-gray-100 px-3 py-2 rounded-lg border">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Sim Time</div>
                <div className="text-sm font-semibold text-gray-900">{simNow.toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                🔔
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden hover:opacity-80"
                >
                  <FaUserCircle className="h-full w-full text-gray-600" />
                </button>

                {/* Dropdown Menu with higher z-index */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          {user.email}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleLoginClick}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Login
                        </button>
                        <button
                          onClick={handleRegisterClick}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Register
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Show Admin button only if user is admin */}
              {user && user.isAdmin && (
                <Link 
                  to="/admin"
                  className="px-4 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-700 my-auto"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showLogin && <Login onClose={() => setShowLogin(false)} />}
      {showRegister && <Register onClose={() => setShowRegister(false)} />}
    </>
  );
};

export default Navbar; 