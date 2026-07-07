const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // A user should only have one active subscription record that gets updated
    },
    plan: {
        type: String,
        default: 'Free'
    },
    // Canonical plan id (e.g. 'starter', 'growth') from config/plans.js.
    // Kept alongside the display name `plan` so activation logic never has
    // to guess a plan back from its label.
    planId: {
        type: String,
        default: null
    },
    maxClients: {
        type: Number,
        default: 30
    },
    // Amount actually paid for the current billing cycle (INR, incl. GST).
    amount: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: false
    },
    razorpayPaymentId: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
