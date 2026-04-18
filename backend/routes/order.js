const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer'); // Required for populate
const Design = require('../models/Design');     // Required for populate
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new order
router.post('/', auth, async (req, res) => {
    const { customer, design, measurements, notes, price, deliveryDate, advancePayment } = req.body;
    try {
        const order = new Order({
            customer,
            design,
            measurements: measurements || [],
            notes: notes || '',
            price: price || 0,
            advancePayment: advancePayment || 0,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            createdBy: req.user.userId
        });
        await order.save();
        const populated = await Order.findById(order._id).populate('customer').populate('design');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recent orders (last 10) — for Home screen widget
router.get('/recent', auth, async (req, res) => {
    try {
        const orders = await Order.find({ 
            createdBy: req.user.userId,
            status: { $nin: ['completed', 'delivered'] }
        })
            .populate('customer')
            .populate('design')
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search orders by client name/phone
router.get('/search', auth, async (req, res) => {
    const { q, sort } = req.query;
    try {
        const orders = await Order.find({ createdBy: req.user.userId })
            .populate('customer')
            .populate('design');

        let filtered = orders;
        if (q) {
            const regex = new RegExp(q, 'i');
            filtered = orders.filter(o => {
                const name = o.customer?.name || '';
                const phone = o.customer?.phone || '';
                return regex.test(name) || regex.test(phone);
            });
        }
        if (sort === 'name') {
            filtered.sort((a, b) => (a.customer?.name || '').localeCompare(b.customer?.name || ''));
        } else {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        res.json(filtered);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get orders for a specific customer (groups by phone number to handle duplicate profiles)
router.get('/by-customer/:customerId', auth, async (req, res) => {
    try {
        const targetCustomer = await Customer.findById(req.params.customerId);
        if (!targetCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        let filter = { customer: req.params.customerId };
        
        // Group all orders for any customer sharing this exact name
        const familyCustomers = await Customer.find({ 
            name: new RegExp(`^${targetCustomer.name.trim()}$`, 'i'), 
            createdBy: req.user.userId 
        });
        const ids = familyCustomers.map(c => c._id);
        if (ids.length > 0) {
            filter = { customer: { $in: ids } };
        }

        const orders = await Order.find({
            createdBy: req.user.userId,
            ...filter
        }).populate('customer').populate('design').sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /last-measurements?customerId=X&designType=Shirt
// Returns measurements from the most recent order matching the design type
router.get('/last-measurements', auth, async (req, res) => {
    const { customerId, designType } = req.query;
    try {
        const targetCustomer = await Customer.findById(customerId);
        let filter = { customer: customerId };
        
        // For last-measurements, also group by identical names
        const familyCustomers = await Customer.find({ 
            name: new RegExp(`^${targetCustomer.name.trim()}$`, 'i'), 
            createdBy: req.user.userId 
        });
        const ids = familyCustomers.map(c => c._id);
        if (ids.length > 0) {
            filter = { customer: { $in: ids } };
        }

        const orders = await Order.find({
            createdBy: req.user.userId,
            ...filter
        }).populate('design').sort({ createdAt: -1 });

        const searchType = (designType || '').toLowerCase();
        const searchName = (req.query.itemName || '').toLowerCase();
        console.log(`[DEBUG LastMeas] searchType: "${searchType}", searchName: "${searchName}", found orders: ${orders.length}`);

        const found = orders.find(o => {
            const dName = (o.design?.name || '').toLowerCase();
            const match = dName.includes(searchType) || (searchName && dName === searchName);
            console.log(`  -> orderId: ${o._id}, matching against designName: "${dName}", result: ${match}`);
            return match;
        });

        if (found && found.measurements?.length > 0) {
            console.log(`[DEBUG LastMeas] Match found! Measurements length: ${found.measurements.length}`);
            return res.json({ measurements: found.measurements, found: true });
        }
        console.log(`[DEBUG LastMeas] No measurements found.`);
        return res.json({ measurements: [], found: false });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get previous measurements for a customer + design combo
router.get('/previous-measurements', auth, async (req, res) => {
    const { customer, design } = req.query;
    try {
        const order = await Order.findOne({
            createdBy: req.user.userId,
            customer,
            design
        }).sort({ createdAt: -1 });
        if (order && order.measurements && order.measurements.length > 0) {
            res.json({ measurements: order.measurements, found: true });
        } else {
            res.json({ measurements: [], found: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all orders — supports ?status=X&from=date&to=date&sort=name
router.get('/', auth, async (req, res) => {
    const { sort, status, from, to } = req.query;
    try {
        const filter = { createdBy: req.user.userId };
        if (status && status !== 'all') filter.status = status;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toDate;
            }
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'name') sortOption = {};

        const orders = await Order.find(filter)
            .populate('customer')
            .populate('design')
            .sort(sortOption);

        if (sort === 'name') {
            orders.sort((a, b) => (a.customer?.name || '').localeCompare(b.customer?.name || ''));
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('customer').populate('design');
        if (!order) return res.status(404).json({ message: 'Order not found' });
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
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate('customer').populate('design');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order (measurements, notes, price)
router.put('/:id', auth, async (req, res) => {
    const { measurements, notes, price, deliveryDate, status, advancePayment } = req.body;
    try {
        const order = await Order.findOne({ _id: req.params.id, createdBy: req.user.userId })
            .populate('customer').populate('design');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (measurements) order.measurements = measurements;
        if (notes !== undefined) order.notes = notes;
        if (price !== undefined) order.price = price;
        if (advancePayment !== undefined) order.advancePayment = advancePayment;
        if (deliveryDate !== undefined) order.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
        if (status) order.status = status;
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
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
