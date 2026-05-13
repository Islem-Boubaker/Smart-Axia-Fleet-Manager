import { useTranslatedData } from '../../../shared/hooks/useTranslatedData';
import type { Maintenance } from '../../../types';
import { useMaintenance } from './useMaintenance';
import type { MaintenanceFilters } from '../services/maintenance.service';

// Module-level constants → stable references, never trigger extra renders
const MAINTENANCE_FIELDS: (keyof Maintenance)[] = ['description', 'type'];

/**
 * Drop-in replacement for useMaintenance that automatically translates
 * the `description` and `type` fields of every record to the active UI language.
 *
 * - English → no API call, zero overhead.
 * - fr / ar → single batched Azure Translator request per language change.
 * - All mutations (start, complete, cancel, updateStatus) are preserved unchanged.
 *
 * Swap useMaintenance → useTranslatedMaintenance in MaintenancePage.tsx
 * and the table/cards will show translated text automatically.
 */
export const useTranslatedMaintenance = (
  filters: MaintenanceFilters = {},
  options?: { includeSummary?: boolean },
) => {
  const base = useMaintenance(filters, options);

  const { translatedData: records, isTranslating: isTranslatingRecords } =
    useTranslatedData<Maintenance>(base.records as Maintenance[], MAINTENANCE_FIELDS);

  const { translatedData: upcoming } = useTranslatedData<Maintenance>(
    base.upcoming as Maintenance[],
    MAINTENANCE_FIELDS,
  );

  const { translatedData: overdue } = useTranslatedData<Maintenance>(
    base.overdue as Maintenance[],
    MAINTENANCE_FIELDS,
  );

  return {
    ...base,
    records,
    upcoming,
    overdue,
    isLoading: base.isLoading || isTranslatingRecords,
  };
};
