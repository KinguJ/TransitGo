const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Metro', 'Bus', 'Tram'],
    required: true
  },
  number: {
    type: String,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  route: {
    destination: String,
    mainStations: [String]
  },
  schedule: {
    frequency: Number, // in minutes
    firstDeparture: String, // HH:mm format
    lastDeparture: String, // HH:mm format
    weekdayOnly: Boolean
  },
  status: {
    type: String,
    enum: ['On Time', 'Delayed', 'Out of Service'],
    default: 'On Time'
  }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
