const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new order (with customer, design, and dynamic measurements)
router.post('/', auth, async (req, res) => {
    const { customer, design, measurements, notes } = req.body;

    try {
        const order = new Order({
            customer,
            design,
            measurements: measurements || [],
            notes: notes || '',
            createdBy: req.user.userId
        });

        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('customer')
            .populate('design');

        res.status(201).json(populatedOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all orders for the logged-in tailor
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ createdBy: req.user.userId })
            .populate('customer')
            .populate('design')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single order by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer')
            .populate('design');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
            .populate('customer')
            .populate('design');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an order (measurements, notes)
router.put('/:id', auth, async (req, res) => {
    const { measurements, notes } = req.body;

    try {
        const order = await Order.findOne({ _id: req.params.id, createdBy: req.user.userId })
            .populate('customer')
            .populate('design');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (measurements) order.measurements = measurements;
        if (notes !== undefined) order.notes = notes;

        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete an order
router.delete('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

