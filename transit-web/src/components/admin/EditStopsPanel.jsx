import React, { useState, useRef, useEffect } from 'react';
import { useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from '../../utils/axios';
import { FaTrash } from 'react-icons/fa';

// Import the bus stop icon
import busStopIcon from '../../assets/bus-stop.png';

const stopIcon = new L.Icon({
  iconUrl: busStopIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const EditStopsPanel = ({ 
  onDone, 
  stops, 
  setStops, 
  onStopSelect, 
  selectedStopId,
  panelMode,
  tempStopPos,
  setTempStopPos 
}) => {
  const [mode, setMode] = useState('add'); // 'add' or 'edit'
  const [currentStop, setCurrentStop] = useState({ name: '', lng: null, lat: null });
  const [selectedStop, setSelectedStop] = useState(null);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, []);

  useEffect(() => {
    setSelectedStop(null);
    setMode('add');
    onStopSelect(null, []);
  }, [panelMode]);

  // Map click handler
  useMapEvents({
    click: (e) => {
      if (mode === 'add') {
        setCurrentStop(prev => ({
          ...prev,
          lng: e.latlng.lng,
          lat: e.latlng.lat
        }));
      } else if (mode === 'edit' && selectedStop) {
        handleUpdateLocation(e.latlng);
      }
    }
  });

  const handleNameChange = (e) => {
    if (mode === 'add') {
      setCurrentStop(prev => ({ ...prev, name: e.target.value }));
    } else if (selectedStop) {
      setSelectedStop(prev => ({ ...prev, name: e.target.value }));
    }
  };

  const handleAddStop = async () => {
    if (!tempStopPos || !currentStop.name) {
      console.log('Early return - missing data:', { tempStopPos, currentStopName: currentStop.name });
      return;
    }

    try {
      // Log the raw input
      console.log('Raw tempStopPos:', tempStopPos);
      console.log('Raw currentStop:', currentStop);

      // Extract coordinates and convert to numbers with fixed precision
      const lng = Number(Number(tempStopPos[0]).toFixed(6));
      const lat = Number(Number(tempStopPos[1]).toFixed(6));

      console.log('Processed coordinates:', { lng, lat });

      const stopData = {
        name: currentStop.name,
        lng,
        lat
      };

      // Log the final data being sent
      console.log('Sending stop data:', JSON.stringify(stopData, null, 2));

      const response = await axios.post('/api/stops', stopData);

      console.log('Server response:', response.data);

      setStops([...stops, response.data]);
      setCurrentStop({ name: '', lng: null, lat: null });
      setTempStopPos(null);
      onDone();
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to add stop');
    }
  };

  const handleUpdateLocation = async (latlng) => {
    try {
      const response = await axios.patch(`/api/stops/${selectedStop._id}/location`, {
        lng: latlng.lng,
        lat: latlng.lat
      });
      
      // Update stops array locally
      setStops(prevStops => prevStops.map(stop => 
        stop._id === selectedStop._id ? response.data : stop
      ));
      
      setSelectedStop(response.data);
      setError(null);
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update location');
    }
  };

  const handleUpdateName = async () => {
    try {
      console.log('Updating stop:', selectedStop._id, 'with name:', selectedStop.name);
      
      const response = await axios.put(`/api/stops/${selectedStop._id}`, {
        name: selectedStop.name
      });
      
      setStops(prevStops => prevStops.map(stop => 
        stop._id === selectedStop._id ? response.data : stop
      ));
      
      setSelectedStop(response.data);
      setError(null);
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update name');
    }
  };

  const handleDeleteStop = async (stopId) => {
    try {
      await axios.delete(`/api/stops/${stopId}`);
      
      // Update stops array locally
      setStops(prevStops => prevStops.filter(stop => stop._id !== stopId));
      
      setSelectedStop(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete stop');
    }
  };

  const handleSelectStop = async (stop) => {
    setSelectedStop(stop);

    // Get route for this stop
    let path = [];
    try {
      if (stop.location) {
        path = [
          [stop.location.coordinates[1], stop.location.coordinates[0]]
        ];
      }
    } catch (err) {
      console.error('Error getting stop route:', err);
    }

    onStopSelect(stop._id, path);
    setError(null);
  };

  useEffect(() => {
    return () => setTempStopPos(null);
  }, [setTempStopPos]);

  return (
    <div 
      ref={panelRef}
      className="absolute right-4 top-16 bg-white p-6 rounded-lg shadow-lg min-w-[300px] max-w-[400px] z-[1000]"
    >
      <h3 className="text-lg font-semibold mb-4">Manage Stops</h3>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setMode('add')}
          className={`px-3 py-1 rounded flex-1 ${mode === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Add New Stop
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`px-3 py-1 rounded flex-1 ${mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Edit Stops
        </button>
      </div>
      
      {mode === 'add' && (
        <div className="mb-4">
          <input
            type="text"
            value={currentStop.name}
            onChange={handleNameChange}
            placeholder="Stop name"
            className="w-full p-2 border rounded mb-2"
          />
          {currentStop.lat && currentStop.lng && (
            <div className="text-sm text-gray-600 mb-2">
              Selected: [{currentStop.lat.toFixed(6)}, {currentStop.lng.toFixed(6)}]
            </div>
          )}
          <button
            onClick={handleAddStop}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            Add Stop
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="mb-4">
          {!selectedStop ? (
            // Show list of stops when none is selected
            <div className="max-h-[300px] overflow-y-auto">
              {stops.map(stop => (
                <div 
                  key={stop._id}
                  onClick={() => handleSelectStop(stop)}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded flex justify-between items-center"
                >
                  <span>{stop.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStop(stop._id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Show edit form when stop is selected
            <div>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={selectedStop.name}
                  onChange={handleNameChange}
                  className="flex-1 p-2 border rounded mr-2"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStop(selectedStop._id);
                  }}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <FaTrash />
                </button>
              </div>
              <button
                onClick={handleUpdateName}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full mb-2"
              >
                Update Name
              </button>
              <div className="text-sm text-gray-600 mb-2">
                Click on map to update location
              </div>
              <button
                onClick={() => setSelectedStop(null)}
                className="text-gray-500 hover:text-gray-700 w-full text-sm"
              >
                Back to list
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}

      <div className="text-sm text-gray-600">
        {mode === 'add' && 'Click on the map to select stop location'}
        {mode === 'edit' && !selectedStop && 'Select a stop to edit'}
      </div>
    </div>
  );
};

export default EditStopsPanel; 