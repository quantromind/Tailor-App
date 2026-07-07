const express = require('express');
const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { PLANS, calculatePricing } = require('../config/plans');
const { sendSubscriptionConfirmation } = require('../utils/mailer');

const router = express.Router();

// Canonical plan list + live pricing (incl. GST), so the frontend never has
// to hardcode prices and stays in sync with what will actually be charged.
// GET /api/subscriptions/plans
router.get('/plans', async (req, res) => {
    const plans = PLANS.map((plan) => ({
        id: plan.id,
        name: plan.name,
        customerLimit: plan.customerLimit,
        tagline: plan.tagline,
        features: plan.features,
        popular: plan.popular,
        contactSales: plan.contactSales,
        durationMonths: plan.durationMonths,
        pricing: plan.contactSales ? null : calculatePricing(plan),
    }));
    res.json(plans);
});

// Shared handler backing both /status (legacy) and /current (per spec)
async function getStatusHandler(req, res) {
    try {
        let subscription = await Subscription.findOne({ user: req.user.userId });
        const currentClients = await Customer.countDocuments({ createdBy: req.user.userId });

        // If no subscription exists, return a default Free plan status
        if (!subscription) {
            return res.json({
                plan: 'Free',
                planId: null,
                maxClients: 30,
                currentClients,
                isActive: false,
                isExpired: false,
                endDate: null,
                amount: 0,
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
            planId: subscription.planId,
            maxClients: subscription.maxClients || 30,
            currentClients,
            isActive: subscription.isActive,
            isExpired,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            amount: subscription.amount || 0,
        });

    } catch (err) {
        console.error('[Subscription] Error fetching status:', err);
        res.status(500).json({ message: 'Server error fetching subscription status' });
    }
}

// GET /api/subscriptions/status — legacy path, kept for backward compatibility
router.get('/status', auth, getStatusHandler);
// GET /api/subscriptions/current — matches the spec's requested path name
router.get('/current', auth, getStatusHandler);

// Activate or renew a subscription
// POST /api/subscriptions/activate
// Body: { razorpayOrderId }
//
// SECURITY: activation is derived ENTIRELY from a server-verified Payment
// record (status === 'paid'), never from a client-supplied plan/amount.
// This means a client can never activate a plan it did not actually pay for.
router.post('/activate', auth, async (req, res) => {
    const { razorpayOrderId } = req.body;

    if (!razorpayOrderId) {
        return res.status(400).json({ message: 'razorpayOrderId is required' });
    }

    try {
        const payment = await Payment.findOne({ razorpayOrderId, user: req.user.userId });

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found for this order' });
        }
        if (payment.purpose !== 'subscription') {
            return res.status(400).json({ message: 'This payment is not a subscription purchase' });
        }
        if (payment.status !== 'paid') {
            return res.status(400).json({ message: 'This payment has not been verified yet' });
        }

        // Idempotency guard: a single payment can only ever activate a
        // subscription once, even if the client retries this call.
        if (payment.subscriptionActivated) {
            const existing = await Subscription.findOne({ user: req.user.userId });
            return res.json({
                success: true,
                message: 'Subscription already activated for this payment',
                subscription: existing,
            });
        }

        let subscription = await Subscription.findOne({ user: req.user.userId });

        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + payment.durationMonths);

        if (subscription) {
            // Renew / upgrade existing
            subscription.plan = payment.planName;
            subscription.planId = payment.planId;
            subscription.maxClients = payment.customerLimit;
            subscription.amount = payment.amount;
            subscription.startDate = now;
            subscription.endDate = endDate;
            subscription.isActive = true;
            subscription.razorpayPaymentId = payment.razorpayPaymentId;
        } else {
            subscription = new Subscription({
                user: req.user.userId,
                plan: payment.planName,
                planId: payment.planId,
                maxClients: payment.customerLimit,
                amount: payment.amount,
                startDate: now,
                endDate,
                isActive: true,
                razorpayPaymentId: payment.razorpayPaymentId,
            });
        }

        await subscription.save();

        payment.subscriptionActivated = true;
        await payment.save();

        // Send confirmation email (truly non-blocking — failure won't affect the response)
        User.findById(req.user.userId).then(user => {
            if (user) {
                sendSubscriptionConfirmation({
                    userName: user.name,
                    companyName: user.companyName,
                    userEmail: user.email,
                    userPhone: user.phone,
                    planName: subscription.plan,
                    amount: subscription.amount,
                    maxClients: subscription.maxClients,
                    endDate: subscription.endDate,
                    razorpayOrderId: razorpayOrderId,
                }).catch(mailErr => {
                    console.error('[Subscription] Email send failed (non-fatal):', mailErr.message);
                });
            }
        }).catch(err => {
            console.error('[Subscription] Error fetching user for email:', err.message);
        });

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription: {
                plan: subscription.plan,
                planId: subscription.planId,
                isActive: subscription.isActive,
                endDate: subscription.endDate,
                maxClients: subscription.maxClients,
                amount: subscription.amount,
            },
        });

    } catch (err) {
        console.error('[Subscription] Error activating subscription:', err);
        res.status(500).json({ message: 'Server error activating subscription' });
    }
});

module.exports = router;
