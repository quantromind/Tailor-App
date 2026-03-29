const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// Create or Get a customer by phone (upsert-style)
router.post('/', auth, async (req, res) => {
    const { name, phone, gender } = req.body;
    try {
        let customer = await Customer.findOne({ phone, createdBy: req.user.userId });
        if (customer) {
            if (name && customer.name !== name) customer.name = name;
            if (gender && customer.gender !== gender) customer.gender = gender;
            await customer.save();
            return res.json(customer);
        }
        customer = new Customer({ name, phone, gender: gender || null, createdBy: req.user.userId });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all customers with their order info (count, latest status)
router.get('/with-orders', auth, async (req, res) => {
    const { sort } = req.query;
    try {
        const customers = await Customer.find({ createdBy: req.user.userId });
        const customersWithOrders = await Promise.all(customers.map(async (customer) => {
            const orders = await Order.find({ customer: customer._id })
                .populate('design')
                .sort({ createdAt: -1 });
            const latestOrder = orders[0] || null;
            return {
                ...customer.toObject(),
                orderCount: orders.length,
                latestStatus: latestOrder?.status || null,
                latestDesign: latestOrder?.design?.name || null,
                latestOrderDate: latestOrder?.createdAt || null,
            };
        }));

        // Deduplicate strictly by name
        const deduplicatedMap = new Map();
        for (const customer of customersWithOrders) {
            const nameKey = customer.name.toLowerCase().trim();
            
            if (!deduplicatedMap.has(nameKey)) {
                deduplicatedMap.set(nameKey, customer);
            } else {
                const existing = deduplicatedMap.get(nameKey);
                // Merge details: retain combined order count and the latest order
                existing.orderCount += customer.orderCount;
                
                // If the incoming customer has a phone and the existing doesn't, inherit it
                if (!existing.phone && customer.phone) {
                    existing.phone = customer.phone;
                }
                
                const existingDate = existing.latestOrderDate ? new Date(existing.latestOrderDate).getTime() : 0;
                const currentDate = customer.latestOrderDate ? new Date(customer.latestOrderDate).getTime() : 0;
                
                if (currentDate > existingDate) {
                    existing.latestStatus = customer.latestStatus;
                    existing.latestDesign = customer.latestDesign;
                    existing.latestOrderDate = customer.latestOrderDate;
                }
            }
        }
        
        const uniqueCustomers = Array.from(deduplicatedMap.values());

        let sorted = uniqueCustomers;
        if (sort === 'name') {
            sorted = uniqueCustomers.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            sorted = uniqueCustomers.sort((a, b) => {
                const da = a.latestOrderDate ? new Date(a.latestOrderDate) : new Date(a.createdAt);
                const db = b.latestOrderDate ? new Date(b.latestOrderDate) : new Date(b.createdAt);
                return db - da;
            });
        }

        res.json(sorted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all customers for the logged-in tailor
router.get('/', auth, async (req, res) => {
    try {
        const customers = await Customer.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search customers by name or phone
router.get('/search', auth, async (req, res) => {
    const { q, sort } = req.query;
    try {
        const filter = { createdBy: req.user.userId };
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or = [{ name: regex }, { phone: regex }];
        }
        let sortOption = { createdAt: -1 };
        if (sort === 'name') sortOption = { name: 1 };

        const customers = await Customer.find(filter).sort(sortOption);
        res.json(customers);
    } catch (err) {
        console.error('[DEBUG] Search Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single customer by ID + their orders (merged for duplicates)
router.get('/:id', auth, async (req, res) => {
    try {
        const targetCustomer = await Customer.findOne({ _id: req.params.id, createdBy: req.user.userId });
        if (!targetCustomer) return res.status(404).json({ message: 'Customer not found' });

        let filter = { customer: targetCustomer._id };
        // Group all orders for any customer sharing this exact name
        const family = await Customer.find({ 
            name: new RegExp(`^${targetCustomer.name.trim()}$`, 'i'), 
            createdBy: req.user.userId 
        });
        if (family.length > 0) {
            filter = { customer: { $in: family.map(c => c._id) } };
        }

        const orders = await Order.find({ ...filter, createdBy: req.user.userId })
            .populate('design')
            .sort({ createdAt: -1 });
            
        res.json({ ...targetCustomer.toObject(), orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a customer
router.put('/:id', auth, async (req, res) => {
    const { name, phone, gender } = req.body;
    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.userId },
            { ...(name && { name }), ...(phone && { phone }), ...(gender !== undefined && { gender }) },
            { new: true }
        );
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a customer and cascade-delete their orders
router.delete('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        await Order.deleteMany({ customer: req.params.id });
        res.json({ message: 'Customer and orders deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
