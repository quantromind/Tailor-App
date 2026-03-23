// Central export for all API modules
export { registerUser, loginUser } from './auth';
export { createCustomer, getCustomers, getCustomerById, searchCustomers } from './customer';
export { getDesignsByCategory, getAllDesignsByCategory, createCustomDesign } from './design';
export { createOrder, getOrders, getOrderById, updateOrderStatus } from './order';
export { default as API } from './config';
