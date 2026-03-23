const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new customer
router.post('/', auth, async (req, res) => {
    const { name, phone } = req.body;

    try {
        const customer = new Customer({
            name,
            phone,
            createdBy: req.user.userId
        });

        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all customers for the logged-in tailor
router.get('/', auth, async (req, res) => {
    try {
        const customers = await Customer.find({ createdBy: req.user.userId })
            .sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search customers by name or phone
router.get('/search', auth, async (req, res) => {
    const { q } = req.query;
    try {
        const filter = { createdBy: req.user.userId };
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or = [{ name: regex }, { phone: regex }];
        }
        const customers = await Customer.find(filter).sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        console.error("SEARCH ERROR:", err);
        res.status(500).json({ message: 'Server error', error: err.stack || err.message });
    }
});

// Get a single customer by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a customer
router.put('/:id', auth, async (req, res) => {
    const { name, phone } = req.body;

    try {
        const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user.userId });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (name) customer.name = name;
        if (phone) customer.phone = phone;

        await customer.save();
        res.json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a customer
router.delete('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

