import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  refreshSession: () => Promise<boolean>;
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

  const getHttpStatus = (error: unknown): number | undefined => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response?.status === 'number'
    ) {
      return (error as any).response.status as number;
    }
    return undefined;
  };

  const isNetworkError = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const axiosLikeError = error as any;
    return axiosLikeError.code === 'ERR_NETWORK' || !axiosLikeError.response;
  };

  const refreshSession = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    // Cleanup legacy token storage (migration to HttpOnly cookies)
    localStorage.removeItem('token');

    const preferredType = localStorage.getItem('userType') as UserType | null;
    const resolveOwnerSession = async (): Promise<boolean> => {
      const response = await authService.getProfile();
      setUser(response.data);
      setUserType('owner');
      localStorage.setItem('userType', 'owner');
      return true;
    };

    const resolveStaffSession = async (): Promise<boolean> => {
      const response = await staffAuthService.getProfile();
      setUser(response);
      setUserType('staff');
      localStorage.setItem('userType', 'staff');
      return true;
    };

    try {
      if (preferredType === 'owner') {
        try {
          await resolveOwnerSession();
          return true;
        } catch (error) {
          const status = getHttpStatus(error);
          if (status === 403) {
            await resolveStaffSession();
            return true;
          }
          throw error;
        }
      }

      if (preferredType === 'staff') {
        try {
          await resolveStaffSession();
          return true;
        } catch (error) {
          const status = getHttpStatus(error);
          if (status === 403) {
            await resolveOwnerSession();
            return true;
          }
          throw error;
        }
      }

      try {
        await resolveOwnerSession();
        return true;
      } catch (ownerError) {
        const ownerStatus = getHttpStatus(ownerError);

        if (ownerStatus === 403) {
          await resolveStaffSession();
          return true;
        }

        throw ownerError;
      }
    } catch {
      localStorage.removeItem('userType');
      setUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }

    return false;
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('userType');
      setUser(null);
      setUserType(null);
      navigate('/signin', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  const login = async (data: LoginData) => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.login(data);
      localStorage.setItem('userType', 'owner');

      // Validate that backend session is really established before navigating.
      const profileResponse = await authService.getProfile();
      setUser(profileResponse.data);
      setUserType('owner');

      navigate('/');
    } catch (error: any) {
      const status = getHttpStatus(error);
      const errorMessage =
        isNetworkError(error)
          ? "Impossible de joindre l'API backend (http://127.0.0.1:5000). Vérifiez que le serveur backend est démarré."
          : status === 401
          ? "Session invalide apres connexion. Verifiez la configuration cookie/CORS du backend."
          : error.response?.data?.error || error.response?.data?.message || 'Erreur de connexion';
      localStorage.removeItem('userType');
      setUser(null);
      setUserType(null);
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
      await staffAuthService.login({
        email: data.email,
        password: data.password,
      });

      // Validate that backend session is really established before navigating.
      const profileResponse = await staffAuthService.getProfile();
      localStorage.setItem('userType', 'staff');
      setUser(profileResponse);
      setUserType('staff');

      navigate('/');
    } catch (error: any) {
      const status = getHttpStatus(error);
      const errorMessage =
        isNetworkError(error)
          ? "Impossible de joindre l'API backend (http://127.0.0.1:5000). Vérifiez que le serveur backend est démarré."
          : status === 401
          ? "Session invalide apres connexion. Verifiez la configuration cookie/CORS du backend."
          : error.response?.data?.error || error.response?.data?.message || error.message || 'Erreur de connexion';
      localStorage.removeItem('userType');
      setUser(null);
      setUserType(null);
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
      await authService.register(data);
      localStorage.setItem('userType', 'owner');

      // Validate that backend session is really established before navigating.
      const profileResponse = await authService.getProfile();
      setUser(profileResponse.data);
      setUserType('owner');

      navigate('/');
    } catch (error: any) {
      const status = getHttpStatus(error);
      const errorMessage =
        isNetworkError(error)
          ? "Impossible de joindre l'API backend (http://127.0.0.1:5000). Vérifiez que le serveur backend est démarré."
          : status === 401
          ? "Session invalide apres inscription. Verifiez la configuration cookie/CORS du backend."
          : error.response?.data?.error || error.response?.data?.message || "Erreur lors de l'inscription";
      localStorage.removeItem('userType');
      setUser(null);
      setUserType(null);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (userType === 'staff') {
      void staffAuthService.logout().catch(() => undefined);
    } else {
      void authService.logout().catch(() => undefined);
    }

    localStorage.removeItem('userType');
    setUser(null);
    setUserType(null);
    navigate('/signin');
  };

  const clearError = () => {
    setError(null);
  };

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
    refreshSession,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider');
  }
  return context;
}
