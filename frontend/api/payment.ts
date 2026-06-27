import API from './config';

export const createRazorpayOrder = async (amount: number) => {
  const response = await API.post('/payment/create-order', { amount });
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
