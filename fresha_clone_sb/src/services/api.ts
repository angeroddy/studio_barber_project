import axios, { AxiosHeaders } from 'axios';

function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredBaseUrl) {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }

  if (typeof window === 'undefined' || !import.meta.env.DEV) {
    return configuredBaseUrl;
  }

  try {
    const parsedUrl = new URL(configuredBaseUrl);
    const localHosts = new Set(['localhost', '127.0.0.1']);
    const browserHost = window.location.hostname;

    // Keep backend host aligned with the browser host in local dev to avoid cookie host mismatch.
    if (localHosts.has(parsedUrl.hostname) && localHosts.has(browserHost) && parsedUrl.hostname !== browserHost) {
      parsedUrl.hostname = browserHost;
      return parsedUrl.toString().replace(/\/$/, '');
    }
  } catch {
    // Keep raw value for relative URLs or invalid custom values.
  }

  return configuredBaseUrl;
}

// Configuration de base pour axios
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
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
    const headers = AxiosHeaders.from(error.config?.headers);
    const skipAuthRedirect = headers.get('X-Skip-Auth-Redirect') === 'true';
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/staff-auth/login') ||
      requestUrl.includes('/staff-auth/first-login') ||
      requestUrl.includes('/staff-auth/complete-invitation') ||
      requestUrl.includes('/client-auth/complete-invitation');

    const isAuthPage =
      typeof window !== 'undefined' &&
      (
        window.location.pathname === '/signin' ||
        window.location.pathname === '/set-password'
      );

    // Si la session est invalide, nettoyer l'etat local et rediriger
    if (error.response?.status === 401 && !isAuthRequest && !isAuthPage && !skipAuthRedirect) {
      localStorage.removeItem('userType');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
