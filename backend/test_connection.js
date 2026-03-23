const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Attempt to use Google DNS to bypass local ISP / Windows DNS issues blocking SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log('Testing connection to:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Could not connect to MongoDB:', err);
    process.exit(1);
  });
