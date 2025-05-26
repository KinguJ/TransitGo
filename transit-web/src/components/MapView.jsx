import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Icon } from 'leaflet';
import { FaLocationArrow } from 'react-icons/fa';
import RouteCreator from './RouteCreator';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Component to handle location updates
const LocationControl = () => {
  const map = useMap();

  const centerOnLocation = useCallback(() => {
    map.locate().on("locationfound", function (e) {
      map.flyTo(e.latlng, 17, {
        duration: 1 // Changed from 0.5 to 1 second
      });
    });
  }, [map]);

  useEffect(() => {
    centerOnLocation();
  }, [centerOnLocation]);

  return null;
};

const MapView = () => {
  const defaultPosition = [38.6748, 39.2225];
  const zoom = 17;
  const [map, setMap] = useState(null);

  const handleCenterClick = () => {
    if (map) {
      map.locate().on("locationfound", function (e) {
        map.flyTo(e.latlng, 17, {
          duration: 1 // Changed from 0.5 to 1 second
        });
      });
    }
  };

  return (
    <div className="relative w-full h-[400px]">
      <MapContainer 
        center={defaultPosition} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationControl />
        <RouteCreator />
      </MapContainer>
      
      {/* Button outside MapContainer but positioned absolutely */}
      <button
        onClick={handleCenterClick}
        className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <FaLocationArrow className="text-gray-600 text-xl" />
      </button>
    </div>
  );
};

export default MapView; 