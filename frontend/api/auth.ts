import API from './config';

export const registerUser = async (data: {
  name: string;
  phone: string;
  password: string;
  companyName?: string;
  email?: string;
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

export const updateProfile = async (data: {
  name?: string;
  companyName?: string;
  email?: string;
  profileImage?: string;
}) => {
  const response = await API.put('/auth/profile', data);
  return response.data;
};
