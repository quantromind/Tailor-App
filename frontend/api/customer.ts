import API from './config';

export const createCustomer = async (data: { name: string; phone: string; gender?: string }) => {
  const response = await API.post('/customers', data);
  return response.data;
};

export const getCustomers = async () => {
  const response = await API.get('/customers');
  return response.data;
};

export const searchCustomers = async (query: string = '', sort: string = 'date') => {
  const response = await API.get(`/customers/search?q=${encodeURIComponent(query)}&sort=${sort}`);
  return response.data;
};

export const getCustomerById = async (id: string) => {
  const response = await API.get(`/customers/${id}`);
  return response.data;
};

export const getCustomersWithOrders = async (sort: string = 'date') => {
  const response = await API.get(`/customers/with-orders?sort=${sort}`);
  return response.data;
};

export const updateCustomer = async (id: string, data: { name?: string; phone?: string; gender?: string }) => {
  const response = await API.put(`/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: string) => {
  const response = await API.delete(`/customers/${id}`);
  return response.data;
};
