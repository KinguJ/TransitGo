const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Bus', 'Metro', 'Tram'],
    required: true
  },
  number: {
    type: String,
    required: true,
    unique: true
  },
  lineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Line',
    required: true
  },
  direction: {
    type: String,
    enum: ['Outbound', 'Inbound'],
    default: 'Outbound'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]  // [longitude, latitude]
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  }
}, { timestamps: true });

vehicleSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vehicle', vehicleSchema);
