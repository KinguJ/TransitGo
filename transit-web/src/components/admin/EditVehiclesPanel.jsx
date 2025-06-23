import React, { useState, useRef, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import axios from '../../utils/axios';

const EditVehiclesPanel = ({ onDone, vehicles, setVehicles, lines }) => {
  const [mode, setMode] = useState('add');
  const [currentVehicle, setCurrentVehicle] = useState({
    number: '',
    type: 'Bus',
    status: 'On Time',
    lineId: '',
    location: {
      type: 'Point',
      coordinates: [39.223, 38.677]
    }
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setSelectedVehicle(null);
    setCurrentVehicle({
      number: '',
      type: 'Bus',
      status: 'On Time',
      lineId: '',
      location: {
        type: 'Point',
        coordinates: [39.223, 38.677]
      }
    });
    setError(null);
  }, [mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (mode === 'add') {
      setCurrentVehicle(prev => ({ ...prev, [name]: value }));
    } else if (selectedVehicle) {
      setSelectedVehicle(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddVehicle = async () => {
    try {
      if (!currentVehicle.number || !currentVehicle.lineId) {
        setError('Please enter vehicle number and select a line');
        return;
      }

      const response = await axios.post('/vehicles', currentVehicle);
      setVehicles(prev => [...prev, response.data]);
      setCurrentVehicle({
        number: '',
        type: 'Bus',
        status: 'On Time',
        lineId: '',
        location: {
          type: 'Point',
          coordinates: [39.223, 38.677]
        }
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleUpdateVehicle = async () => {
    try {
      const response = await axios.patch(`/vehicles/${selectedVehicle._id}`, {
        number: selectedVehicle.number,
        type: selectedVehicle.type,
        status: selectedVehicle.status,
        lineId: selectedVehicle.lineId
      });
      
      setVehicles(prevVehicles => prevVehicles.map(vehicle => 
        vehicle._id === selectedVehicle._id ? response.data : vehicle
      ));
      
      setSelectedVehicle(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vehicle');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      await axios.delete(`/vehicles/${vehicleId}`);
      setVehicles(prevVehicles => prevVehicles.filter(vehicle => vehicle._id !== vehicleId));
      setSelectedVehicle(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setError(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getLineName = (lineId) => {
    const line = lines.find(l => l._id === lineId);
    return line ? `Line ${line.number} - ${line.longName}` : 'No Line Assigned';
  };

  const renderVehicleForm = (vehicle) => (
    <div className="space-y-2">
      <input
        type="text"
        name="number"
        value={vehicle.number}
        onChange={handleInputChange}
        placeholder="Vehicle number (e.g., E1-01)"
        className="w-full p-2 border rounded"
      />
      <select
        name="type"
        value={vehicle.type}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
      >
        <option value="Bus">Bus</option>
        <option value="Metro">Metro</option>
        <option value="Tram">Tram</option>
      </select>
      <select
        name="status"
        value={vehicle.status}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
      >
        <option value="On Time">On Time</option>
        <option value="Delayed">Delayed</option>
        <option value="Out of Service">Out of Service</option>
        <option value="Maintenance">Maintenance</option>
      </select>
      <select
        name="lineId"
        value={vehicle.lineId || ''}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
      >
        <option value="">Select a Line</option>
        {lines.map(line => (
          <option key={line._id} value={line._id}>
            Line {line.number} - {line.longName}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div 
      ref={panelRef}
      className="absolute right-4 top-16 bg-white p-6 rounded-lg shadow-lg min-w-[300px] max-w-[400px] z-[1000]"
    >
      <h3 className="text-lg font-semibold mb-4">Manage Vehicles</h3>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setMode('add')}
          className={`px-3 py-1 rounded flex-1 ${mode === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Add New Vehicle
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`px-3 py-1 rounded flex-1 ${mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Edit Vehicles
        </button>
      </div>
      
      {mode === 'add' && (
        <div className="mb-4 space-y-2">
          {renderVehicleForm(currentVehicle)}
          <button
            onClick={handleAddVehicle}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            Add Vehicle
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="mb-4">
          {!selectedVehicle ? (
            <div className="max-h-[300px] overflow-y-auto">
              {vehicles.map(vehicle => (
                <div 
                  key={vehicle._id}
                  onClick={() => handleSelectVehicle(vehicle)}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{vehicle.number}</div>
                    <div className="text-sm text-gray-600">
                      {vehicle.type} - {vehicle.status}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getLineName(vehicle.lineId)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVehicle(vehicle._id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">
                ID: {selectedVehicle._id}
              </div>
              {renderVehicleForm(selectedVehicle)}
              <div className="text-xs text-gray-500">
                <div>Location: [{selectedVehicle.location.coordinates.join(', ')}]</div>
                <div>Created: {formatDate(selectedVehicle.createdAt)}</div>
                <div>Updated: {formatDate(selectedVehicle.updatedAt)}</div>
              </div>
              <button
                onClick={handleUpdateVehicle}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
              >
                Update Vehicle
              </button>
              <button
                onClick={() => setSelectedVehicle(null)}
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
    </div>
  );
};

export default EditVehiclesPanel; 