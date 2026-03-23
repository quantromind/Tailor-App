import API from './config';

export const createOrder = async (data: {
  customer: string;
  design: string;
  measurements: { name: string; value: string }[];
  notes?: string;
}) => {
  const response = await API.post('/orders', data);
  return response.data;
};

export const getOrders = async () => {
  const response = await API.get('/orders');
  return response.data;
};

export const getOrderById = async (id: string) => {
  const response = await API.get(`/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await API.patch(`/orders/${id}/status`, { status });
  return response.data;
};
