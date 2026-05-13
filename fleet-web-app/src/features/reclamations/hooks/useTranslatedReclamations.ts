import { useTranslatedData } from '../../../shared/hooks/useTranslatedData';
import { useReclamations, type ReclamationFilters } from './useReclamations';
import type { ReclamationRecord } from '../services/reclamations.service';

const RECLAMATION_FIELDS: (keyof ReclamationRecord)[] = ['subject', 'message'];

/**
 * Drop-in replacement for useReclamations that automatically translates
 * the `subject` and `message` fields to the active UI language.
 *
 * All mutations available via the parent hooks (useCreateReclamation,
 * useUpdateReclamation, etc.) continue to work unchanged — this hook
 * only wraps the read query.
 *
 * Swap useReclamations → useTranslatedReclamations in the reclamations
 * page/table component to enable automatic translation.
 */
export const useTranslatedReclamations = (filters: ReclamationFilters = {}) => {
  const query = useReclamations(filters);

  const rawItems: ReclamationRecord[] = Array.isArray(query.data)
    ? (query.data as ReclamationRecord[])
    : [];

  const { translatedData, isTranslating } = useTranslatedData<ReclamationRecord>(
    rawItems,
    RECLAMATION_FIELDS,
  );

  return {
    ...query,
    data: query.data !== undefined ? translatedData : query.data,
    isTranslating,
  };
};
