// models/Card.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CardSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      default: 'Transit Card'
    },
    cardNumber: {
      type: String,
      unique: true,
      required: true,
      minlength: 16,
      maxlength: 16
    },
    balance: {
      type: Number,
      default: 0
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', CardSchema);
