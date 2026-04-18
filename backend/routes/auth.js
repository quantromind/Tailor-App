const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

const router = express.Router();

// Register API — new users get free tier (30 clients)
router.post('/register', async (req, res) => {
    const { name, phone, password, companyName } = req.body;

    try {
        let user = await User.findOne({ phone });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this phone number' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            name,
            phone,
            companyName: companyName || '',
            password: hashedPassword,
            clientLimit: 30,
            subscriptionPlan: 'free'
        });

        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '365d' });

        res.status(201).json({ 
            token, 
            userId: user._id, 
            name: user.name, 
            companyName: user.companyName,
            clientLimit: user.clientLimit,
            subscriptionPlan: user.subscriptionPlan
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login API — returns subscription info
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Count how many clients this user has
        const clientCount = await Customer.countDocuments({ createdBy: user._id });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '365d' });

        res.json({ 
            token, 
            userId: user._id, 
            name: user.name, 
            companyName: user.companyName,
            clientLimit: user.clientLimit,
            subscriptionPlan: user.subscriptionPlan,
            clientCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get logged-in user profile
const auth = require('../middleware/auth');
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const clientCount = await Customer.countDocuments({ createdBy: user._id });
        res.json({ ...user.toObject(), clientCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile (name, phone, company, logo)
router.put('/profile', auth, async (req, res) => {
    const { name, phone, companyName, logo } = req.body;

    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (companyName !== undefined) user.companyName = companyName;
        if (logo !== undefined) user.logo = logo;
        if (phone) {
            if (phone !== user.phone) {
                const existingUser = await User.findOne({ phone });
                if (existingUser) {
                    return res.status(400).json({ message: 'Phone number already in use' });
                }
                user.phone = phone;
            }
        }

        await user.save();
        const clientCount = await Customer.countDocuments({ createdBy: user._id });
        res.json({ 
            userId: user._id, 
            name: user.name, 
            phone: user.phone, 
            companyName: user.companyName,
            logo: user.logo,
            clientLimit: user.clientLimit,
            subscriptionPlan: user.subscriptionPlan,
            clientCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
