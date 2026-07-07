const mongoose = require('mongoose');

// A Payment document is created the moment a Razorpay order is created
// (status: 'created'), then updated to 'paid' once the signature is
// verified, or 'failed' if verification fails / the user cancels checkout.
//
// This is also what /api/subscriptions/activate relies on as its single
// source of truth — a subscription can only ever be activated from a
// Payment record that this server itself verified.
const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // 'subscription' = plan purchase (price is server-computed from config/plans.js)
    // 'bill' = the tailor collecting payment from their own client for an order
    //          (amount is set by the authenticated tailor themselves, not a
    //          third party, so a client-supplied amount is acceptable here).
    purpose: {
      type: String,
      enum: ['subscription', 'bill'],
      default: 'subscription',
      index: true,
    },
    planId: { type: String, default: null },
    planName: { type: String, required: true, default: 'Order Payment' },
    customerLimit: { type: Number, default: 0 },

    // Amounts in INR (rupees), not paise, for readability in the DB.
    subtotal: { type: Number, required: true },
    gst: { type: Number, required: true },
    amount: { type: Number, required: true }, // subtotal + gst — what Razorpay actually charged
    currency: { type: String, default: 'INR' },

    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    // sparse so multiple 'created'/unverified rows (which have no payment id yet)
    // don't collide on the unique index
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },
    paymentMethod: { type: String },

    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
      index: true,
    },
    failureReason: { type: String },

    // Guards against a payment being used to activate a subscription twice.
    subscriptionActivated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
