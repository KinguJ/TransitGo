const mongoose = require('mongoose');
const Stop = require('../models/Stop');
const Line = require('../models/Line');
require('dotenv').config();

// Sample stations in different cities around the world
const sampleStations = [
  // Elazığ, Turkey (from existing seed)
  { name: 'Elazığ Otogar', coordinates: [39.2207, 38.6703] },
  { name: 'Çarşı Merkezi', coordinates: [39.2265, 38.6755] },
  { name: 'Fırat Üniversitesi', coordinates: [39.2125, 38.6811] },
  { name: 'Fethi Sekin Şehir Hastanesi', coordinates: [39.2335, 38.6829] },
  
  // New York City (for testing if user is in NYC area)
  { name: 'Times Square Station', coordinates: [-73.9857, 40.7580] },
  { name: 'Central Park Station', coordinates: [-73.9734, 40.7851] },
  { name: 'Brooklyn Bridge Station', coordinates: [-73.9969, 40.7091] },
  { name: 'JFK Airport Station', coordinates: [-73.7781, 40.6413] },
  
  // London (for testing if user is in London area)
  { name: 'King\'s Cross Station', coordinates: [-0.1240, 51.5308] },
  { name: 'Paddington Station', coordinates: [-0.1759, 51.5154] },
  { name: 'Victoria Station', coordinates: [-0.1448, 51.4952] },
  { name: 'Liverpool Street Station', coordinates: [-0.0815, 51.5178] },
  
  // Default/Test location (can be updated based on your location)
  { name: 'Central Station', coordinates: [0.0, 0.0] },
  { name: 'North Terminal', coordinates: [0.01, 0.01] },
  { name: 'South Hub', coordinates: [-0.01, -0.01] },
  { name: 'East Plaza', coordinates: [0.02, 0.0] }
];

async function quickSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Check if stops already exist
    const existingStops = await Stop.countDocuments();
    
    if (existingStops > 0) {
      console.log(`Database already has ${existingStops} stops. Skipping seed.`);
      console.log('To re-seed, delete existing stops first.');
      process.exit(0);
    }
    
    // Create stops
    const stops = await Stop.insertMany(
      sampleStations.map(station => ({
        name: station.name,
        location: {
          type: 'Point',
          coordinates: station.coordinates
        }
      }))
    );
    
    console.log(`✅ Successfully seeded ${stops.length} stations`);
    
    // Create a sample line
    const sampleLine = await Line.create({
      number: 'E1',
      direction: 'Outbound',
      longName: 'Test Line',
      stopIds: stops.slice(0, 4).map(stop => stop._id),
      schedule: {
        firstDeparture: '06:00',
        lastDeparture: '22:00'
      }
    });
    
    console.log(`✅ Created sample line: ${sampleLine.number}`);
    console.log('\n📍 Sample station locations:');
    stops.forEach(stop => {
      console.log(`   ${stop.name}: [${stop.location.coordinates[1]}, ${stop.location.coordinates[0]}]`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  quickSeed();
}

module.exports = quickSeed; 