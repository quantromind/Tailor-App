const express = require('express');
const Design = require('../models/Design');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all designs for the logged-in user (custom + default, grouped by category)
router.get('/user/all', auth, async (req, res) => {
    try {
        const designs = await Design.find({
            $or: [
                { isCustom: false },
                { isCustom: true, createdBy: req.user.userId }
            ]
        }).sort({ category: 1, createdAt: -1 });

        // Group by category
        const grouped = {};
        designs.forEach(d => {
            const cat = d.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(d);
        });

        res.json({ designs, grouped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get designs by category (mens, womens, kids)
router.get('/:category', async (req, res) => {
    const { category } = req.params;

    try {
        const designs = await Design.find({
            category: category.toLowerCase(),
            isCustom: false
        });
        res.json(designs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a custom design (tailor creates their own)
router.post('/custom', auth, async (req, res) => {
    const { name, category, image, description, measurements, price } = req.body;

    try {
        const design = new Design({
            name,
            category: category.toLowerCase(),
            image: image || '',
            description: description || '',
            measurements: measurements || [],
            price: price || 0,
            isCustom: true,
            createdBy: req.user.userId
        });

        await design.save();
        res.status(201).json(design);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all designs for a category including tailor's custom designs
router.get('/:category/all', auth, async (req, res) => {
    const { category } = req.params;

    try {
        const designs = await Design.find({
            category: category.toLowerCase(),
            $or: [
                { isCustom: false },
                { isCustom: true, createdBy: req.user.userId }
            ]
        });
        res.json(designs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a custom design
router.put('/custom/:id', auth, async (req, res) => {
    const { name, category, image, description, measurements, price } = req.body;

    try {
        const design = await Design.findOne({ _id: req.params.id, createdBy: req.user.userId, isCustom: true });
        if (!design) {
            return res.status(404).json({ message: 'Custom design not found' });
        }

        if (name) design.name = name;
        if (category) design.category = category.toLowerCase();
        if (image !== undefined) design.image = image;
        if (description !== undefined) design.description = description;
        if (measurements) design.measurements = measurements;
        if (price !== undefined) design.price = price;

        await design.save();
        res.json(design);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a custom design
router.delete('/custom/:id', auth, async (req, res) => {
    try {
        const design = await Design.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId, isCustom: true });
        if (!design) {
            return res.status(404).json({ message: 'Custom design not found' });
        }
        res.json({ message: 'Custom design deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

