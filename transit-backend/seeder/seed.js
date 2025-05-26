import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Schema, model } = mongoose;

/* ---------- 1. SCHEMAS -------------------------------------------------- */

const stopSchema = new Schema({
  name: { type: String, required: true },
  code: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
}, { timestamps: true });
stopSchema.index({ location: '2dsphere' });

const lineSchema = new Schema({
  number:     { type: String, required: true },      // E1
  direction:  { type: String, required: true },      // Outbound / Inbound
  longName:   String,
  stopIds:    [{ type: Schema.Types.ObjectId, ref: 'Stop', required: true }],
  schedule:   {
    frequency:     Number,   // minutes
    firstDeparture:String,   // "06:00"
    lastDeparture: String,   // "21:00"
    weekdayOnly:   Boolean,
  },
}, { timestamps: true });

const vehicleSchema = new Schema({
  type:      String,                                 // Bus
  number:    String,                                 // fleet label
  lineId:    { type: Schema.Types.ObjectId, ref: 'Line' },
  location:  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],                           // [lng, lat]
  },
  status:    { type: String, default: 'On Time' },
}, { timestamps: true });

const Stop    = model('Stop',    stopSchema);
const Line    = model('Line',    lineSchema);
const Vehicle = model('Vehicle', vehicleSchema);

async function seedDatabase() {
  try {
    // Use the same MONGO_URI as server.js
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    await Promise.all([ Stop.deleteMany(), Line.deleteMany(), Vehicle.deleteMany() ]);

    /* ---------- 3. INSERT STOPS (Elazığ coords) ----------------------------- */
    const stops = await Stop.insertMany([
      { name: 'Elazığ Otogar',                // coach station
        location:{ coordinates:[39.2207, 38.6703] } },
      { name: 'Çarşı Merkezi',                // city centre
        location:{ coordinates:[39.2265, 38.6755] } },
      { name: 'Fırat Üniversitesi',           // university
        location:{ coordinates:[39.2125, 38.6811] } },
      { name: 'Fethi Sekin Şehir Hastanesi',  // city hospital
        location:{ coordinates:[39.2335, 38.6829] } },
    ]);

    const id = Object.fromEntries(stops.map(s => [s.name, s._id]));

    /* ---------- 4. INSERT LINES (outbound & inbound) ------------------------ */
    const lines = await Line.insertMany([
      {
        number:    'E1',
        direction: 'Outbound',
        longName:  'Otogar → Şehir Hastanesi',
        stopIds:   [
          id['Elazığ Otogar'],
          id['Çarşı Merkezi'],
          id['Fırat Üniversitesi'],
          id['Fethi Sekin Şehir Hastanesi'],
        ],
        schedule:  { frequency: 20, firstDeparture:'06:00', lastDeparture:'22:00', weekdayOnly:false },
      },
      {
        number:    'E1',
        direction: 'Inbound',
        longName:  'Şehir Hastanesi → Otogar',
        stopIds:   [
          id['Fethi Sekin Şehir Hastanesi'],
          id['Fırat Üniversitesi'],
          id['Çarşı Merkezi'],
          id['Elazığ Otogar'],
        ],
        schedule:  { frequency: 20, firstDeparture:'06:20', lastDeparture:'22:20', weekdayOnly:false },
      },
    ]);

    /* ---------- 5. INSERT TWO SAMPLE BUSES ---------------------------------- */
    await Vehicle.insertMany([
      { type:'Bus', number:'E1-01', lineId:lines[0]._id,
        location:{ coordinates:[39.2230, 38.6770] } },           // somewhere on route
      { type:'Bus', number:'E1-02', lineId:lines[1]._id,
        location:{ coordinates:[39.2300, 38.6815] } },
    ]);

    console.log('Seed completed ⇒',
      { stops: stops.length, lines: lines.length, vehicles: 2 });
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase(); 