// Central export for all API modules
export { registerUser, loginUser, updateProfile } from './auth';
export { createCustomer, getCustomers, getCustomerById, searchCustomers } from './customer';
export { getDesignsByCategory, getAllDesignsByCategory, getMyDesigns, createCustomDesign } from './design';
export { createOrder, getOrders, getOrderById, updateOrderStatus } from './order';
export { createRazorpayOrder, createBillPaymentOrder, verifyPayment, reportPaymentFailure, getPaymentHistory } from './payment';
export type { PlanOrderSummary, CreateOrderResponse } from './payment';
export { getPlans, getSubscriptionStatus, activateSubscription } from './subscription';
export type { Plan, PlanPricing, SubscriptionStatus } from './subscription';
export { default as API } from './config';
