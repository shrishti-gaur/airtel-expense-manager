import axios from 'axios';

// Get API URL from env, default to local express port
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject auth token from storage into headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Central response error handler (e.g. 401s redirect to login)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API Interceptor] Session unauthorized. Clearing cache.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Dispatch custom event to notify AuthContext to log out gracefully without reload
      window.dispatchEvent(new Event('auth_session_expired'));
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
