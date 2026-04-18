// Central export for all API modules
export { registerUser, loginUser } from './auth';
export { createCustomer, getCustomers, getCustomerById, searchCustomers, getCustomersWithOrders, updateCustomer, deleteCustomer } from './customer';
export { getDesignsByCategory, getAllDesignsByCategory, createCustomDesign, getUserDesigns, deleteDesign } from './design';
export { createOrder, getOrders, getRecentOrders, getOrderById, updateOrderStatus, updateOrder, searchOrders, getOrdersByCustomer, getPreviousMeasurements, getLastMeasurements, deleteOrder } from './order';
export { default as API } from './config';
