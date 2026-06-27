import API from './config';

export interface SubscriptionStatus {
  plan: string;
  maxClients: number;
  currentClients: number;
  isActive: boolean;
  isExpired: boolean;
  startDate?: string;
  endDate?: string;
}

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await API.get('/subscriptions/status');
  return response.data;
};

export const activateSubscription = async (data: {
  plan: string;
  durationMonths: number;
  paymentId: string;
}) => {
  const response = await API.post('/subscriptions/activate', data);
  return response.data;
};
