import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClockProvider } from './context/ClockContext';
import RouteMap from './components/RouteMap';

// Simple Home component
const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TransitGo</h1>
        <p className="text-lg text-gray-600 mb-8">Transit Route Management System</p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Navigate to /route/:lineId to view a specific route</p>
          <p className="text-sm text-gray-500">Example: /route/60b5d5a5f1b2c3d4e5f6g7h8</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ClockProvider startTime={new Date()}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/route/:lineId" element={<RouteMap />} />
          {/* Add other routes as needed */}
        </Routes>
      </BrowserRouter>
    </ClockProvider>
  );
}

export default App; 