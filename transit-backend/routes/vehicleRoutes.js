const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle'); // path to your Vehicle model

// GET /api/vehicles
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        console.log('Sending vehicles:', vehicles); // Debug what's being sent
        res.json(vehicles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
