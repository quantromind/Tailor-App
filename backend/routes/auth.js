const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register API
router.post('/register', async (req, res) => {
    const { name, phone, password, companyName, email } = req.body;

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
            email: email || '',
            password: hashedPassword
        });

        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, userId: user._id, name: user.name, companyName: user.companyName, email: user.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login API
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

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, userId: user._id, name: user.name, companyName: user.companyName, email: user.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Profile API
router.put('/profile', auth, async (req, res) => {
    const { name, companyName, email, profileImage } = req.body;

    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (companyName !== undefined) user.companyName = companyName;
        if (email !== undefined) user.email = email;
        if (profileImage !== undefined) user.profileImage = profileImage;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                userId: user._id,
                name: user.name,
                companyName: user.companyName,
                email: user.email,
                profileImage: user.profileImage
            }
        });
    } catch (err) {
        console.error('[Auth] Error updating profile:', err.message);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
});

module.exports = router;
