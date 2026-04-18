import API from './config';

// Get all available subscription plans
export const getPlans = () => API.get('/subscription/plans');

// Get user's active subscription
export const getActiveSubscription = () => API.get('/subscription/active');

// Create a Razorpay order for a plan
export const createOrder = (plan: string) =>
    API.post('/subscription/create-order', { plan });

// Verify Razorpay payment and activate subscription
export const verifyPayment = (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: string;
}) => API.post('/subscription/verify-payment', data);

// Get Razorpay key for frontend checkout
export const getRazorpayKey = () => API.get('/subscription/razorpay-key');

// Subscribe to a plan (direct fallback — not used with Razorpay)
export const subscribeToPlan = (plan: string, paymentId?: string) =>
    API.post('/subscription/subscribe', { plan, paymentId });

// Check if user can add more clients
export const checkClientLimit = () => API.get('/subscription/check-limit');

// Get subscription history
export const getSubscriptionHistory = () => API.get('/subscription/history');
