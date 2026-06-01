// Use Vite environment variable `VITE_API_BASE` for runtime API base
// Fallback to localhost for local development
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
