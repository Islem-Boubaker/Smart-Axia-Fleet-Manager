import { useState, useCallback, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import { GlobalCard } from '../../../shared/components';
import MaintenanceTable from '../components/MaintenanceTable';
import MaintenanceForm from '../components/MaintenanceForm';
import { MaintenanceHeader } from '../components/MaintenanceHeader';
import { useMaintenance } from '../hooks/useMaintenance';
import { maintenanceService } from '../services/maintenance.service';
import type { Maintenance } from '../../../types';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';

interface ThemeContext {
  dark: boolean;
}

const MaintenancePage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    records,
    isLoading,
    error,
    refetch,
    startMaintenance,
    completeMaintenance,
  } = useMaintenance({ page: 1, limit: 20 });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<Maintenance | null>(null);
  const [recordToRemove, setRecordToRemove] = useState<Maintenance | null>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const prefilledMaintenance = useMemo(() => {
    if (searchParams.get('schedule') !== '1') return undefined;

    return {
      vehicleId: searchParams.get('vehicleId') || '',
      reclamationId: searchParams.get('reclamationId') || '',
      vehiclePlate: searchParams.get('vehiclePlate') || '',
      type: searchParams.get('type') || 'General Inspection',
      scheduledDate: '',
      technician: searchParams.get('technician') || 'Pending assignment',
      priority: searchParams.get('priority') || 'high',
      status: 'scheduled',
      cost: searchParams.get('cost') || '0',
      mileage: searchParams.get('mileage') || '',
      description: searchParams.get('description') || '',
    };
  }, [searchParams]);

  const clearPrefillParams = useCallback(() => {
    if (searchParams.get('source') !== 'reclamation' && searchParams.get('schedule') !== '1') return;
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (prefilledMaintenance) {
      setSubmitError(null);
      setIsScheduleModalOpen(true);
    }
  }, [prefilledMaintenance]);

  const normalizeMaintenanceErrorMessage = useCallback((message?: string | null, fallback?: string) => {
    const normalized = String(message || '').trim().toLowerCase();
    if (normalized.includes('only available vehicles can be scheduled for maintenance')) {
      return fallback || 'Failed to schedule maintenance.';
    }
    return message || fallback || 'Failed to schedule maintenance.';
  }, []);

  const handleScheduleMaintenance = useCallback(async (data: Record<string, unknown>) => {
    try {
      setSubmitError(null);
      await maintenanceService.create(data);
      await refetch();
      setIsScheduleModalOpen(false);
      clearPrefillParams();
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      const status = Number(response?.status);
      const data = (response?.data || {}) as { message?: string; errors?: string[] };
      const message = data.message;
      const detailed = Array.isArray(data.errors) && data.errors.length > 0
        ? data.errors.join(' | ')
        : null;

      if (status === 422) {
        setSubmitError(detailed || message || 'Validation error: please complete all required fields.');
        return;
      }

      if (status === 409) {
        setSubmitError(normalizeMaintenanceErrorMessage(message, 'Conflict: maintenance schedule overlaps or transition is invalid.'));
        return;
      }

      if (status === 401 || status === 403) {
        setSubmitError(message || 'You are not authorized to create maintenance records.');
        return;
      }

      if (status === 404) {
        setSubmitError(normalizeMaintenanceErrorMessage(message, 'Vehicle not found.'));
        return;
      }

      setSubmitError(normalizeMaintenanceErrorMessage(message, 'Failed to schedule maintenance.'));
    }
  }, [clearPrefillParams, normalizeMaintenanceErrorMessage, refetch]);

  const handleTransition = useCallback(async (record: Maintenance) => {
    if (record.status === 'scheduled' || record.status === 'pending') {
      await startMaintenance(record.id);
      return;
    }

    if (record.status === 'in_progress') {
      await completeMaintenance(record.id);
    }
  }, [startMaintenance, completeMaintenance]);

  const handleOpenEdit = useCallback((record: Maintenance) => {
    setEditError(null);
    setRecordToEdit(record);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateMaintenance = useCallback(async (data: Record<string, unknown>) => {
    if (!recordToEdit?.id) return;

    try {
      setEditError(null);
      await maintenanceService.update(recordToEdit.id, data as Partial<Maintenance>);
      await refetch();
      setIsEditModalOpen(false);
      setRecordToEdit(null);
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string; errors?: string[] } } })?.response;
      const status = Number(response?.status);
      const message = response?.data?.message;
      const detailed = Array.isArray(response?.data?.errors) ? response?.data?.errors.join(' | ') : null;

      if (status === 422) {
        setEditError(detailed || message || 'Validation error while updating maintenance.');
        return;
      }

      setEditError(message || 'Failed to update maintenance.');
    }
  }, [recordToEdit, refetch]);

  const handleAskRemoveMaintenance = useCallback((record: Maintenance) => {
    setActionError(null);
    setRecordToRemove(record);
    setIsRemoveModalOpen(true);
  }, []);

  const handleConfirmRemoveMaintenance = useCallback(async () => {
    if (!recordToRemove?.id) return;

    try {
      setIsRemoving(true);
      setActionError(null);
      await maintenanceService.remove(recordToRemove.id);
      await refetch();
      setIsRemoveModalOpen(false);
      setRecordToRemove(null);
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      const message = response?.data?.message;
      setActionError(message || 'Failed to remove maintenance record.');
    } finally {
      setIsRemoving(false);
    }
  }, [recordToRemove, refetch]);

  return (
    <>
      <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
        <MaintenanceHeader onSchedule={() => setIsScheduleModalOpen(true)} dark={dark} />

        {(error || actionError) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {error || actionError}
          </div>
        )}

        {isLoading ? (
          <div className={`text-center py-16 rounded-2xl border ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            Loading…
          </div>
        ) : (
          <MaintenanceTable
            data={records}
            dark={dark}
            onUpdate={refetch}
            onTransition={handleTransition}
            onEdit={handleOpenEdit}
            onRemove={handleAskRemoveMaintenance}
          />
        )}
      </div>

      <GlobalCard
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          clearPrefillParams();
        }}
        title="Schedule maintenance"
        maxWidth="2xl"
      >
        {submitError && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {submitError}
          </div>
        )}
        <MaintenanceForm
          dark={dark}
          initialValues={prefilledMaintenance}
          onSubmit={handleScheduleMaintenance}
          onCancel={() => {
            setIsScheduleModalOpen(false);
            clearPrefillParams();
          }}
        />
      </GlobalCard>

      <GlobalCard
        isOpen={isRemoveModalOpen}
        onClose={() => {
          if (isRemoving) return;
          setIsRemoveModalOpen(false);
          setRecordToRemove(null);
        }}
        title="Remove maintenance"
        maxWidth="md"
        footer={(
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (isRemoving) return;
                setIsRemoveModalOpen(false);
                setRecordToRemove(null);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                dark
                  ? 'text-slate-200 bg-slate-700/60 hover:bg-slate-700'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
              disabled={isRemoving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRemoveMaintenance}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                dark
                  ? 'text-rose-100 bg-rose-600 hover:bg-rose-500'
                  : 'text-white bg-rose-600 hover:bg-rose-500'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Yes, remove'}
            </button>
          </div>
        )}
      >
        <div className={`rounded-xl border p-4 ${dark ? 'border-rose-900/50 bg-rose-950/30' : 'border-rose-200 bg-rose-50/70'}`}>
          <p className={`text-sm ${dark ? 'text-rose-100' : 'text-rose-900'}`}>
            This action will permanently delete this maintenance record.
          </p>
          <div className={`mt-3 space-y-1 text-sm ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
            <p>
              <span className="font-semibold">Type:</span> {recordToRemove?.type || 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Vehicle:</span>{' '}
              {recordToRemove?.vehicleName
                ? `${recordToRemove.vehicleName}${recordToRemove.vehiclePlate ? ` (${recordToRemove.vehiclePlate})` : ''}`
                : recordToRemove?.vehiclePlate || 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Scheduled date:</span> {recordToRemove?.scheduledDate || 'N/A'}
            </p>
          </div>
        </div>
      </GlobalCard>

      <GlobalCard
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setRecordToEdit(null);
          setEditError(null);
        }}
        title="Edit maintenance"
        maxWidth="2xl"
      >
        {editError && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {editError}
          </div>
        )}
        <MaintenanceForm
          dark={dark}
          maintenance={recordToEdit || undefined}
          onSubmit={handleUpdateMaintenance}
          onCancel={() => {
            setIsEditModalOpen(false);
            setRecordToEdit(null);
            setEditError(null);
          }}
        />
      </GlobalCard>
    </>
  );
};

export default MaintenancePage;
