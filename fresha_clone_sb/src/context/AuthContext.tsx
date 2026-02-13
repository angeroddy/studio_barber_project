import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/auth.service';
import staffAuthService from '../services/staffAuth.service';
import type { User, LoginData, RegisterData } from '../services/auth.service';
import type { StaffUser } from '../services/staffAuth.service';

type UserType = 'owner' | 'staff';

interface AuthContextType {
  user: User | StaffUser | null;
  userType: UserType | null;
  isOwner: boolean;
  isStaff: boolean;
  isManager: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  staffLogin: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | StaffUser | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté au chargement de l'app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedUserType = localStorage.getItem('userType') as UserType | null;

      if (token && storedUser && storedUserType) {
        try {
          // Vérifier que le token est toujours valide selon le type d'utilisateur
          if (storedUserType === 'owner') {
            const response = await authService.getProfile();
            setUser(response.data);
            setUserType('owner');
          } else if (storedUserType === 'staff') {
            const response = await staffAuthService.getProfile();
            setUser(response);
            setUserType('staff');
          }
        } catch (error) {
          // Token invalide ou expiré
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          setUser(null);
          setUserType(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.login(data);

      // Sauvegarder le token et l'utilisateur (Owner)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userType', 'owner');
      setUser(response.data.user);
      setUserType('owner');

      // Rediriger vers la page d'accueil
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur de connexion';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const staffLogin = async (data: LoginData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await staffAuthService.login({
        email: data.email,
        password: data.password
      });

      // Sauvegarder le token et l'utilisateur (Staff)
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('userType', 'staff');
      setUser(response.user);
      setUserType('staff');

      // Rediriger vers la page d'accueil
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.register(data);

      // Sauvegarder le token et l'utilisateur (Owner)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userType', 'owner');
      setUser(response.data.user);
      setUserType('owner');

      // Rediriger vers la page d'accueil
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setUser(null);
    setUserType(null);
    navigate('/signin');
  };

  const clearError = () => {
    setError(null);
  };

  // Helper pour vérifier le type d'utilisateur
  const isOwner = userType === 'owner';
  const isStaff = userType === 'staff';
  const isManager = isStaff && (user as StaffUser)?.role === 'MANAGER';

  const value: AuthContextType = {
    user,
    userType,
    isOwner,
    isStaff,
    isManager,
    isAuthenticated: !!user,
    isLoading,
    login,
    staffLogin,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
