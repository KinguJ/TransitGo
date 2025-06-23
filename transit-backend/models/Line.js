// transit-backend/models/Line.js
const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema(
  {
    /** e.g. 1, M1, T3 */
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    /** long human-readable name */
    longName: {
      type: String,
      required: true,
      trim: true,
    },

    /** vehicle class the line belongs to */
    type: {
      type: String,
      enum: ['Bus', 'Tram', 'Metro'],
      required: true
    },

    /** specific vehicle assigned to this line */
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false
    },

    /** service direction (rail lines default to Both) */
    direction: {
      type: String,
      enum: ['Outbound', 'Inbound', 'Both'],
      default() {
        return this.type === 'Metro' || this.type === 'Tram'
          ? 'Both'
          : 'Outbound';
      },
    },

    /** ordered list of stops */
    stopIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stop',
      },
    ],

    /** headway table (Times are HH:mm) */
    schedule: {
      firstDeparture: { type: String, required: true },
      lastDeparture:  { type: String, required: true },
      frequency:      { type: String, default: '15' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Line', lineSchema);
