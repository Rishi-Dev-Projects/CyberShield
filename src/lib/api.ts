import axios from 'axios';

// Standalone Next.js uses relative API paths on the same origin
export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach user details if present in localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storedUserStr = localStorage.getItem('demo_user');
    if (storedUserStr) {
      try {
        const user = JSON.parse(storedUserStr);
        if (user && user.id) {
          config.headers['X-User-Id'] = user.id;
          config.headers['X-User-Role'] = user.role || 'STUDENT';
          config.headers['X-User-Name'] = user.username || '';
          config.headers['X-User-Email'] = user.email || '';
        }
      } catch (e) {
        console.error('API Interceptor: failed to parse local user storage', e);
      }
    }
  }
  return config;
});
