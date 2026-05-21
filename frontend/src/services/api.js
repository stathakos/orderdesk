import axios from "axios";
import { getToken, logout } from "./authStore";

// DEBUG — remove after fixing
console.log("api.js loaded, logout is:", typeof logout);

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"; // FastAPI backend

const api = axios.create({
  baseURL: API_URL,
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

// ------------------------------------
// Request interceptor — attach token
// ------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------------------------
// Response interceptor — handle 401
// ------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Customer APIs
export const searchCustomersByPhone = (phone) => 
  api.get("/customers/search", { params: { phone } }).then((r) => r.data);

export const searchCustomersByName = (name) => 
  api.get("/customers/search", { params: { name } }).then((r) => r.data);

export const getAllCustomers = () =>
  api.get("/customers/").then((response) => response.data);

export const getCustomer = (customerId) => 
  api.get(`/customers/${customerId}`).then((r) => r.data);

export const createCustomer = (data) => 
  api.post(`/customers/`, data).then((r) => r.data);

export const updateCustomer = (customerId, data) => 
  api.patch(`/customers/${customerId}`, data).then((r) => r.data);

export const deleteCustomer = (CustomerId) => 
  api.delete(`/customers/${CustomerId}`).then((r) => r.data);

// ------------------------------------
// Categories APIs
// ------------------------------------
 
export const getCategories = () =>
  api.get("/categories/").then((r) => r.data);
 
export const getCategory = (categoryId) =>
  api.get(`/categories/${categoryId}`).then((r) => r.data);
 
export const createCategory = (data) =>
  api.post("/categories/", data).then((r) => r.data);
 
export const updateCategory = (categoryId, data) =>
  api.patch(`/categories/${categoryId}`, data).then((r) => r.data);
 
export const deleteCategory = (categoryId) =>
  api.delete(`/categories/${categoryId}`).then((r) => r.data);


// ------------------------------------
// Products APIs
// ------------------------------------
 
export const getProducts = (availableOnly = false) =>
  api.get("/products/", { params: { available_only: availableOnly } }).then((r) => r.data);
 
export const getProduct = (productId) =>
  api.get(`/products/${productId}`).then((r) => r.data);
 
export const getProductsByCategory = (categoryId, availableOnly = false) =>
  api
    .get(`/products/category/${categoryId}`, { params: { available_only: availableOnly } })
    .then((r) => r.data);
 
export const createProduct = (data) =>
  api.post("/products/", data).then((r) => r.data);
 
export const updateProduct = (productId, data) =>
  api.patch(`/products/${productId}`, data).then((r) => r.data);
 
export const deleteProduct = (productId) =>
  api.delete(`/products/${productId}`).then((r) => r.data);
 
// ------------------------------------
// Orders APIs
// ------------------------------------
 
export const getOrders = (filters = {}) =>
  api.get("/orders/", { params: filters }).then((r) => r.data);
  // filters: { customer_name, order_type, payment_method, status, date_from, date_to, include_archived, skip, limit }
 
export const getOrder = (orderId) =>
  api.get(`/orders/${orderId}`).then((r) => r.data);
 
export const createOrder = (data) =>
  api.post("/orders/", data).then((r) => r.data);
 
export const updateOrder = (orderId, data) =>
  api.patch(`/orders/${orderId}`, data).then((r) => r.data);
 
export const deleteOrder = (orderId) =>
  api.delete(`/orders/${orderId}`).then((r) => r.data);

export const updateOrderFull = (orderId, data) =>
  api.put(`/orders/${orderId}`, data).then((r) => r.data);

export const closeShift = () =>
  api.post("/orders/close-shift").then((r) => r.data);

export const purgeOldOrders = () =>
  api.delete("/orders/purge").then((r) => r.data);


// ------------------------------------
// Users APIs
// ------------------------------------
export const getUsers = () =>
  api.get("/users/").then((r) => r.data);

export const createUser = (data) =>
  api.post("/users/", data).then((r) => r.data);

export const updateUser = (userId, data) =>
  api.patch(`/users/${userId}`, data).then((r) => r.data);

export const deleteUser = (userId) =>
  api.delete(`/users/${userId}`).then((r) => r.data);

// ------------------------------------
// Auth APIs
// ------------------------------------
export const loginRequest = (credentials) =>
  api.post("/auth/login", credentials).then((r) => r.data);

export const getMe = () =>
  api.get("/auth/me").then((r) => r.data);

export const changeMyPassword = (data) =>
  api.patch("/auth/me/password", data).then((r) => r.data);

export const refreshToken = () =>
  api.post("/auth/refresh").then((r) => r.data);

export default api;

// ------------------------------------
// Delivery Workers APIs
// ------------------------------------
export const getDeliveryWorkers = (activeOnly = false) =>
  api.get("/delivery-workers/", { params: { active_only: activeOnly } }).then((r) => r.data);

export const createDeliveryWorker = (data) =>
  api.post("/delivery-workers/", data).then((r) => r.data);

export const updateDeliveryWorker = (workerId, data) =>
  api.patch(`/delivery-workers/${workerId}`, data).then((r) => r.data);

export const deleteDeliveryWorker = (workerId) =>
  api.delete(`/delivery-workers/${workerId}`).then((r) => r.data);

export const assignOrder = (orderId, workerId) =>
  api.patch(`/orders/${orderId}/assign`, null, { params: { worker_id: workerId } }).then((r) => r.data);

export const unassignOrder = (orderId) =>
  api.patch(`/orders/${orderId}/assign`, null).then((r) => r.data);

export const getWorkerShiftSummary = (workerId) =>
  api.get(`/delivery-workers/${workerId}/summary`).then((r) => r.data);

// ------------------------------------
// Ingredients APIs
// ------------------------------------
export const getIngredients = (availableOnly = false) =>
  api.get("/ingredients/", { params: { available_only: availableOnly } }).then((r) => r.data);

export const createIngredient = (data) =>
  api.post("/ingredients/", data).then((r) => r.data);

export const updateIngredient = (id, data) =>
  api.patch(`/ingredients/${id}`, data).then((r) => r.data);

export const deleteIngredient = (id) =>
  api.delete(`/ingredients/${id}`).then((r) => r.data);
