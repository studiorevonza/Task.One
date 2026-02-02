const mongoose = require('mongoose');
const { setDbConnected } = require('../utils/dbHelper');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Use local MongoDB for development if MONGO_LOCAL is set to "1", otherwise use Atlas
    const connStr = process.env.MONGO_LOCAL === "1"
      ? 'mongodb://localhost:27017/tasq_one'  // Local MongoDB
      : process.env.MONGO_URI;  // MongoDB Atlas
    
    if (!connStr) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    
    console.log(`Connection String (masked): ${connStr.replace(/:([^:@]+)@/, ':****@')}`);
    
    // Add connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority'
    };
    
    const conn = await mongoose.connect(connStr, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    setDbConnected(true); // Set connection status to true
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('📋 Troubleshooting steps:');
    console.error('  1. Check if MongoDB Atlas cluster is running');
    console.error('  2. Verify IP whitelist includes 0.0.0.0/0');
    console.error('  3. Confirm username/password in MONGO_URI');
    console.error('  4. Check network connectivity');
    console.error('💡 For local development, set MONGO_LOCAL=1 in .env');
    
    // Don't exit the process - let the app continue with in-memory storage
    setDbConnected(false); // Set connection status to false
  }
};

module.exports = connectDB;