const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    try {
      // Access the users collection
      const collection = mongoose.connection.collection('users');
      
      // Drop the old username_1 index
      await collection.dropIndex('username_1');
      console.log('Successfully dropped old username index');
      
      // Drop the email_1 index too just in case it causes the same issue
      await collection.dropIndex('email_1');
      console.log('Successfully dropped old email index');
      
    } catch (err) {
      console.log('Index drop result:', err.message);
    } finally {
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
