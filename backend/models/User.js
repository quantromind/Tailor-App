const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        default: ''
    },
    // Subscription: free tier = 30 clients, paid tiers for more
    clientLimit: {
        type: Number,
        default: 30
    },
    subscriptionPlan: {
        type: String,
        enum: ['free', '49_clients', '99_clients', '199_clients'],
        default: 'free'
    },
    subscriptionStart: {
        type: Date,
        default: null
    },
    subscriptionEnd: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);