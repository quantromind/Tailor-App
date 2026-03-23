const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard summary statistics and recent orders
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch all orders for the user to compute stats
        const allOrders = await Order.find({ createdBy: userId }).populate('design');

        let totalOrders = allOrders.length;
        let pendingCount = 0;
        let completedCount = 0;
        let revenue = 0; // Requires a price field on Design or Order. We'll extract price from notes or use a default if not fully structured yet.

        allOrders.forEach(order => {
            if (order.status === 'pending' || order.status === 'in-progress') {
                pendingCount++;
            } else if (order.status === 'completed' || order.status === 'delivered') {
                completedCount++;
            }
            
            // Try to extract price from notes like "Delivery Date: 20 March, Price: ₹350"
            const priceMatch = order.notes?.match(/Price:\s?[₹$€]?\s?(\d+)/i);
            if (priceMatch && priceMatch[1]) {
                revenue += parseInt(priceMatch[1], 10);
            }
        });

        // Fetch the 5 most recent orders
        const recentOrders = await Order.find({ createdBy: userId })
            .populate('customer')
            .populate('design')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            stats: {
                totalOrders,
                pendingOrders: pendingCount,
                completedOrders: completedCount,
                revenue
            },
            recentOrders
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
