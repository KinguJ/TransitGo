const express = require('express');
const router = express.Router();
const Stop = require('../models/Stop');

// Add a test route
router.get('/test', (req, res) => {
    res.json({ message: 'Stop routes working' });
});

// Get all stops
router.get('/', async (req, res) => {
  try {
    const stops = await Stop.find();
    res.json(stops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby stops (useful for validation)
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat } = req.query;
    const nearbyStops = await Stop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 10000 // 20 meters
        }
      }
    }).limit(4);
    res.json(nearbyStops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the single closest stop
router.get('/nearest', async (req, res) => {
  try {
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat ?? req.query.alt);

    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      return res.status(400).json({ error: 'lng and lat/alt are required' });
    }

    // Use the same approach as /nearby but limit to 1 result
    const [nearest] = await Stop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 10000 // 10km in meters
        }
      }
    }).limit(1);

    if (!nearest) {
      return res.status(404).json({ message: 'No stop found' });
    }
    res.json(nearest);
  } catch (err) {
    console.error('Error in /nearest:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create new stop
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;
    
    // Validate location data
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid location data' });
    }

    const stop = await Stop.create({
      name,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      }
    });
    res.status(201).json(stop);
  } catch (error) {
    console.error('Error creating stop:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update stop name
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Updating stop name:', req.params.id, 'with:', name);
    
    const stop = await Stop.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    
    res.json(stop);
  } catch (error) {
    console.error('Error updating stop:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update stop location
router.patch('/:id/location', async (req, res) => {
  try {
    const { lng, lat } = req.body;
    const stop = await Stop.findByIdAndUpdate(
      req.params.id,
      {
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      },
      { new: true }
    );
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    res.json(stop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stop direction
router.patch('/:id', async (req, res) => {
  try {
    const { direction } = req.body;
    
    if (!['Outbound', 'Inbound', 'Both'].includes(direction)) {
      return res.status(400).json({ message: 'Invalid direction' });
    }

    const stop = await Stop.findByIdAndUpdate(
      req.params.id,
      { direction },
      { new: true }
    );

    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    res.json(stop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete stop
router.delete('/:id', async (req, res) => {
  try {
    const stop = await Stop.findByIdAndDelete(req.params.id);
    if (!stop) {
      return res.status(404).json({ message: 'Stop not found' });
    }
    res.json({ message: 'Stop deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 