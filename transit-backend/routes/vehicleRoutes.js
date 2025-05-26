const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// Add a test route
router.get('/test', (req, res) => {
    res.json({ message: 'Vehicle routes working' });
});

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a vehicle
router.post('/', async (req, res) => {
  try {
    const { number, type, lineId, status } = req.body;
    
    // Create new vehicle with default location
    const newVehicle = await Vehicle.create({
      number,
      type,
      lineId,
      status,
      location: {
        type: 'Point',
        coordinates: [39.223, 38.677] // Default coordinates
      }
    });

    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle
router.patch('/:id', async (req, res) => {
  try {
    const { number, type, lineId, status } = req.body;
    
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { number, type, lineId, status },
      { new: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deletedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
