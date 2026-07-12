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

const URI_VAR_NAME = 'URI';
const URI = process.env[URI_VAR_NAME];

const LOCAL_FALLBACK_VAR_NAME = 'MONGO_URI';
const LOCAL_FALLBACK_URI = process.env[LOCAL_FALLBACK_VAR_NAME];

const connectionOptions = {
  autoIndex: true
};

async function connectDB() {
  if (!URI) {
    console.error(`Database Connection Error: Environment variable '${URI_VAR_NAME}' is not defined.`);
    return;
  }

  const maskedURI = URI.includes('@') ? URI.replace(/:[^@]+@/, ':****@') : URI;
  console.log(`Attempting to connect to MongoDB using variable '${URI_VAR_NAME}': ${maskedURI}`);
  console.log('Connection options used:', JSON.stringify(connectionOptions, null, 2));

  try {
    await mongoose.connect(URI, connectionOptions);
  } catch (err) {
    console.error(`Primary Database Connection Error (read from '${URI_VAR_NAME}'):`, err.message);
    console.error("Full stack trace:\n", err.stack);

    if (LOCAL_FALLBACK_URI && URI !== LOCAL_FALLBACK_URI) {
      const maskedFallback = LOCAL_FALLBACK_URI.includes('@') ? LOCAL_FALLBACK_URI.replace(/:[^@]+@/, ':****@') : LOCAL_FALLBACK_URI;
      console.log(`Attempting local MongoDB fallback using variable '${LOCAL_FALLBACK_VAR_NAME}': ${maskedFallback}`);
      try {
        await mongoose.disconnect();
        await mongoose.connect(LOCAL_FALLBACK_URI, connectionOptions);
      } catch (localErr) {
        console.error(`Local Fallback Database Connection Error (read from '${LOCAL_FALLBACK_VAR_NAME}'):`, localErr.message);
        console.error("Local Fallback stack trace:\n", localErr.stack);
      }
    } else {
      console.log(`No fallback attempted: '${LOCAL_FALLBACK_VAR_NAME}' environment variable is not defined or matches primary URI.`);
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