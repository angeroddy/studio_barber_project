import axios from 'axios';

// Configuration de base pour axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // URL du backend
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour gerer les reponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la session est invalide, nettoyer l'etat local et rediriger
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
