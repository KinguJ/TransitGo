const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  longName: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ['Outbound', 'Inbound'],
    required: true
  },
  stopIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  }],
  schedule: {
    firstDeparture: {
      type: String,
      required: true
    },
    lastDeparture: {
      type: String,
      required: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Line', lineSchema); 