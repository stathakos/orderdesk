/**
 * authStore.js
 * Simple auth state manager using localStorage.
 * No Redux needed — just a plain module with exported functions.
 */
 
const TOKEN_KEY = "restaurant_token";
const USER_KEY = "restaurant_user";

// ------------------------------------
// Token
// ------------------------------------
 
 
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
 
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}
  
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
 

// ------------------------------------
// User
// ------------------------------------
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
 
export function removeUser() {
  localStorage.removeItem(USER_KEY);
}

// ------------------------------------
// Auth state
// ------------------------------------
 
export function isAuthenticated() {
  return !!getToken();
}
 
export function getUserRole() {
  return getUser()?.role ?? null;
}

export function hasRole(...roles) {
  const user = getUser();
  if (!user) return false;
  return roles.includes(user.role);
}
 
export function isAdmin() {
  return hasRole("admin");
}
 
export function isManager() {
  return hasRole("admin", "manager");
}

export function isDelivery() {
  return hasRole("delivery");
}
 
// ------------------------------------
// Login / Logout
// ------------------------------------
 
export function login(token, user) {
  setToken(token);
  setUser(user);
}
 
export function logout() {
  removeToken();
  removeUser();
}
 








