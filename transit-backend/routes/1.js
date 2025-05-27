const express = require('express');
const router = express.Router();
const Stop = require('../models/Stop');
const Vehicle = require('../models/Vehicle');
const Line = require('../models/Line');

// Add at the top of the file
router.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// Stops API
router.post('/stops/bulk', async (req, res) => {
  try {
    const docs = req.body.stops.map(s => ({
      name: s.name,
      location: {
        type: 'Point',
        coordinates: [s.lng, s.lat]
      }
    }));
    const inserted = await Stop.insertMany(docs);
    res.json(inserted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stops', async (req, res) => {
  try {
    const stops = await Stop.find();
    res.json(stops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check for nearby stops before creating new ones
router.get('/stops/nearby', async (req, res) => {
  try {
    const { lng, lat } = req.query;
    const nearbyStops = await Stop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 20 // 20 meters
        }
      }
    });
    res.json(nearbyStops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lines API
router.get('/lines', async (req, res) => {
  try {
    const lines = await Line.find().populate('stopIds');
    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lines', async (req, res) => {
  try {
    const line = await Line.create({
      number: req.body.number,
      direction: req.body.direction,
      longName: req.body.longName,
      stopIds: req.body.stopIds,
      schedule: {
        frequency: req.body.schedule.frequency,
        firstDeparture: req.body.schedule.firstDeparture,
        lastDeparture: req.body.schedule.lastDeparture,
        weekdayOnly: req.body.schedule.weekdayOnly
      }
    });
    res.json(line);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicles API
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('lineId');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const vehicle = await Vehicle.create({
      type: req.body.type,
      number: req.body.number,
      location: {
        type: 'Point',
        coordinates: [req.body.location.longitude, req.body.location.latitude]
      },
      lineId: req.body.lineId,
      status: req.body.status || 'On Time'
    });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Additional useful routes

// Get a specific line with its stops
router.get('/lines/:id', async (req, res) => {
  try {
    const line = await Line.findById(req.params.id).populate('stopIds');
    if (!line) {
      return res.status(404).json({ error: 'Line not found' });
    }
    res.json(line);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vehicles for a specific line
router.get('/lines/:id/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ lineId: req.params.id });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle location
router.patch('/vehicles/:id/location', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        location: {
          type: 'Point',
          coordinates: [req.body.longitude, req.body.latitude]
        }
      },
      { new: true }
    );
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 