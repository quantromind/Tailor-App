import API from './config';

export const registerUser = async (data: {
  name: string;
  phone: string;
  password: string;
  companyName?: string;
}) => {
  const response = await API.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: {
  phone: string;
  password: string;
}) => {
  const response = await API.post('/auth/login', data);
  return response.data;
};
