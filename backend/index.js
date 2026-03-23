const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS for robust MongoDB SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const designRoutes = require('./routes/design');
const orderRoutes = require('./routes/order');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/debug/test', (req, res) => {
    console.log('[DEBUG] Test endpoint reached!');
    res.json({ message: 'Debug test success' });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
