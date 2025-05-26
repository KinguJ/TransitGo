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
    const { number, longName, direction, stopIds, schedule } = req.body;
    
    const newLine = await Line.create({
      number,
      longName,
      direction,
      stopIds,
      schedule: {
        firstDeparture: schedule.firstDeparture,
        lastDeparture: schedule.lastDeparture
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
    const { number, longName, direction, stopIds, schedule } = req.body;
    
    const updatedLine = await Line.findByIdAndUpdate(
      req.params.id,
      {
        number,
        longName,
        direction,
        stopIds,
        schedule
      },
      { new: true }
    );

    if (!updatedLine) {
      return res.status(404).json({ message: 'Line not found' });
    }

    res.json(updatedLine);
  } catch (error) {
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