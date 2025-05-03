const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Metro', 'Bus', 'Tram'],
    required: true
  },
  number: {
    type: String,
    required: true
  },
  route: {
    destination: {
      type: String,
      required: true
    },
    platform: {
      type: Number,
      required: true
    }
  },
  schedule: {
    frequency: {
      type: Number,  // in minutes
      required: true
    },
    startTime: String,  // HH:mm format
    endTime: String    // HH:mm format
  },
  status: {
    type: String,
    enum: ['On Time', 'Delayed', 'Approaching'],
    default: 'On Time'
  }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
