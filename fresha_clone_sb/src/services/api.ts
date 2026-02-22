import axios, { AxiosHeaders } from 'axios';

// Configuration de base pour axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // URL du backend
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  const hasBody = config.data !== undefined && config.data !== null;

  if (hasBody && method !== 'GET' && method !== 'HEAD') {
    const headers = AxiosHeaders.from(config.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    config.headers = headers;
  }

  return config;
});

// Intercepteur pour gerer les reponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/staff-auth/login') ||
      requestUrl.includes('/staff-auth/first-login') ||
      requestUrl.includes('/staff-auth/complete-invitation');

    const isAuthPage =
      typeof window !== 'undefined' &&
      (window.location.pathname === '/signin' || window.location.pathname === '/signup');

    // Si la session est invalide, nettoyer l'etat local et rediriger
    if (error.response?.status === 401 && !isAuthRequest && !isAuthPage) {
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
