import axios from 'axios';

// 1. Determine the runtime API base URL
const rawBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const trimmed = rawBase.replace(/\/+$/g, '');
export const API_BASE = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

// 2. Create a centralized Axios instance
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 3. Request Interceptor: Automatically attach the JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 4. Response Interceptor: Optional but helpful global error handling (e.g., auto-logout if token expires)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized! Token might be invalid or expired.');
            // Optional: clear local storage or redirect to login if necessary
            // localStorage.clear();
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;