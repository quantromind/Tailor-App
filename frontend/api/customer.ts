import API from './config';

export const createCustomer = async (data: { name: string; phone: string }) => {
  console.log('[API] createCustomer called with:', data);
  const response = await API.post('/customers', data);
  return response.data;
};

export const getCustomers = async () => {
  const response = await API.get('/customers');
  return response.data;
};

export const searchCustomers = async (query: string = '') => {
  const response = await API.get(`/customers/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getCustomerById = async (id: string) => {
  const response = await API.get(`/customers/${id}`);
  return response.data;
};
