const express = require('express');
const router = express.Router();
const Line = require('../models/Line');
const Vehicle = require('../models/Vehicle');

// Add a test route
router.get('/test', (req, res) => {
    res.json({ message: 'Line routes working' });
});

// Get all lines
router.get('/', async (req, res) => {
  try {
    const lines = await Line.find();
    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a line
router.post('/', async (req, res) => {
  try {
    const { number, longName, type, direction, stopIds, schedule, vehicle } = req.body;
    
    const newLine = await Line.create({
      number,
      longName,
      type,
      direction: direction || 
        (['Metro', 'Tram'].includes(type) 
          ? 'Both' 
          : 'Outbound'),
      vehicle: vehicle || undefined,
      stopIds,
      schedule: {
        firstDeparture: schedule.firstDeparture,
        lastDeparture: schedule.lastDeparture,
        frequency: schedule.frequency
      }
    });

    res.status(201).json(newLine);
  } catch (error) {
    console.error('Error creating line:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update line
router.patch('/:id', async (req, res) => {
  try {
    const line = await Line.findById(req.params.id);
    if (!line) {
      return res.status(404).json({ message: 'Line not found' });
    }

    const { type, direction, vehicle } = req.body;

    // Handle type change and auto-adjust direction for rail classes
    if (type) {
      line.type = type;
      if (['Metro', 'Tram'].includes(type)) {
        line.direction = 'Both';
      } else if (direction) {
        line.direction = direction; // allow manual change for Bus
      }
    } else if (direction) {
      line.direction = direction;
    }

    // Handle vehicle assignment
    if (vehicle !== undefined) {
      line.vehicle = vehicle || undefined;
    }

    // Copy the rest of the fields
    Object.assign(line, {
      number: req.body.number,
      longName: req.body.longName,
      stopIds: req.body.stopIds,
      schedule: req.body.schedule
    });

    await line.save();
    res.json(line);
  } catch (error) {
    console.error('Error updating line:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete line
router.delete('/:id', async (req, res) => {
  try {
    const deletedLine = await Line.findByIdAndDelete(req.params.id);
    if (!deletedLine) {
      return res.status(404).json({ message: 'Line not found' });
    }
    res.json({ message: 'Line deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific line
router.get('/:id', async (req, res) => {
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

// Get vehicles for specific line
router.get('/:id/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ lineId: req.params.id });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 