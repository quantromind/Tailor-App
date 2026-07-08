const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const designRoutes = require('./routes/design');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscription', subscriptionRoutes); // singular alias to match REST spec naming

app.get('/api/debug/test', (req, res) => {
    console.log('[DEBUG] Test endpoint reached!');
    res.json({
        message: 'Debug test success',
        version: '2.0.0',
        deployedAt: '2026-06-30',
        routes: ['auth', 'customers', 'designs', 'orders', 'payment', 'subscriptions']
    });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Global error handler — catches PayloadTooLargeError and other unhandled Express errors
// so the server never crashes on a single bad request.
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'Request payload is too large. If you are uploading an image, please reduce its size and try again.',
        });
    }
    console.error('[Server Error]', err.message || err);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
