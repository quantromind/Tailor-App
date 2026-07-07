const express = require('express');
const Design = require('../models/Design');
const auth = require('../middleware/auth');

const router = express.Router();

// ⚠️  IMPORTANT: Specific routes MUST be declared before wildcard routes.
// If `/:category` is declared first, Express will match `/my` as a category
// and the dedicated route below will never be reached.

// Get all custom designs created by the current tailor (all categories)
// GET /api/designs/my
router.get('/my', auth, async (req, res) => {
    try {
        const designs = await Design.find({
            isCustom: true,
            createdBy: req.user.userId
        }).sort({ createdAt: -1 });
        res.json(designs);
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
    const { name, category, image, description, measurements } = req.body;

    try {
        const design = new Design({
            name,
            category: category.toLowerCase(),
            image: image || '',
            description: description || '',
            measurements: measurements || [],
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

module.exports = router;
