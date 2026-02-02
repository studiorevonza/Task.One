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
    
    const conn = await mongoose.connect(connStr);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    setDbConnected(true); // Set connection status to true
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error('💡 Tip: For local development, set MONGO_LOCAL=1 in your .env file to use local MongoDB');
    // Don't exit the process - let the app continue with in-memory storage
    // process.exit(1);  // COMMENTED OUT - don't crash the app
    setDbConnected(false); // Set connection status to false
  }
};

module.exports = connectDB;