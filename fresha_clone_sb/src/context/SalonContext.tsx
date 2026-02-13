import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Salon } from '../services/salon.service';
import type { StaffUser } from '../services/staffAuth.service';
import { getSalonById } from '../services/salon.service';

interface SalonContextType {
  selectedSalon: Salon | null;
  salons: Salon[];
  isLoading: boolean;
  selectSalon: (salonId: string) => void;
  refreshSalon: () => Promise<void>;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export function SalonProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isStaff } = useAuth();
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser le salon sélectionné au chargement ou quand l'utilisateur change
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSelectedSalon(null);
      setIsLoading(false);
      return;
    }

    // Pour les employés (StaffUser), utiliser directement le salon assigné
    if (isStaff) {
      const staffUser = user as StaffUser;
      if (staffUser.salon) {
        setSelectedSalon(staffUser.salon as unknown as Salon);
        setIsLoading(false);
        return;
      }
    }

    // Pour les propriétaires (User), utiliser la liste des salons
    const ownerUser = user as any;
    if (!ownerUser.salons || ownerUser.salons.length === 0) {
      setSelectedSalon(null);
      setIsLoading(false);
      return;
    }

    const userSalons = ownerUser.salons;
    const storedSalonId = localStorage.getItem('selectedSalonId');

    // Vérifier si le salon stocké existe toujours dans les salons de l'utilisateur
    if (storedSalonId) {
      const storedSalon = userSalons.find((salon: Salon) => salon.id === storedSalonId);
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
  }, [user, isAuthenticated, isStaff]);

  const refreshSalon = async () => {
    if (!selectedSalon) return;

    try {
      // Récupérer le salon mis à jour depuis l'API
      const updatedSalon = await getSalonById(selectedSalon.id);

      // Mettre à jour le salon sélectionné
      setSelectedSalon(updatedSalon as unknown as Salon);

      // Si c'est un propriétaire, mettre à jour aussi dans user.salons
      if (!isStaff && user) {
        const ownerUser = user as any;
        if (ownerUser.salons) {
          const salonIndex = ownerUser.salons.findIndex((s: Salon) => s.id === selectedSalon.id);
          if (salonIndex !== -1) {
            ownerUser.salons[salonIndex] = updatedSalon;
            // Mettre à jour le localStorage
            localStorage.setItem('user', JSON.stringify(ownerUser));
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du salon:', error);
      throw error;
    }
  };

  const selectSalon = (salonId: string) => {
    // Pour les employés, ils ne peuvent pas changer de salon
    if (isStaff) return;

    const ownerUser = user as any;
    if (!ownerUser?.salons) return;

    const salon = ownerUser.salons.find((s: Salon) => s.id === salonId);
    if (salon) {
      setSelectedSalon(salon);
      localStorage.setItem('selectedSalonId', salonId);
    }
  };

  // Déterminer la liste des salons selon le type d'utilisateur
  const getSalons = (): Salon[] => {
    if (!user) return [];

    if (isStaff) {
      const staffUser = user as StaffUser;
      return staffUser.salon ? [staffUser.salon as unknown as Salon] : [];
    }

    const ownerUser = user as any;
    return ownerUser?.salons || [];
  };

  const value: SalonContextType = {
    selectedSalon,
    salons: getSalons(),
    isLoading,
    selectSalon,
    refreshSalon,
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
