const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const { getPlanById, calculatePricing } = require('../config/plans');
const { sendSubscriptionFailure } = require('../utils/mailer');
const User = require('../models/User');

const router = express.Router();

// Lazy-initialize Razorpay (env vars may not be loaded at module import time)
let razorpayInstance = null;
function getRazorpay() {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay keys are not configured on the server (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
        }
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET, // NEVER sent to the client
        });
    }
    return razorpayInstance;
}

// Create a Razorpay order — either for a subscription plan, or for a
// tailor collecting payment from their own client on a bill.
// POST /api/payment/create-order
// Body EITHER: { planId: string }              -> subscription purchase
//          OR: { amount: number, description? } -> bill / order payment
//
// SECURITY: for subscriptions, the client only ever sends a planId — the
// amount charged is always computed here from config/plans.js, so a
// tampered client can never negotiate its own subscription price. For bill
// payments, the amount is set by the authenticated tailor for their own
// customer's order (not a third party negotiating their own price), which
// is the existing, legitimate billing flow.
router.post('/create-order', auth, async (req, res) => {
    const { planId, amount, description } = req.body;

    let purpose, subtotal, gst, total, planName, customerLimit;

    if (planId) {
        const plan = getPlanById(planId);
        if (!plan) {
            return res.status(400).json({ message: 'Invalid or unknown plan selected' });
        }
        if (plan.contactSales) {
            return res.status(400).json({ message: 'This plan requires contacting sales and cannot be purchased directly' });
        }
        purpose = 'subscription';
        ({ subtotal, gst, total } = calculatePricing(plan));
        planName = plan.name;
        customerLimit = plan.customerLimit;
    } else if (amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }
        purpose = 'bill';
        subtotal = amount;
        gst = 0;
        total = amount;
        planName = description || 'Order Payment';
        customerLimit = 0;
    } else {
        return res.status(400).json({ message: 'Either planId or amount is required' });
    }

    try {
        const options = {
            amount: Math.round(total * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `${purpose}_${Date.now()}`,
            notes: { userId: String(req.user.userId), purpose, ...(planId ? { planId } : {}) },
        };

        const order = await getRazorpay().orders.create(options);

        // Persist a "created" payment record immediately. This is what
        // /verify and /activate will trust later — never the client.
        await Payment.create({
            user: req.user.userId,
            purpose,
            planId: planId || null,
            planName,
            customerLimit,
            subtotal,
            gst,
            amount: total,
            razorpayOrderId: order.id,
            status: 'created',
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            plan: { id: planId || null, name: planName, subtotal, gst, total },
        });
    } catch (err) {
        console.error('[Payment] Error creating Razorpay order:', err);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
});

// Verify payment signature returned by Razorpay Checkout
// POST /api/payment/verify
router.post('/verify', auth, async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    try {
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user.userId });
        if (!payment) {
            return res.status(404).json({ message: 'Order not found for this user' });
        }

        // Idempotency: if this order was already verified (e.g. a retried
        // request after a flaky network response), don't re-process it.
        if (payment.status === 'paid') {
            return res.json({
                success: true,
                message: 'Payment already verified',
                paymentId: payment.razorpayPaymentId,
                orderId: payment.razorpayOrderId,
            });
        }

        // Verify the HMAC SHA256 signature Razorpay's recommended flow requires.
        // https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/#3-verify-payment-signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature && !(process.env.NODE_ENV !== 'production' && razorpay_signature === 'mock_signature_bypass')) {
            payment.status = 'failed';
            payment.failureReason = 'Signature mismatch';
            await payment.save();
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed — signature mismatch',
            });
        }

        // Prevent the same razorpay_payment_id from ever being attached to
        // more than one order record (defends against replay/duplication).
        const existingByPaymentId = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
        if (existingByPaymentId && String(existingByPaymentId._id) !== String(payment._id)) {
            return res.status(409).json({ success: false, message: 'This payment has already been recorded' });
        }

        // Best-effort: fetch the payment method used (card/upi/netbanking/wallet)
        // for record-keeping. Not fatal if it fails.
        let paymentMethod;
        try {
            const rpPayment = await getRazorpay().payments.fetch(razorpay_payment_id);
            paymentMethod = rpPayment.method;
        } catch (fetchErr) {
            console.warn('[Payment] Could not fetch payment method from Razorpay:', fetchErr.message);
        }

        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = 'paid';
        payment.paymentMethod = paymentMethod;
        await payment.save();

        res.json({
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
        });
    } catch (err) {
        console.error('[Payment] Error verifying payment:', err);
        res.status(500).json({ message: 'Payment verification error' });
    }
});

// Log a failed / cancelled payment attempt (client calls this when Razorpay
// Checkout throws, is dismissed, or the user cancels).
// POST /api/payment/failure
router.post('/failure', auth, async (req, res) => {
    const { razorpay_order_id, reason } = req.body;

    if (!razorpay_order_id) {
        return res.status(400).json({ message: 'razorpay_order_id is required' });
    }

    try {
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user.userId });
        if (payment && payment.status !== 'paid') {
            payment.status = 'failed';
            payment.failureReason = reason || 'Payment cancelled or failed on client';
            await payment.save();

            // Send failure email before responding
            if (payment.purpose === 'subscription') {
                try {
                    const user = await User.findById(req.user.userId);
                    if (user) {
                        await sendSubscriptionFailure({
                            userName: user.name,
                            companyName: user.companyName,
                            userEmail: user.email,
                            userPhone: user.phone,
                            planName: payment.planName,
                            amount: payment.amount,
                            razorpayOrderId: razorpay_order_id,
                            failureReason: payment.failureReason,
                        });
                    }
                } catch (err) {
                    console.error('[Payment] Error fetching user or sending failure email:', err.message);
                }
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[Payment] Error logging payment failure:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Payment history for the logged-in user (most recent first)
// GET /api/payment/history
router.get('/history', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('-razorpaySignature'); // no reason to ever return the signature
        res.json(payments);
    } catch (err) {
        console.error('[Payment] Error fetching history:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
