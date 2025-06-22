/**
 * Seed file for the "transit-cards" collection.
 * Usage:  node scripts/seedTransitCards.js
 *
 * Assumes you already have:
 *   - a User model in  models/User.js
 *   - a Card  model in  models/Card.js   (see schema below)
 *   - MongoDB connection via mongoose.connect()
 *
 * Card schema reference:
 *   {
 *     userId:    ObjectId,    // owner
 *     name:      String,      // e.g. "Primary Card"
 *     cardNumber:String,      // 16-digit, no spaces
 *     balance:   Number,      // starting balance in currency units
 *     expiryDate:Date,
 *     createdAt: Date,
 *     updatedAt: Date
 *   }
 */

const mongoose = require('mongoose');
require('dotenv').config();           // NEW: load .env first
const User  = require('../models/User');
const Card  = require('../models/Card');

// Utility to build a pseudo-random 16-digit card number as a string
const makeCardNumber = () =>
  Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('🌐 Mongo connected');

    // 1️⃣  Get the admin user you pasted in the prompt
    const admin = await User.findOne({ email: 'celal.alkadi@gmail.com' });
    if (!admin) {
      console.error('⚠️  Admin user not found – aborting.');
      return mongoose.connection.close();
    }

    // 2️⃣  Wipe any existing cards for a clean slate (optional)
    await Card.deleteMany({ userId: admin._id });

    // 3️⃣  Seed a few cards – all vehicles cost the same, so just give one fare balance
    const seedCards = [
      {
        userId:    admin._id,
        name:      'Primary Card',
        cardNumber: makeCardNumber(),
        balance:   100,                 // starting balance ₺
        expiryDate:new Date('2027-12-31'),
      },
      {
        userId:    admin._id,
        name:      'Backup Card',
        cardNumber: makeCardNumber(),
        balance:   50,
        expiryDate:new Date('2027-12-31'),
      }
    ];

    // Stamp metadata
    const now = new Date();
    seedCards.forEach(c => { c.createdAt = c.updatedAt = now; });

    await Card.insertMany(seedCards);
    console.log(`✅  Inserted ${seedCards.length} transit cards for ${admin.name}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding cards:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

seed();
