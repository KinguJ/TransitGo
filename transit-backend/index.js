import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();

app.use(express.json());

// Mount API routes - make sure this is correct
app.use('/api', apiRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transit')
  .then(() => {
    console.log('Connected to MongoDB');
    // Log available routes for debugging
    app._router.stack.forEach(function(r){
      if (r.route && r.route.path){
        console.log(r.route.path)
      }
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 