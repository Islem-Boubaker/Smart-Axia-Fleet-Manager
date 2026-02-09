const mongoose = require('mongoose');

const connectDB = async () => {
  const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetdb';

  try {
    await mongoose.connect(dbURI);
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); 
  }
};

module.exports = connectDB;
