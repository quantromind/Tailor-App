const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('[Subscription] Razorpay initialized with key:', process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 12) + '...' : 'MISSING!');

// Plan definitions
const PLANS = {
    silver: {
        name: 'Silver',
        price: 299,
        clientLimit: 300,
        duration: 30, // days
        features: [
            'Up to 300 clients',
            'Basic measurements',
            'Order tracking',
            'Bill generation'
        ]
    },
    gold: {
        name: 'Gold',
        price: 599,
        clientLimit: 600,
        duration: 30,
        features: [
            'Up to 600 clients',
            'Advanced measurements',
            'Order tracking',
            'Bill generation',
            'Design gallery',
            'Priority support'
        ]
    },
    platinum: {
        name: 'Platinum',
        price: 999,
        clientLimit: -1, // unlimited
        duration: 30,
        features: [
            'Unlimited clients',
            'All measurements',
            'Order tracking',
            'Bill generation',
            'Design gallery',
            'Priority support',
            'Custom branding',
            'Export reports'
        ]
    }
};

// GET /api/subscription/plans - Get all available plans
router.get('/plans', (req, res) => {
    const plans = Object.entries(PLANS).map(([key, plan]) => ({
        id: key,
        ...plan
    }));
    res.json(plans);
});

// GET /api/subscription/razorpay-key - Get Razorpay key for frontend
router.get('/razorpay-key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// POST /api/subscription/create-order - Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
        return res.status(400).json({ message: 'Invalid plan selected' });
    }

    try {
        const planDetails = PLANS[plan];
        const amountInPaise = Math.round(planDetails.price * 100); // Razorpay expects paise

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `sub_${plan}_${req.user.userId.slice(-8)}_${Date.now().toString().slice(-10)}`,
            notes: {
                plan: plan,
                userId: req.user.userId,
                planName: planDetails.name
            }
        });

        console.log(`[Razorpay] Order created: ${order.id} for plan: ${plan}, amount: ₹${planDetails.price}`);

        res.json({
            orderId: order.id,
            amount: amountInPaise,
            currency: 'INR',
            plan: plan,
            planName: planDetails.name,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('[Razorpay] Order creation failed:', err?.statusCode, err?.error || err?.message || err);
        res.status(500).json({ message: 'Failed to create payment order', error: err?.error?.description || err?.message || 'Unknown error' });
    }
});

// POST /api/subscription/verify-payment - Verify Razorpay payment & activate subscription
router.post('/verify-payment', auth, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
        return res.status(400).json({ message: 'Missing payment verification details' });
    }

    if (!PLANS[plan]) {
        return res.status(400).json({ message: 'Invalid plan' });
    }

    try {
        // Verify payment signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('[Razorpay] Signature mismatch!');
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        console.log(`[Razorpay] Payment verified: ${razorpay_payment_id}`);

        // Cancel any existing active subscription
        await Subscription.updateMany(
            { user: req.user.userId, status: 'active' },
            { status: 'cancelled' }
        );

        const planDetails = PLANS[plan];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + planDetails.duration);

        const subscription = new Subscription({
            user: req.user.userId,
            plan,
            price: planDetails.price,
            clientLimit: planDetails.clientLimit,
            startDate,
            endDate,
            paymentId: razorpay_payment_id,
            status: 'active'
        });

        await subscription.save();

        console.log(`[Subscription] ${planDetails.name} plan activated for user ${req.user.userId}`);

        res.status(201).json({
            message: `Successfully subscribed to ${planDetails.name} plan!`,
            subscription: {
                plan: subscription.plan,
                planName: planDetails.name,
                price: subscription.price,
                clientLimit: subscription.clientLimit,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                daysRemaining: planDetails.duration,
                paymentId: razorpay_payment_id
            }
        });
    } catch (err) {
        console.error('[Razorpay] Verification error:', err);
        res.status(500).json({ message: 'Server error during payment verification' });
    }
});

