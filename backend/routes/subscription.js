const express = require('express');
const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// Get current user's subscription status
router.get('/status', auth, async (req, res) => {
    try {
        let subscription = await Subscription.findOne({ user: req.user.userId });
        const currentClients = await Customer.countDocuments({ createdBy: req.user.userId });
        
        // If no subscription exists, return a default Free plan status
        if (!subscription) {
            return res.json({
                plan: 'Free',
                maxClients: 30,
                currentClients,
                isActive: false,
                isExpired: false,
                endDate: null
            });
        }

        // Check if subscription has expired
        const now = new Date();
        const isExpired = subscription.endDate ? now > subscription.endDate : false;

        if (isExpired && subscription.isActive) {
            subscription.isActive = false;
            await subscription.save();
        }

        res.json({
            plan: subscription.plan,
            maxClients: subscription.maxClients || 30,
            currentClients,
            isActive: subscription.isActive,
            isExpired,
            startDate: subscription.startDate,
            endDate: subscription.endDate
        });

    } catch (err) {
        console.error('[Subscription] Error fetching status:', err);
        res.status(500).json({ message: 'Server error fetching subscription status' });
    }
});

// Activate or Renew Subscription
router.post('/activate', auth, async (req, res) => {
    const { plan, durationMonths, paymentId } = req.body;

    if (!plan || !durationMonths || !paymentId) {
        return res.status(400).json({ message: 'Missing required activation fields' });
    }

    try {
        let subscription = await Subscription.findOne({ user: req.user.userId });
        
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Calculate max clients based on plan name (e.g. "50 Clients", "Unlimited")
        let maxClients = 30;
        if (plan === 'Unlimited') {
            maxClients = 1000000;
        } else {
            const parsed = parseInt(plan.split(' ')[0], 10);
            if (!isNaN(parsed)) maxClients = parsed;
        }

        if (subscription) {
            // Renew existing
            subscription.plan = plan;
            subscription.maxClients = maxClients;
            subscription.startDate = now;
            subscription.endDate = endDate;
            subscription.isActive = true;
            subscription.razorpayPaymentId = paymentId;
        } else {
            // Create new
            subscription = new Subscription({
                user: req.user.userId,
                plan,
                maxClients,
                startDate: now,
                endDate: endDate,
                isActive: true,
                razorpayPaymentId: paymentId
            });
        }

        await subscription.save();

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription: {
                plan: subscription.plan,
                isActive: subscription.isActive,
                endDate: subscription.endDate
            }
        });

    } catch (err) {
        console.error('[Subscription] Error activating subscription:', err);
        res.status(500).json({ message: 'Server error activating subscription' });
    }
});

module.exports = router;
