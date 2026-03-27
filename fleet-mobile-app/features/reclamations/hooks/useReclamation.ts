import { useState, useCallback } from 'react';
import { reclamationApi } from '../services/reclamation.api';
import type { Reclamation, ReclamationDetails, CreateReclamationData } from '../types/reclamation.types';

/**
 * Hook for managing reclamation operations
 */
export function useReclamation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllReclamations = useCallback(async (): Promise<Reclamation[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const reclamations = await reclamationApi.getAllReclamations();
      return reclamations;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reclamations';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReclamationDetail = useCallback(async (reclamationId: string): Promise<ReclamationDetails> => {
    setIsLoading(true);
    setError(null);
    try {
      const details = await reclamationApi.getReclamationDetail(reclamationId);
      return details;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reclamation details';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReclamation = useCallback(async (data: CreateReclamationData): Promise<Reclamation> => {
    setIsLoading(true);
    setError(null);
    try {
      const reclamation = await reclamationApi.createReclamation(data);
      return reclamation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create reclamation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateReclamationStatus = useCallback(
    async (reclamationId: string, status: string): Promise<Reclamation> => {
      setIsLoading(true);
      setError(null);
      try {
        const reclamation = await reclamationApi.updateReclamationStatus(reclamationId, status);
        return reclamation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update reclamation status';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    getAllReclamations,
    getReclamationDetail,
    createReclamation,
    updateReclamationStatus,
  };
}