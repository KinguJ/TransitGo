const mongoose = require('mongoose');
const Line = require('../models/Line');
const Stop = require('../models/Stop');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transit', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedLines = async () => {
  try {
    // Get some existing stops for the lines
    const stops = await Stop.find().limit(10);
    
    if (stops.length < 4) {
      console.log('Not enough stops found. Please run stop seeder first.');
      return;
    }

    // Clear existing lines
    await Line.deleteMany({});
    console.log('Cleared existing lines');

    // Sample lines to create
    const sampleLines = [
      {
        number: '1',
        longName: 'Central Station - Airport',
        type: 'Bus',
        direction: 'Outbound',
        stopIds: [stops[0]._id, stops[1]._id, stops[2]._id, stops[3]._id],
        schedule: {
          firstDeparture: '06:00',
          lastDeparture: '23:00',
          frequency: '15'
        }
      },
      {
        number: '1',
        longName: 'Airport - Central Station',
        type: 'Bus',
        direction: 'Inbound',
        stopIds: [stops[3]._id, stops[2]._id, stops[1]._id, stops[0]._id],
        schedule: {
          firstDeparture: '06:15',
          lastDeparture: '23:15',
          frequency: '15'
        }
      },
      {
        number: 'M1',
        longName: 'Metro Line 1 - East-West Corridor',
        type: 'Metro',
        direction: 'Both',
        stopIds: [stops[4]._id, stops[5]._id, stops[6]._id, stops[7]._id],
        schedule: {
          firstDeparture: '05:30',
          lastDeparture: '00:30',
          frequency: '5'
        }
      },
      {
        number: 'T1',
        longName: 'Tram Line 1 - City Circle',
        type: 'Tram',
        direction: 'Both',
        stopIds: [stops[6]._id, stops[7]._id, stops[8]._id, stops[9]._id],
        schedule: {
          firstDeparture: '06:00',
          lastDeparture: '22:00',
          frequency: '10'
        }
      },
      {
        number: '2',
        longName: 'University - Shopping Mall',
        type: 'Bus',
        direction: 'Outbound',
        stopIds: [stops[1]._id, stops[5]._id, stops[8]._id],
        schedule: {
          firstDeparture: '07:00',
          lastDeparture: '21:00',
          frequency: '20'
        }
      },
      {
        number: '2',
        longName: 'Shopping Mall - University',
        type: 'Bus',
        direction: 'Inbound',
        stopIds: [stops[8]._id, stops[5]._id, stops[1]._id],
        schedule: {
          firstDeparture: '07:10',
          lastDeparture: '21:10',
          frequency: '20'
        }
      }
    ];

    // Create the lines
    const createdLines = await Line.insertMany(sampleLines);
    
    console.log(`✅ Created ${createdLines.length} sample lines:`);
    createdLines.forEach(line => {
      const icon = line.type === 'Metro' ? '🚇' : line.type === 'Tram' ? '🚋' : '🚌';
      console.log(`   ${icon} Line ${line.number} (${line.type}) - ${line.longName}`);
    });

    console.log('\n📋 Summary:');
    console.log(`   🚌 Bus lines: ${createdLines.filter(l => l.type === 'Bus').length}`);
    console.log(`   🚇 Metro lines: ${createdLines.filter(l => l.type === 'Metro').length}`);
    console.log(`   🚋 Tram lines: ${createdLines.filter(l => l.type === 'Tram').length}`);

  } catch (error) {
    console.error('Error seeding lines:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedLines(); 