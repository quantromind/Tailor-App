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

        res.json({
            plan: subscription.plan,
            planId: subscription.planId,
            maxClients: subscription.maxClients || 30,
            currentClients,
            isActive: subscription.isActive,
            startDate: subscription.startDate,
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
    console.log(`[Activate] Called for order: ${razorpayOrderId}, user: ${req.user.userId}`);

    if (!razorpayOrderId) {
        return res.status(400).json({ message: 'razorpayOrderId is required' });
    }

    try {
        const payment = await Payment.findOne({ razorpayOrderId, user: req.user.userId });

        if (!payment) {
            console.warn(`[Activate] No payment found for order: ${razorpayOrderId}`);
            return res.status(404).json({ message: 'Payment record not found for this order' });
        }
        console.log(`[Activate] Payment found — status: ${payment.status}, purpose: ${payment.purpose}, activated: ${payment.subscriptionActivated}`);

        if (payment.purpose !== 'subscription') {
            return res.status(400).json({ message: 'This payment is not a subscription purchase' });
        }
        if (payment.status !== 'paid') {
            return res.status(400).json({ message: 'This payment has not been verified yet' });
        }

        // Idempotency guard: a single payment can only ever activate a
        // subscription once, even if the client retries this call.
        if (payment.subscriptionActivated) {
            console.log(`[Activate] Already activated — sending email again for idempotent call`);
            const existing = await Subscription.findOne({ user: req.user.userId });
            // Still send email in case it was missed the first time
            const user = await User.findById(req.user.userId);
            const currentClients = await Customer.countDocuments({ createdBy: req.user.userId });
            if (user && existing) {
                sendSubscriptionConfirmation({
                    userName: user.name,
                    companyName: user.companyName,
                    userEmail: user.email,
                    userPhone: user.phone,
                    planName: existing.plan,
                    amount: existing.amount,
                    maxClients: existing.maxClients,
                    currentClients,
                    isActive: existing.isActive,
                    startDate: existing.startDate,
                    razorpayOrderId,
                }).catch(mailErr => console.error('[Activate] Email error (idempotent):', mailErr.message));
            }
            return res.json({
                success: true,
                message: 'Subscription already activated for this payment',
                subscription: existing,
            });
        }

        let subscription = await Subscription.findOne({ user: req.user.userId });

        const now = new Date();

        if (subscription) {
            // Renew / upgrade existing
            subscription.plan = payment.planName;
            subscription.planId = payment.planId;
            subscription.maxClients = payment.customerLimit;
            subscription.amount = payment.amount;
            subscription.startDate = now;
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
                isActive: true,
                razorpayPaymentId: payment.razorpayPaymentId,
            });
        }

        await subscription.save();
        console.log(`[Activate] Subscription saved — plan: ${subscription.plan}`);

        payment.subscriptionActivated = true;
        await payment.save();

        // Send confirmation emails BEFORE responding to ensure they are dispatched
        console.log('[Activate] Sending confirmation emails...');
        try {
            const [user, currentClients] = await Promise.all([
                User.findById(req.user.userId),
                Customer.countDocuments({ createdBy: req.user.userId }),
            ]);
            if (user) {
                console.log(`[Activate] Sending email to admin and user: ${user.email || '(no email)'}`);
                await sendSubscriptionConfirmation({
                    userName: user.name,
                    companyName: user.companyName,
                    userEmail: user.email,
                    userPhone: user.phone,
                    planName: subscription.plan,
                    amount: subscription.amount,
                    maxClients: subscription.maxClients,
                    currentClients,
                    isActive: subscription.isActive,
                    startDate: subscription.startDate,
                    razorpayOrderId,
                });
                console.log('[Activate] ✅ Confirmation emails sent successfully');
            } else {
                console.warn('[Activate] User not found for email — skipping');
            }
        } catch (mailErr) {
            console.error('[Activate] ❌ Email send failed:', mailErr.message);
        }

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription: {
                plan: subscription.plan,
                planId: subscription.planId,
                isActive: subscription.isActive,
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
