import React from 'react';
import Navbar from './components/Navbar';
import TransitCard from './components/TransitCard';
import QRTicket from './components/QRTicket';
import DepartureList from './components/DepartureList';
import TransportOptions from './components/TransportOptions';
import NearbyStations from './components/NearbyStations';
import TripPlanner from './components/TripPlanner';
import AppPromo from './components/AppPromo';
import Footer from './components/Footer';

function App() {
  const transitCards = [
    {
      name: "Unlimited Pass",
      cardNumber: "**** **** **** 1234",
      balance: "42.50",
      expiryDate: "12/31/2025"
    },
    {
      name: "Standard Pass",
      cardNumber: "**** **** **** 5678",
      balance: "25.75",
      expiryDate: "06/30/2024"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* My Transit Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My Transit Cards</h2>
          <p className="text-gray-600">Manage your transit cards and balances</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transitCards.map((card, index) => (
            <TransitCard key={index} {...card} />
          ))}
          <div className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 cursor-pointer transition-colors">
            <div className="text-center">
              <span className="block text-3xl text-gray-400 mb-2">+</span>
              <span className="text-gray-600">Add New Card</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add Balance
          </button>
        </div>
      </section>

      {/* QR Ticket Section */}
      <QRTicket />

      {/* Departure Times Section */}
      <DepartureList />

      {/* Transport Options Section */}
      <TransportOptions />

      {/* Nearby Stations Section */}
      <NearbyStations />

      {/* Trip Planner Section */}
      <TripPlanner />

      {/* App Download Promo */}
      <AppPromo />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
