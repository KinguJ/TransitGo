const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: String,
  direction: {
    type: String,
    enum: ['Outbound', 'Inbound', 'Both'],
    default: 'Both'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    } // [longitude, latitude]
  },
  lines: [{
    lineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    orderInRoute: Number
  }]
}, { timestamps: true });

// Add geospatial index for location queries
stopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Stop', stopSchema); 