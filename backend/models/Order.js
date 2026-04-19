const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    design: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Design',
        required: true
    },
    measurements: [measurementSchema],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'delivered', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    advancePayment: {
        type: Number,
        default: 0
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: String,
        default: ''    // base64 or URI of design reference image
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
