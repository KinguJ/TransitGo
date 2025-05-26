const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Line = require('../models/Line');
const Stop = require('../models/Stop');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateDocs = async () => {
  try {
    // Use the same MONGO_URI as server.js and seed.js
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Add direction field to Stops that don't have it
    const stopUpdateResult = await Stop.updateMany(
      { direction: { $exists: false } },
      { $set: { direction: 'Both' } }
    );

    // Add direction field to Lines that don't have it
    const lineUpdateResult = await Line.updateMany(
      { direction: { $exists: false } },
      { $set: { direction: 'Outbound' } }
    );

    // Add direction field to Vehicles that don't have it
    const vehicleUpdateResult = await Vehicle.updateMany(
      { direction: { $exists: false } },
      { $set: { direction: 'Outbound' } }
    );

    // Convert stopIds to outboundStops for Lines that don't have it
    const linesWithStopIds = await Line.find({ 
      stopIds: { $exists: true },
      outboundStops: { $exists: false }
    });

    for (const line of linesWithStopIds) {
      await Line.updateOne(
        { _id: line._id },
        { 
          $set: { outboundStops: line.stopIds },
          $unset: { stopIds: "" }
        }
      );
    }

    console.log(`Updated ${stopUpdateResult.modifiedCount} stops`);
    console.log(`Updated ${lineUpdateResult.modifiedCount} lines`);
    console.log(`Updated ${vehicleUpdateResult.modifiedCount} vehicles`);
    console.log(`Migrated stops for ${linesWithStopIds.length} lines`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
};

// Run the migration
migrateDocs(); 