import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: inject JWT ─────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trackx_token');
  
  if (import.meta.env.DEV) {
    console.log(`[API-CLIENT] Sending ${config.method?.toUpperCase()} request to ${config.url} | Token present: ${!!token}`);
  }

  if (token) {
    config.headers = config.headers || {};
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (import.meta.env.DEV) {
        console.warn(`[API-CLIENT] Response failed with status ${error.response.status} for ${error.config?.url}:`, error.response.data);
      }
      if (error.response.status === 401) {
        localStorage.removeItem('trackx_token');
        localStorage.removeItem('trackx_user');
        // Redirect to login (avoid import cycle)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (import.meta.env.DEV) {
      console.error('[API-CLIENT] Network or configuration error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
