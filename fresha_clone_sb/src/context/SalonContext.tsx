import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Salon } from '../services/auth.service';

interface SalonContextType {
  selectedSalon: Salon | null;
  salons: Salon[];
  isLoading: boolean;
  selectSalon: (salonId: string) => void;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export function SalonProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser le salon sélectionné au chargement ou quand l'utilisateur change
  useEffect(() => {
    if (!isAuthenticated || !user?.salons || user.salons.length === 0) {
      setSelectedSalon(null);
      setIsLoading(false);
      return;
    }

    const userSalons = user.salons;
    const storedSalonId = localStorage.getItem('selectedSalonId');

    // Vérifier si le salon stocké existe toujours dans les salons de l'utilisateur
    if (storedSalonId) {
      const storedSalon = userSalons.find(salon => salon.id === storedSalonId);
      if (storedSalon) {
        setSelectedSalon(storedSalon);
        setIsLoading(false);
        return;
      }
    }

    // Si pas de salon stocké ou salon invalide, prendre le premier
    setSelectedSalon(userSalons[0]);
    localStorage.setItem('selectedSalonId', userSalons[0].id);
    setIsLoading(false);
  }, [user, isAuthenticated]);

  const selectSalon = (salonId: string) => {
    if (!user?.salons) return;

    const salon = user.salons.find(s => s.id === salonId);
    if (salon) {
      setSelectedSalon(salon);
      localStorage.setItem('selectedSalonId', salonId);
    }
  };

  const value: SalonContextType = {
    selectedSalon,
    salons: user?.salons || [],
    isLoading,
    selectSalon,
  };

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

// Hook personnalisé pour utiliser le contexte de salon
export function useSalon() {
  const context = useContext(SalonContext);
  if (context === undefined) {
    throw new Error('useSalon doit être utilisé dans un SalonProvider');
  }
  return context;
}