// GET /api/subscription/active - Get user's active subscription
router.get('/active', auth, async (req, res) => {
    try {
        // Auto-expire old subscriptions
        await Subscription.updateMany(
            { user: req.user.userId, status: 'active', endDate: { $lt: new Date() } },
            { status: 'expired' }
        );

        let subscription = await Subscription.findOne({
            user: req.user.userId,
            status: 'active'
        }).sort({ createdAt: -1 });

        if (!subscription) {
            const User = require('../models/User');
            const user = await User.findById(req.user.userId);
            const clientCount = await Customer.countDocuments({ createdBy: req.user.userId });
            
            return res.json({
                hasSubscription: user.subscriptionPlan !== 'free',
                plan: user.subscriptionPlan || 'free',
                planName: user.subscriptionPlan === 'free' ? 'Free Trial' : user.subscriptionPlan,
                clientsUsed: clientCount,
                clientLimit: user.clientLimit || 30,
                isFreePlan: true
            });
        }

        // Get current client count
        const clientCount = await Customer.countDocuments({ createdBy: req.user.userId });

        res.json({
            hasSubscription: true,
            plan: subscription.plan,
            planName: PLANS[subscription.plan]?.name || subscription.plan,
            price: subscription.price,
            clientLimit: subscription.clientLimit,
            clientsUsed: clientCount,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            daysRemaining: Math.max(0, Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))),
            status: subscription.status
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/subscription/subscribe - Direct subscribe (kept as fallback, won't be used with Razorpay)
router.post('/subscribe', auth, async (req, res) => {
    const { plan, paymentId } = req.body;

    if (!plan || !PLANS[plan]) {
        return res.status(400).json({ message: 'Invalid plan selected' });
    }

    try {
        // Cancel any existing active subscription
        await Subscription.updateMany(
            { user: req.user.userId, status: 'active' },
            { status: 'cancelled' }
        );

        const planDetails = PLANS[plan];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + planDetails.duration);

        const subscription = new Subscription({
            user: req.user.userId,
            plan,
            price: planDetails.price,
            clientLimit: planDetails.clientLimit,
            startDate,
            endDate,
            paymentId: paymentId || '',
            status: 'active'
        });

        await subscription.save();

        res.status(201).json({
            message: `Successfully subscribed to ${planDetails.name} plan!`,
            subscription: {
                plan: subscription.plan,
                planName: planDetails.name,
                price: subscription.price,
                clientLimit: subscription.clientLimit,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                daysRemaining: planDetails.duration
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/subscription/check-limit - Check if user can add more clients
router.get('/check-limit', auth, async (req, res) => {
    try {
        let subscription = await Subscription.findOne({
            user: req.user.userId,
            status: 'active',
            endDate: { $gte: new Date() }
        }).sort({ createdAt: -1 });

        let limit = 0;
        let isFreePlan = false;
        let planName = '';

        if (subscription) {
            limit = subscription.clientLimit;
            planName = PLANS[subscription.plan]?.name || subscription.plan;
        } else {
            // Fallback to user model for free trial / base limits
            const User = require('../models/User');
            const user = await User.findById(req.user.userId);
            if (user && user.clientLimit > 0) {
                limit = user.clientLimit;
                isFreePlan = true;
                planName = 'Free';
            }
        }

        if (limit === 0 && !isFreePlan) {
            return res.json({
                canAdd: false,
                reason: 'No active subscription. Please subscribe to a plan.',
                needsSubscription: true
            });
        }

        // Unlimited plan
        if (limit === -1) {
            return res.json({ canAdd: true, remaining: -1 });
        }

        const clientCount = await Customer.countDocuments({ createdBy: req.user.userId });

        if (clientCount >= limit) {
            return res.json({
                canAdd: false,
                reason: isFreePlan 
                    ? `You have reached your free limit of ${limit} clients. Please subscribe to a plan.` 
                    : `You have reached your ${planName} plan limit of ${limit} clients. Please upgrade your plan.`,
                needsUpgrade: true,
                needsSubscription: isFreePlan,
                currentPlan: isFreePlan ? 'free' : subscription.plan,
                clientsUsed: clientCount,
                clientLimit: limit
            });
        }

        res.json({
            canAdd: true,
            remaining: limit - clientCount,
            clientsUsed: clientCount,
            clientLimit: limit
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/subscription/history - Get subscription history
router.get('/history', auth, async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(10);

        const history = subscriptions.map(sub => ({
            plan: sub.plan,
            planName: PLANS[sub.plan]?.name || sub.plan,
            price: sub.price,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            createdAt: sub.createdAt
        }));

        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
