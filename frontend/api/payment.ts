import API from './config';

export interface PlanOrderSummary {
  id: string;
  name: string;
  subtotal: number;
  gst: number;
  total: number;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number; // in paise, as returned by Razorpay
  currency: string;
  keyId: string;
  plan: PlanOrderSummary;
}

// Creates a Razorpay order for the given plan. The backend computes the
// price from its own canonical plan list — this call never sends an amount.
export const createRazorpayOrder = async (planId: string): Promise<CreateOrderResponse> => {
  const response = await API.post('/payment/create-order', { planId });
  return response.data;
};

// Creates a Razorpay order to collect payment from a tailor's own client for
// a specific bill/order. Unlike subscriptions, the amount here is set by the
// authenticated tailor for their own order — a separate, pre-existing flow.
export const createBillPaymentOrder = async (amount: number, description?: string): Promise<CreateOrderResponse> => {
  const response = await API.post('/payment/create-order', { amount, description });
  return response.data;
};

export const verifyPayment = async (data: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) => {
  const response = await API.post('/payment/verify', data);
  return response.data;
};

// Called when Razorpay Checkout is cancelled or throws, so failed attempts
// are recorded on the backend for auditing.
export const reportPaymentFailure = async (data: { razorpay_order_id: string; reason?: string }) => {
  const response = await API.post('/payment/failure', data);
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await API.get('/payment/history');
  return response.data;
};
