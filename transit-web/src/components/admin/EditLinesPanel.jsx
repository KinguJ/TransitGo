import React, { useState, useRef, useEffect } from 'react';
import { FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import axios from '../../utils/axios';
import { getRouteCoordinates } from '../../utils/osrm';
import L from 'leaflet';

const EditLinesPanel = ({ onDone, lines, setLines, stops, onLineSelect, selectedLineId, panelMode, selectedStopId }) => {
  const [mode, setMode] = useState('add');
  const [isSelectingStops, setIsSelectingStops] = useState(false);
  const [currentLine, setCurrentLine] = useState({
    number: '',
    longName: '',
    direction: 'Outbound',
    stopIds: [],
    schedule: {
      firstDeparture: '06:00',
      lastDeparture: '23:00'
    }
  });
  const [selectedLine, setSelectedLine] = useState(null);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setSelectedLine(null);
    setMode('add');
    onLineSelect(null, []);
  }, [panelMode]);

  useEffect(() => {
    if (selectedStopId && isSelectingStops) {
      handleAddStop(selectedStopId);
    }
  }, [selectedStopId]);

  useEffect(() => {
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (mode === 'add') {
      if (name.startsWith('schedule.')) {
        const scheduleField = name.split('.')[1];
        setCurrentLine(prev => ({
          ...prev,
          schedule: { ...prev.schedule, [scheduleField]: value }
        }));
      } else {
        setCurrentLine(prev => ({ ...prev, [name]: value }));
      }
    } else if (selectedLine) {
      if (name.startsWith('schedule.')) {
        const scheduleField = name.split('.')[1];
        setSelectedLine(prev => ({
          ...prev,
          schedule: { ...prev.schedule, [scheduleField]: value }
        }));
      } else {
        setSelectedLine(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleAddStop = (stopId) => {
    if (!stopId || stopId === '') return;
    
    const line = mode === 'add' ? currentLine : selectedLine;
    if (line.stopIds.includes(stopId)) return; // Prevent duplicates

    if (mode === 'add') {
      setCurrentLine(prev => ({
        ...prev,
        stopIds: [...prev.stopIds, stopId]
      }));
    } else if (selectedLine) {
      setSelectedLine(prev => ({
        ...prev,
        stopIds: [...prev.stopIds, stopId]
      }));
    }
  };

  const handleRemoveStop = (index) => {
    if (mode === 'add') {
      setCurrentLine(prev => ({
        ...prev,
        stopIds: prev.stopIds.filter((_, i) => i !== index)
      }));
    } else if (selectedLine) {
      setSelectedLine(prev => ({
        ...prev,
        stopIds: prev.stopIds.filter((_, i) => i !== index)
      }));
    }
  };

  const handleMoveStop = (index, direction) => {
    const moveItem = (arr, from, to) => {
      const newArr = [...arr];
      const [item] = newArr.splice(from, 1);
      newArr.splice(to, 0, item);
      return newArr;
    };

    if (mode === 'add') {
      setCurrentLine(prev => ({
        ...prev,
        stopIds: moveItem(prev.stopIds, index, index + direction)
      }));
    } else if (selectedLine) {
      setSelectedLine(prev => ({
        ...prev,
        stopIds: moveItem(prev.stopIds, index, index + direction)
      }));
    }
  };

  const handleAddLine = async () => {
    try {
      if (!currentLine.number || !currentLine.longName || currentLine.stopIds.length < 2) {
        setError('Please fill all required fields and add at least 2 stops');
        return;
      }

      const response = await axios.post('/api/lines', currentLine);
      setLines(prev => [...prev, response.data]);
      setCurrentLine({
        number: '',
        longName: '',
        direction: 'Outbound',
        stopIds: [],
        schedule: {
          firstDeparture: '06:00',
          lastDeparture: '23:00'
        }
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add line');
    }
  };

  const handleUpdateLine = async () => {
    try {
      if (!selectedLine.number || !selectedLine.longName || selectedLine.stopIds.length < 2) {
        setError('Please fill all required fields and add at least 2 stops');
        return;
      }

      const response = await axios.patch(`/api/lines/${selectedLine._id}`, selectedLine);
      setLines(prevLines => prevLines.map(line => 
        line._id === selectedLine._id ? response.data : line
      ));
      setSelectedLine(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update line');
    }
  };

  const handleDeleteLine = async (lineId) => {
    try {
      await axios.delete(`/api/lines/${lineId}`);
      setLines(prevLines => prevLines.filter(line => line._id !== lineId));
      setSelectedLine(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete line');
    }
  };

  const getStopName = (stopId) => {
    const stop = stops.find(s => s._id === stopId);
    return stop ? stop.name : 'Unknown Stop';
  };

  const handleSelectLine = async (line) => {
    setSelectedLine(line);

    // 1 · collect WGS84 points for this line, in order
    const pts = line.stopIds.map(id => {
      const s = stops.find(st => st._id === id);
      return [s.location.coordinates[1], s.location.coordinates[0]]; // [lat,lng]
    });

    // 2 · fetch snapped route from OSRM
    let path = [];
    try { 
      path = await getRouteCoordinates(pts); 
    } catch { 
      path = pts; 
    }

    // 3 · bubble up BOTH the id & ready-to-draw polyline
    onLineSelect(line._id, path);
    setError(null);
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setSelectedLine(null);
    onLineSelect(null, []);
  };

  const toggleStopSelection = () => {
    setIsSelectingStops(!isSelectingStops);
  };

  const renderStopsSection = (line) => (
    <div className="mt-4">
      <h4 className="font-medium mb-2">Stops</h4>
      <div className="flex gap-2 mb-2">
        <select
          onChange={(e) => handleAddStop(e.target.value)}
          value=""
          className="flex-1 p-2 border rounded"
          disabled={isSelectingStops}
        >
          <option value="">Select a stop</option>
          {stops.map(stop => (
            <option key={stop._id} value={stop._id}>
              {stop.name}
            </option>
          ))}
        </select>
        <button
          onClick={toggleStopSelection}
          className={`px-3 py-1 rounded ${
            isSelectingStops 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}
        >
          {isSelectingStops ? 'Done' : 'Pick on Map'}
        </button>
      </div>
      
      {isSelectingStops && (
        <div className="text-sm text-blue-600 mb-2">
          Click stops on the map to add them to the line
        </div>
      )}
      
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {line.stopIds.map((stopId, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <span>{getStopName(stopId)}</span>
            <div className="flex space-x-1">
              {index > 0 && (
                <button
                  onClick={() => handleMoveStop(index, -1)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <FaArrowUp />
                </button>
              )}
              {index < line.stopIds.length - 1 && (
                <button
                  onClick={() => handleMoveStop(index, 1)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <FaArrowDown />
                </button>
              )}
              <button
                onClick={() => handleRemoveStop(index)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLineForm = (line) => (
    <div className="space-y-2">
      <input
        type="text"
        name="number"
        value={line.number}
        onChange={handleInputChange}
        placeholder="Line number (e.g., 1, M1, T3)"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="longName"
        value={line.longName}
        onChange={handleInputChange}
        placeholder="Line name (e.g., Central - Airport)"
        className="w-full p-2 border rounded"
      />
      <select
        name="direction"
        value={line.direction}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
      >
        <option value="Outbound">Outbound</option>
        <option value="Inbound">Inbound</option>
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          name="schedule.firstDeparture"
          value={line.schedule.firstDeparture}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="time"
          name="schedule.lastDeparture"
          value={line.schedule.lastDeparture}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
      </div>
      
      {renderStopsSection(line)}
    </div>
  );

  return (
    <div 
      ref={panelRef}
      className="absolute right-4 top-16 bg-white p-6 rounded-lg shadow-lg min-w-[300px] max-w-[400px] z-[1000] overflow-y-auto max-h-[80vh]"
    >
      <h3 className="text-lg font-semibold mb-4">Manage Lines</h3>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => handleModeSwitch('add')}
          className={`px-3 py-1 rounded flex-1 ${mode === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Add New Line
        </button>
        <button
          onClick={() => handleModeSwitch('edit')}
          className={`px-3 py-1 rounded flex-1 ${mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Edit Lines
        </button>
      </div>
      
      {mode === 'add' && (
        <div className="mb-4 space-y-2">
          {renderLineForm(currentLine)}
          <button
            onClick={handleAddLine}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full mt-4"
          >
            Add Line
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="mb-4">
          {!selectedLine ? (
            <div className="max-h-[300px] overflow-y-auto">
              {lines.map(line => (
                <div 
                  key={line._id}
                  onClick={() => handleSelectLine(line)}
                  className={`p-2 hover:bg-gray-100 cursor-pointer rounded flex justify-between items-center
                    ${line._id === selectedLineId ? 'bg-blue-50 border border-blue-200' : ''}`}
                >
                  <div>
                    <div className="font-medium">Line {line.number}</div>
                    <div className="text-sm text-gray-600">{line.longName}</div>
                    <div className="text-xs text-gray-500">
                      {line.schedule.firstDeparture} - {line.schedule.lastDeparture}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLine(line._id);
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
                ID: {selectedLine._id}
              </div>
              {renderLineForm(selectedLine)}
              <button
                onClick={handleUpdateLine}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full mt-4"
              >
                Update Line
              </button>
              <button
                onClick={() => setSelectedLine(null)}
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

export default EditLinesPanel; 