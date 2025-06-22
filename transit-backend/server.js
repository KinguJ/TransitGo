const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Add this after your CORS middleware
app.use((req, res, next) => {
    console.log('Request headers:', req.headers);
    console.log('Request method:', req.method);
    next();
});

app.use(express.json());

// Import routes
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const lineRoutes = require('./routes/lineRoutes');
const stopRoutes = require('./routes/stopRoutes');
const cardRoutes = require('./routes/cardRoutes');

// Mount routes BEFORE error handlers and 404
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/lines', lineRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/cards', cardRoutes);

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
        const startServer = (port) => {
            app.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
            }).on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(`Port ${port} is busy, trying ${port + 1}`);
                    startServer(port + 1);
                } else {
                    console.error('Server error:', err);
                }
            });
        };
        
        startServer(5000);
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
