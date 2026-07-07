// Canonical subscription plan definitions.
//
// IMPORTANT (security): this file is the ONLY source of truth for pricing.
// The client sends a `planId`, never an amount — the backend always looks
// up the price here before creating a Razorpay order. This prevents a
// tampered client from requesting a cheap order while trying to activate
// an expensive plan.
//
// `customerLimit` uses 1_000_000 as a sentinel for "unlimited" so it still
// serializes cleanly to JSON (Infinity does not survive JSON.stringify).

const GST_RATE = 0.18; // 18% GST, standard rate for SaaS/software services in India
const UNLIMITED_SENTINEL = 1000000;

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    customerLimit: 100,
    price: 999, // base price per month, in INR (GST added on top)
    durationMonths: 1,
    tagline: 'Perfect for solo tailors just getting started',
    features: [
      'Up to 100 clients',
      'Digital measurement records',
      'Order & billing history',
      'WhatsApp & email bill sharing',
      'Basic customer search',
    ],
    popular: false,
    contactSales: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    customerLimit: 500,
    price: 2499,
    durationMonths: 1,
    tagline: 'For growing boutiques with a steady client base',
    features: [
      'Up to 500 clients',
      'Everything in Starter',
      'Priority customer support',
      'Custom design uploads',
      'Advanced order history & filters',
    ],
    popular: true,
    contactSales: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    customerLimit: 1000,
    price: 4999,
    durationMonths: 1,
    tagline: 'For established shops managing high volume',
    features: [
      'Up to 1000 clients',
      'Everything in Growth',
      'Multi-staff ready records',
      'Priority payment support',
      'Data export on request',
    ],
    popular: false,
    contactSales: false,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    customerLimit: UNLIMITED_SENTINEL,
    price: 9999,
    durationMonths: 1,
    tagline: 'Unlimited clients for large tailoring businesses',
    features: [
      'Unlimited clients',
      'Everything in Professional',
      'Dedicated onboarding support',
      'Custom feature requests',
    ],
    popular: false,
    contactSales: false,
  },
];

function getPlanById(id) {
  return PLANS.find((p) => p.id === id);
}

// Computes the GST breakdown for a plan. Amounts are rounded to the nearest
// rupee since Razorpay (and good UX) doesn't deal in fractional paise here.
function calculatePricing(plan) {
  const subtotal = plan.price;
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;
  return { subtotal, gst, gstRate: GST_RATE, total };
}

module.exports = { PLANS, GST_RATE, UNLIMITED_SENTINEL, getPlanById, calculatePricing };
