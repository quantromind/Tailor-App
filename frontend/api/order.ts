import API from './config';

export const createOrder = async (data: {
  customer: string;
  design: string;
  measurements: { name: string; value: string }[];
  notes?: string;
  price?: number;
  advancePayment?: number;
  deliveryDate?: string;
}) => {
  const response = await API.post('/orders', data);
  return response.data;
};

export const getOrders = async (params?: { sort?: string; status?: string; from?: string; to?: string }) => {
  const query = new URLSearchParams();
  if (params?.sort) query.set('sort', params.sort);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const response = await API.get(`/orders?${query.toString()}`);
  return response.data;
};

export const getRecentOrders = async () => {
  const response = await API.get('/orders/recent');
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

export const updateOrder = async (id: string, data: any) => {
  const response = await API.put(`/orders/${id}`, data);
  return response.data;
};

export const searchOrders = async (q: string = '', sort: string = 'date') => {
  const response = await API.get(`/orders/search?q=${encodeURIComponent(q)}&sort=${sort}`);
  return response.data;
};

export const getOrdersByCustomer = async (customerId: string) => {
  const response = await API.get(`/orders/by-customer/${customerId}`);
  return response.data;
};

export const getPreviousMeasurements = async (customerId: string, designId: string) => {
  const response = await API.get(`/orders/previous-measurements?customer=${customerId}&design=${designId}`);
  return response.data;
};

export const getLastMeasurements = async (customerId: string, designType: string, itemName?: string) => {
  let url = `/orders/last-measurements?customerId=${customerId}&designType=${encodeURIComponent(designType)}`;
  if (itemName) url += `&itemName=${encodeURIComponent(itemName)}`;
  const response = await API.get(url);
  return response.data;
};


export const deleteOrder = async (id: string) => {
  const response = await API.delete(`/orders/${id}`);
  return response.data;
};
