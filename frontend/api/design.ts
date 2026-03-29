import API from './config';

export const getDesignsByCategory = async (category: string) => {
  const response = await API.get(`/designs/${category}`);
  return response.data;
};

export const getAllDesignsByCategory = async (category: string) => {
  const response = await API.get(`/designs/${category}/all`);
  return response.data;
};

export const createCustomDesign = async (data: {
  name: string;
  category: string;
  image?: string;
  description?: string;
  measurements?: string[];
  price?: number;
}) => {
  const response = await API.post('/designs/custom', data);
  return response.data;
};

export const getUserDesigns = async () => {
  const response = await API.get('/designs/user/all');
  return response.data;
};
