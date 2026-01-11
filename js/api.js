/**
 * API Client for Loop Habits Backend
 * Handles all HTTP requests to the server
 */

// API Base URL - Detect environment
const API_URL = (() => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  } else if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    // Local network - use same IP for backend
    return `http://${hostname}:5000/api`;
  } else {
    // Production - use Vercel backend
    return 'https://loop-habits-rat699zx8-srinis-projects-28ee38af.vercel.app/api';
  }
})();

// Token storage key
const TOKEN_KEY = 'loop_habits_token';
const USER_KEY = 'loop_habits_user';

/**
 * Get stored auth token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user
 */
export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Store auth data
 */
export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth data
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * Make authenticated API request
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    // Handle token expiration
    if (response.status === 401) {
      clearAuth();
      window.location.reload();
    }
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// ============================================
// AUTH API
// ============================================

/**
 * Sign up a new user
 */
export async function signup(name, email, password) {
  const data = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  
  setAuth(data.token, data.user);
  return data;
}

/**
 * Login user
 */
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  setAuth(data.token, data.user);
  return data;
}

/**
 * Logout user
 */
export function logout() {
  clearAuth();
}

/**
 * Get current user profile
 */
export async function getProfile() {
  return await request('/auth/me');
}

/**
 * Update user settings
 */
export async function updateSettings(settings) {
  return await request('/auth/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
}

// ============================================
// HABITS API
// ============================================

/**
 * Get all habits
 */
export async function getHabits(includeArchived = false) {
  const query = includeArchived ? '?archived=true' : '';
  const data = await request(`/habits${query}`);
  return data.habits;
}

/**
 * Get a single habit
 */
export async function getHabit(id) {
  const data = await request(`/habits/${id}`);
  return data.habit;
}

/**
 * Create a new habit
 */
export async function createHabit(habitData) {
  const data = await request('/habits', {
    method: 'POST',
    body: JSON.stringify(habitData)
  });
  return data.habit;
}

/**
 * Update a habit
 */
export async function updateHabit(id, habitData) {
  const data = await request(`/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(habitData)
  });
  return data.habit;
}

/**
 * Delete a habit
 */
export async function deleteHabit(id) {
  await request(`/habits/${id}`, {
    method: 'DELETE'
  });
}

// ============================================
// COMPLETIONS API
// ============================================

/**
 * Get completions for a habit
 */
export async function getCompletions(habitId) {
  const data = await request(`/completions/habit/${habitId}`);
  return data.dates; // Returns array of date strings
}

/**
 * Get all completions
 */
export async function getAllCompletions(startDate, endDate) {
  let query = '';
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    query = `?${params.toString()}`;
  }
  const data = await request(`/completions${query}`);
  return data.completions;
}

/**
 * Toggle completion for a habit on a date
 */
export async function toggleCompletion(habitId, date) {
  const data = await request('/completions/toggle', {
    method: 'POST',
    body: JSON.stringify({ habitId, date })
  });
  return data.completed;
}

/**
 * Get completion statistics
 */
export async function getStats(days = 30) {
  return await request(`/completions/stats?days=${days}`);
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if backend is available (with timeout)
 */
export async function healthCheck() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
