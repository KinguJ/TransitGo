import React, { useState, useEffect } from 'react';
import { getCurrentLocation, getNearbyStations } from '../utils/stationService';
import { useDevClock } from '../context/ClockContext';
import axios from '../utils/axios';

 const StationBadge = ({ text, color = 'bg-gray-100 text-gray-800' }) => (
   <span className={`${color} text-xs px-2 py-1 rounded-full font-medium`}>
     {text}
   </span>
 );

const StationCard = ({ station, isOpen, onToggle }) => {
   return (
     <button
       onClick={onToggle}
       className={`w-full text-left bg-white rounded-lg shadow-md p-6 focus:outline-none transition
                  ${isOpen ? 'ring-2 ring-blue-500' : ''}`}
     >
       <div className="flex justify-between items-start mb-4">
         <h3 className="text-lg font-semibold text-gray-900">{station.name}</h3>
         <span className="text-sm text-gray-500">
           {station.distance ? `${station.distance.toFixed(2)} km` : 'Distance unknown'}
         </span>
       </div>

       <div className="space-y-4">
         {/* Transport Lines */}
         {station.lines && station.lines.length > 0 && (
           <div className="flex flex-wrap gap-2">
             {station.lines.map((line, index) => (
               <StationBadge
                 key={index}
                 text={line}
                 color={
                   line.startsWith('Bus') ? 'bg-green-100 text-green-800' :
                   line.startsWith('Metro') ? 'bg-blue-100 text-blue-800' :
                   'bg-yellow-100 text-yellow-800'
                 }
               />
             ))}
           </div>
         )}

         {/* Station Features */}
         {station.features && station.features.length > 0 && (
           <div className="flex flex-wrap gap-2">
             {station.features.map((feature, index) => (
               <StationBadge key={index} text={feature} />
             ))}
           </div>
         )}

         {/* Expandable Vehicles Section */}
         {isOpen && (
           <div className="mt-4 space-y-1 border-t pt-4">
             {station.vehiclesLoading && (
               <p className="text-sm text-gray-500">Loading vehicles…</p>
             )}
             {station.vehiclesError && (
               <p className="text-sm text-red-600">{station.vehiclesError}</p>
             )}
             {station.vehicles && station.vehicles.length > 0 && (
               <>
                 <h4 className="text-sm font-semibold text-gray-700">Vehicles</h4>
                 <ul className="list-disc pl-5 space-y-0.5">
                   {station.vehicles
                     .reduce((unique, v) => {
                       // Only add if we haven't seen this type+number combination before
                       const key = `${v.type}-${v.number}`;
                       if (!unique.find(item => `${item.type}-${item.number}` === key)) {
                         unique.push(v);
                       }
                       return unique;
                     }, [])
                     .map(v => (
                       <li key={`${v.type}-${v.number}`} className="text-sm text-gray-800">
                         {v.type} {v.number}
                       </li>
                     ))}
                 </ul>
               </>
             )}
             {station.vehicles && station.vehicles.length === 0 && !station.vehiclesLoading && !station.vehiclesError && (
               <p className="text-sm text-gray-500">No vehicles currently assigned to this stop</p>
             )}
           </div>
         )}
       </div>
     </button>
   );
 };

 const NearbyStations = () => {
   const [stations, setStations] = useState([]);
   const [openId, setOpenId] = useState(null);            // which card is open
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [locationStatus, setLocationStatus] = useState('Getting your location...');
   const [currentLocation, setCurrentLocation] = useState(null);
   const [debugInfo, setDebugInfo] = useState(null);
   const devTime = useDevClock();

   // Helper to fetch vehicles for one stop
   const fetchVehiclesForStop = async (stopId) => {
     try {
       const { data } = await axios.get('/vehicles', { params: { stopId } });
       return { vehicles: data };
     } catch (e) {
       return { vehiclesError: 'Could not load vehicles' };
     }
   };

   useEffect(() => {
     loadNearbyStations();
   }, []);

   const loadNearbyStations = async () => {
     try {
       setLoading(true);
       setError(null);
       setLocationStatus('Getting your location...');
       // Get user's current location
       const location = await getCurrentLocation();
       setCurrentLocation(location);
       setLocationStatus('Finding nearby stations...');

       // Add debug info
       console.log('User location:', location);
       console.log('User coordinates for API call - lng:', location.longitude, 'lat:', location.latitude);
       setDebugInfo({
         userLocation: location,
       });

        // Fetch nearby stations using the /stops/nearby endpoint
        const nearbyStations = await getNearbyStations(
         location.longitude, 
         location.latitude, 
         4
       );

       console.log('Found stations:', nearbyStations);
       setStations(nearbyStations);
       setLocationStatus('');
     } catch (error) {
       console.error('Error loading nearby stations:', error);
       setError(error.message || 'Unable to load nearby stations');
       setLocationStatus('');
     } finally {
       setLoading(false);
     }
   };

   const handleRetry = () => {
     loadNearbyStations();
   };

   return (
     <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="mb-8">
         <h2 className="text-2xl font-bold text-gray-900">Nearby Stations</h2>
         <p className="text-gray-600">Find stations and their available services near you</p>
         {locationStatus && (
           <p className="text-sm text-blue-600 mt-2">{locationStatus}</p>
         )}
       </div>

       {/* Current Location Display */}
       {loading ? (
         <div className="flex justify-center items-center py-12">
           <div className="text-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
             <p className="text-gray-600">Loading nearby stations...</p>
           </div>
         </div>
       ) : error ? (
         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
           <div className="text-red-600 mb-4">
             <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
             </svg>
           </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Stations</h3>
           <p className="text-red-600 mb-4">{error}</p>
           {currentLocation && (
             <div className="text-sm text-gray-600 mb-4">
               <p>Your location: {currentLocation.longitude.toFixed(4)}, {currentLocation.latitude.toFixed(4)}</p>
               <p>Make sure there are transit stations within 10km of your location.</p>
             </div>
           )}
           <button
             onClick={handleRetry}
             className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
           >
             Try Again
           </button>
         </div>
       ) : stations.length === 0 ? (
         <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
           <div className="text-gray-400 mb-4">
             <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
           </div>
           <h3 className="text-lg font-medium text-gray-700 mb-2">No Stations Found</h3>
           <p className="text-gray-600 mb-4">We couldn't find any transit stations near your location.</p>
           {currentLocation && (
             <div className="text-sm text-gray-600 mb-4 bg-white p-3 rounded border">
               <p><strong>Your location:</strong> {currentLocation.longitude.toFixed(6)}, {currentLocation.latitude.toFixed(6)}</p>
               <p><strong>Search radius:</strong> 10 kilometers</p>
               <p className="text-xs mt-2 text-gray-500">
                 This might happen if:
                 <br />• There are no transit stations in the database near you
                 <br />• The database hasn't been seeded with station data
                 <br />• You're in an area without public transit coverage
               </p>
             </div>
           )}
           <div className="space-x-3">
             <button
               onClick={handleRetry}
               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
             >
               Refresh
             </button>
             <button
               onClick={() => window.open(`https://www.google.com/maps/@${currentLocation?.longitude},${currentLocation?.latitude},15z`, '_blank')}
               className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
               disabled={!currentLocation}
             >
               View on Map
             </button>
           </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
           {stations.map((station, index) => (
             <StationCard 
               key={station._id || index} 
               station={station}
               isOpen={openId === station._id}
               onToggle={async () => {
                 setOpenId(prev => (prev === station._id ? null : station._id));

                 // already has vehicles? don't fetch again
                 if (!station.vehicles && !station.vehiclesLoading && !station.vehiclesError) {
                   // optimistic flag to show "loading…"
                   setStations(s =>
                     s.map(st => st._id === station._id ? { ...st, vehiclesLoading: true } : st)
                   );
                   const extra = await fetchVehiclesForStop(station._id);
                   setStations(s =>
                     s.map(st => st._id === station._id ? { ...st, ...extra, vehiclesLoading: false } : st)
                   );
                 }
               }}
             />
           ))}
         </div>
       )}
     </section>
   );
 };

 export default NearbyStations;