const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Basic error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

// Allow all origins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');

// Basic route to test API is working
app.get('/', (req, res) => {
    res.json({ message: 'Transit API is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        const PORT = process.env.PORT || 5000;
        const HOST = '127.0.0.1';  // Use localhost specifically
        
        app.listen(PORT, HOST, () => {
            console.log(`Server running at http://${HOST}:${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
