// Use Vite environment variable `VITE_API_BASE` for runtime API base
// Ensure it always ends with '/api' so frontend calls match backend routes
const rawBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const trimmed = rawBase.replace(/\/+$/g, '');
export const API_BASE = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
