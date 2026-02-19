import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Salon } from '../services/salon.service';
import type { StaffUser } from '../services/staffAuth.service';
import { getAllSalons, getSalonById } from '../services/salon.service';

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
  const [staffVisibleSalons, setStaffVisibleSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeSalon = async () => {
      if (!isAuthenticated || !user) {
        if (!isMounted) return;
        setSelectedSalon(null);
        setStaffVisibleSalons([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      if (isStaff) {
        const staffUser = user as StaffUser;
        const fallbackSalon = staffUser.salon ? (staffUser.salon as unknown as Salon) : null;
        const storedSalonId = localStorage.getItem('selectedSalonId');

        try {
          const allSalons = await getAllSalons();
          if (!isMounted) return;

          setStaffVisibleSalons(allSalons);

          const selectedFromStorage = storedSalonId
            ? allSalons.find((salon) => salon.id === storedSalonId)
            : undefined;
          const selectedFromStaff = fallbackSalon
            ? allSalons.find((salon) => salon.id === fallbackSalon.id) || fallbackSalon
            : undefined;
          const selected = selectedFromStorage || selectedFromStaff || allSalons[0] || null;

          setSelectedSalon(selected);

          if (selected?.id) {
            localStorage.setItem('selectedSalonId', selected.id);
          } else {
            localStorage.removeItem('selectedSalonId');
          }
        } catch {
          if (!isMounted) return;
          const fallbackList = fallbackSalon ? [fallbackSalon] : [];
          setStaffVisibleSalons(fallbackList);
          setSelectedSalon(fallbackSalon);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }

        return;
      }

      const ownerUser = user as any;
      const ownerSalons: Salon[] = ownerUser.salons || [];

      if (!isMounted) return;

      if (ownerSalons.length === 0) {
        setSelectedSalon(null);
        setIsLoading(false);
        return;
      }

      const storedSalonId = localStorage.getItem('selectedSalonId');
      const selectedFromStorage = storedSalonId
        ? ownerSalons.find((salon) => salon.id === storedSalonId)
        : undefined;
      const selected = selectedFromStorage || ownerSalons[0];

      setSelectedSalon(selected);
      localStorage.setItem('selectedSalonId', selected.id);
      setIsLoading(false);
    };

    void initializeSalon();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthenticated, isStaff]);

  const refreshSalon = async () => {
    if (!selectedSalon) return;

    try {
      const updatedSalon = await getSalonById(selectedSalon.id);
      const normalizedSalon = updatedSalon as unknown as Salon;

      setSelectedSalon(normalizedSalon);

      if (isStaff) {
        setStaffVisibleSalons((prev) =>
          prev.map((salon) => (salon.id === normalizedSalon.id ? normalizedSalon : salon))
        );
      }

      if (!isStaff && user) {
        const ownerUser = user as any;
        if (ownerUser.salons) {
          const salonIndex = ownerUser.salons.findIndex((s: Salon) => s.id === selectedSalon.id);
          if (salonIndex !== -1) {
            ownerUser.salons[salonIndex] = normalizedSalon;
            localStorage.setItem('user', JSON.stringify(ownerUser));
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du rafraichissement du salon:', error);
      throw error;
    }
  };

  const selectSalon = (salonId: string) => {
    const availableSalons: Salon[] = isStaff
      ? staffVisibleSalons
      : (((user as any)?.salons || []) as Salon[]);

    const salon = availableSalons.find((s) => s.id === salonId);
    if (salon) {
      setSelectedSalon(salon);
      localStorage.setItem('selectedSalonId', salonId);
    }
  };

  const getSalons = (): Salon[] => {
    if (!user) return [];
    if (isStaff) return staffVisibleSalons;
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

export function useSalon() {
  const context = useContext(SalonContext);
  if (context === undefined) {
    throw new Error('useSalon doit etre utilise dans un SalonProvider');
  }
  return context;
}
