const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
require('dotenv').config();

const vehicles = [
  // Metro Lines
  {
    type: 'Metro',
    number: 'M1',
    location: {
      latitude: 51.5074,
      longitude: -0.1278
    },
    route: {
      destination: 'Airport Terminal',
      mainStations: ['Central Station', 'Business District', 'Shopping Center', 'Airport']
    },
    schedule: {
      frequency: 15,
      firstDeparture: '05:00',
      lastDeparture: '23:45',
      weekdayOnly: false
    }
  },
  {
    type: 'Metro',
    number: 'M2',
    location: {
      latitude: 51.5080,
      longitude: -0.1290
    },
    route: {
      destination: 'University Campus',
      mainStations: ['Central Station', 'Sports Complex', 'Library', 'University']
    },
    schedule: {
      frequency: 10,
      firstDeparture: '05:30',
      lastDeparture: '22:30',
      weekdayOnly: true
    }
  },

  // Bus Routes
  {
    type: 'Bus',
    number: 'B42',
    location: {
      latitude: 51.5090,
      longitude: -0.1280
    },
    route: {
      destination: 'Shopping District',
      mainStations: ['Central Hub', 'Market Square', 'Mall Center', 'Shopping District']
    },
    schedule: {
      frequency: 30,
      firstDeparture: '06:00',
      lastDeparture: '21:00',
      weekdayOnly: false
    }
  },
  {
    type: 'Bus',
    number: 'B15',
    location: {
      latitude: 51.5100,
      longitude: -0.1270
    },
    route: {
      destination: 'Residential Area',
      mainStations: ['Central Station', 'Park View', 'Hospital', 'Residential Complex']
    },
    schedule: {
      frequency: 20,
      firstDeparture: '05:45',
      lastDeparture: '22:15',
      weekdayOnly: false
    }
  },

  // Tram Lines
  {
    type: 'Tram',
    number: 'T7',
    location: {
      latitude: 51.5085,
      longitude: -0.1275
    },
    route: {
      destination: 'Entertainment District',
      mainStations: ['Central Station', 'Theater', 'Cinema Complex', 'Concert Hall']
    },
    schedule: {
      frequency: 15,
      firstDeparture: '06:30',
      lastDeparture: '23:30',
      weekdayOnly: false
    }
  },
  {
    type: 'Tram',
    number: 'T3',
    location: {
      latitude: 51.5095,
      longitude: -0.1265
    },
    route: {
      destination: 'Sports Complex',
      mainStations: ['Central Hub', 'Stadium', 'Arena', 'Sports Center']
    },
    schedule: {
      frequency: 25,
      firstDeparture: '07:00',
      lastDeparture: '21:00',
      weekdayOnly: true
    }
  }
];

// Updated seedDatabase function
async function seedDatabase() {
  try {
    // Use the same MONGO_URI as server.js
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Clear existing vehicles
    await Vehicle.deleteMany({});
    
    // Insert new vehicles
    await Vehicle.insertMany(vehicles);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 