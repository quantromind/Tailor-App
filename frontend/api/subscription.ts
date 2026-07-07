import API from './config';

export interface PlanPricing {
  subtotal: number;
  gst: number;
  gstRate: number;
  total: number;
}

export interface Plan {
  id: string;
  name: string;
  customerLimit: number;
  tagline: string;
  features: string[];
  popular: boolean;
  contactSales: boolean;
  durationMonths: number;
  pricing: PlanPricing | null;
}

export interface SubscriptionStatus {
  plan: string;
  planId: string | null;
  maxClients: number;
  currentClients: number;
  isActive: boolean;
  isExpired: boolean;
  startDate?: string;
  endDate?: string;
  amount?: number;
}

// Canonical, live plan list + pricing from the backend — never hardcode
// prices on the client, since that's also what gets charged.
export const getPlans = async (): Promise<Plan[]> => {
  const response = await API.get('/subscriptions/plans');
  return response.data;
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await API.get('/subscriptions/status');
  return response.data;
};

// Activates a subscription from a razorpayOrderId that has already been
// verified via /payment/verify. The backend derives plan/amount from its
// own verified Payment record — this call never sends plan/amount directly.
export const activateSubscription = async (razorpayOrderId: string) => {
  const response = await API.post('/subscriptions/activate', { razorpayOrderId });
  return response.data;
};
