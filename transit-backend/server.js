const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

// CORS headers middleware
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(express.json());

// Import routes
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const lineRoutes = require('./routes/lineRoutes');
const stopRoutes = require('./routes/stopRoutes');

// Mount routes BEFORE error handlers and 404
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/lines', lineRoutes);
app.use('/api/stops', stopRoutes);

// Basic route to test API is working
app.get('/', (req, res) => {
    res.json({ message: 'Transit API is running' });
});

// Error handling - AFTER routes
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack 
    });
});

// 404 handler - LAST
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.path 
    });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        const PORT = process.env.PORT || 5000;
        const HOST = '127.0.0.1';
        
        app.listen(PORT, HOST, () => {
            console.log(`Server running at http://${HOST}:${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
