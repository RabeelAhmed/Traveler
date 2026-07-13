const mongoose = require('mongoose');
const dns = require('dns');

// Ensure DNS resolution defaults to public DNS servers and IPv4 first to prevent querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Warning: Could not set public DNS servers, using default OS resolution:', err.message);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const URI = process.env.URI || process.env.MONGO_URI;

const connectionOptions = {
  autoIndex: true
};

async function connectDB() {
  if (!URI) {
    console.error("Database Connection Error: Neither 'MONGO_URI' nor 'URI' is defined in the environment.");
    return;
  }

  const maskedURI = URI.includes('@') ? URI.replace(/:[^@]+@/, ':****@') : URI;
  console.log(`Attempting to connect to MongoDB: ${maskedURI}`);

  try {
    await mongoose.connect(URI, connectionOptions);
  } catch (err) {
    console.error("Database Connection Error:", err.message);
    console.error("Full stack trace:\n", err.stack);
  }
}

connectDB();

const db = mongoose.connection;

db.on('connected',()=>{
    console.log("✓ MongoDB Connected")
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