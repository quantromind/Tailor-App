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
    maxClients: {
        type: Number,
        default: 30
    },
    startDate: {
        type: Date
    },
    endDate: {
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
