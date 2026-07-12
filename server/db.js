const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.URI || 'mongodb://127.0.0.1:27017/traveler';
const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/traveler';

async function connectDB() {
  try {
    const maskedURI = URI.includes('@') ? URI.replace(/:[^@]+@/, ':****@') : URI;
    console.log(`Attempting to connect to MongoDB: ${maskedURI}`);
    await mongoose.connect(URI);
  } catch (err) {
    console.error("Primary Database Connection Error:", err.message);
    if (URI !== LOCAL_FALLBACK_URI) {
      console.log(`Attempting local MongoDB fallback: ${LOCAL_FALLBACK_URI}`);
      try {
        await mongoose.disconnect();
        await mongoose.connect(LOCAL_FALLBACK_URI);
      } catch (localErr) {
        console.error("Local Fallback Database Connection Error:", localErr.message);
      }
    }
  }
}

connectDB();

const db = mongoose.connection;

db.on('connected',()=>{
    console.log("Connected to MongoDB")
})
db.on('error',(err)=>{
    // Only log active runtime errors if the connection is established to avoid duplicate/confusing boot-up logs
    if (db.readyState === 1) {
        console.log('Database Connection Error:', err);
    }
})
db.on('disconnect',()=>{
    console.log("Disconnected from MongoDB")
})