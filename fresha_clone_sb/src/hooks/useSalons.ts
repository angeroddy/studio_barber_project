import { useState, useCallback, useEffect } from 'react';
import {
  Salon,
  CreateSalonData,
  UpdateSalonData,
  getMySalons,
  createSalon as createSalonApi,
  updateSalon as updateSalonApi,
  deleteSalon as deleteSalonApi,
  getSalonById,
  getSalonBySlug,
} from '../services/salon.service';

interface UseSalonsReturn {
  salons: Salon[];
  currentSalon: Salon | null;
  loading: boolean;
  error: string | null;
  fetchMySalons: () => Promise<void>;
  fetchSalonById: (id: string) => Promise<void>;
  fetchSalonBySlug: (slug: string) => Promise<void>;
  createSalon: (data: CreateSalonData) => Promise<Salon | null>;
  updateSalon: (id: string, data: UpdateSalonData) => Promise<Salon | null>;
  deleteSalon: (id: string) => Promise<boolean>;
  clearError: () => void;
  setCurrentSalon: (salon: Salon | null) => void;
}

/**
 * Hook personnalisé pour gérer l'état des salons
 */
export const useSalons = (autoFetch: boolean = false): UseSalonsReturn => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupérer tous les salons du propriétaire connecté
   */
  const fetchMySalons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMySalons();
      setSalons(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des salons';
      setError(errorMessage);
      console.error('Erreur fetchMySalons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer un salon par ID
   */
  const fetchSalonById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalonById(id);
      setCurrentSalon(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du salon';
      setError(errorMessage);
      console.error('Erreur fetchSalonById:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer un salon par slug
   */
  const fetchSalonBySlug = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalonBySlug(slug);
      setCurrentSalon(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du salon';
      setError(errorMessage);
      console.error('Erreur fetchSalonBySlug:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Créer un nouveau salon
   */
  const createSalon = useCallback(async (data: CreateSalonData): Promise<Salon | null> => {
    setLoading(true);
    setError(null);
    try {
      const newSalon = await createSalonApi(data);
      // Ajouter le nouveau salon à la liste
      setSalons((prev) => [newSalon, ...prev]);
      setCurrentSalon(newSalon);
      return newSalon;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du salon';
      setError(errorMessage);
      console.error('Erreur createSalon:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre à jour un salon
   */
  const updateSalon = useCallback(async (id: string, data: UpdateSalonData): Promise<Salon | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedSalon = await updateSalonApi(id, data);
      // Mettre à jour le salon dans la liste
      setSalons((prev) =>
        prev.map((salon) => (salon.id === id ? updatedSalon : salon))
      );
      // Mettre à jour le salon courant si c'est celui-ci
      if (currentSalon && currentSalon.id === id) {
        setCurrentSalon(updatedSalon);
      }
      return updatedSalon;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du salon';
      setError(errorMessage);
      console.error('Erreur updateSalon:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentSalon]);

  /**
   * Supprimer un salon
   */
  const deleteSalon = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await deleteSalonApi(id);
      // Retirer le salon de la liste
      setSalons((prev) => prev.filter((salon) => salon.id !== id));
      // Vider le salon courant si c'est celui-ci
      if (currentSalon && currentSalon.id === id) {
        setCurrentSalon(null);
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du salon';
      setError(errorMessage);
      console.error('Erreur deleteSalon:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentSalon]);

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Auto-fetch au montage si activé
   */
  useEffect(() => {
    if (autoFetch) {
      fetchMySalons();
    }
  }, [autoFetch, fetchMySalons]);

  return {
    salons,
    currentSalon,
    loading,
    error,
    fetchMySalons,
    fetchSalonById,
    fetchSalonBySlug,
    createSalon,
    updateSalon,
    deleteSalon,
    clearError,
    setCurrentSalon,
  };
};
