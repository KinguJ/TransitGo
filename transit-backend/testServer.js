const express = require('express');
const app = express();

// Most basic possible route
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
});

// Get your IP address
const os = require('os');
const networkInterfaces = os.networkInterfaces();
console.log('Available network interfaces:', networkInterfaces);

const PORT = 5000;
const HOST = '127.0.0.1';  // Try localhost specifically

app.listen(PORT, HOST, () => {
    console.log(`Test server running at http://${HOST}:${PORT}`);
});