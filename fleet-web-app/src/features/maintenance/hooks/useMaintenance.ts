import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  maintenanceService,
  type MaintenanceFilters,
  type PaginationMeta,
} from '../services/maintenance.service';
import { queryKeys } from '../../../shared/services/queryKeys';

const toApiMessage = (err: unknown, fallback: string) => {
  if (!(err instanceof Object) || !("response" in err)) return fallback;
  const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
  const status = Number(response?.status);
  const message = response?.data?.message;

  if (status === 422) return message || 'Validation error: please review the form values.';
  if (status === 409) return message || 'Conflict: this operation is not allowed right now.';
  if (status === 404) return message || 'Maintenance record not found.';
  if (status === 401 || status === 403) return message || 'You are not authorized to perform this action.';
  if (status >= 500) return message || 'Server error. Please try again.';

  return message || fallback;
};

export const useMaintenance = (
  filters: MaintenanceFilters = {},
  options?: { includeSummary?: boolean }
) => {
  const includeSummaryQueries = Boolean(options?.includeSummary);
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const recordsQuery = useQuery({
    queryKey: queryKeys.maintenance.list(filters),
    queryFn: () => maintenanceService.getAll(filters),
  });

  const upcomingQuery = useQuery({
    queryKey: queryKeys.maintenance.upcoming(),
    queryFn: () => maintenanceService.upcoming(),
    enabled: includeSummaryQueries,
  });

  const overdueQuery = useQuery({
    queryKey: queryKeys.maintenance.overdue({ page: 1, limit: 10 }),
    queryFn: () => maintenanceService.overdue({ page: 1, limit: 10 }),
    enabled: includeSummaryQueries,
  });

  const startMutation = useMutation({ mutationFn: maintenanceService.start });
  const completeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: { cost?: number; mileage?: number; description?: string; attachments?: string[] };
    }) => maintenanceService.complete(id, data),
  });
  const cancelMutation = useMutation({ mutationFn: maintenanceService.cancel });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => maintenanceService.updateStatus(id, status),
  });

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setActionError(null);
      await action();
      await queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    } catch (err: unknown) {
      setActionError(toApiMessage(err, 'Maintenance action failed.'));
      throw err;
    }
  };

  const fallbackMeta: PaginationMeta = {
    totalItems: 0,
    totalPages: 0,
    currentPage: filters.page ?? 1,
    pageSize: filters.limit ?? 10,
  };

  const isLoading =
    recordsQuery.isLoading ||
    (includeSummaryQueries && upcomingQuery.isLoading) ||
    (includeSummaryQueries && overdueQuery.isLoading) ||
    startMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending ||
    statusMutation.isPending;

  const queryError = recordsQuery.error || (includeSummaryQueries ? upcomingQuery.error : null) || (includeSummaryQueries ? overdueQuery.error : null);
  const error = actionError ?? (queryError ? toApiMessage(queryError, 'Failed to fetch maintenances.') : null);

  return {
    records: recordsQuery.data?.items ?? [],
    meta: recordsQuery.data?.meta ?? fallbackMeta,
    upcoming: includeSummaryQueries ? (upcomingQuery.data?.items ?? []) : [],
    overdue: includeSummaryQueries ? (overdueQuery.data?.items ?? []) : [],
    isLoading,
    error,
    refetch: () => recordsQuery.refetch(),
    startMaintenance: (id: string) =>
      runAction(async () => {
        const current = await maintenanceService.getById(id);
        if (current.status !== 'scheduled' && current.status !== 'pending') {
          const message = `Cannot start maintenance from status '${current.status}'.`;
          setActionError(message);
          throw new Error(message);
          return;
        }
        await startMutation.mutateAsync(id);
      }),
    completeMaintenance: (
      id: string,
      data?: { cost?: number; mileage?: number; description?: string; attachments?: string[] }
    ) =>
      runAction(async () => {
        const current = await maintenanceService.getById(id);
        if (current.status !== 'in_progress') {
          const message = `Cannot complete maintenance from status '${current.status}'.`;
          setActionError(message);
          throw new Error(message);
          return;
        }
        await completeMutation.mutateAsync({ id, data });
      }),
    cancelMaintenance: (id: string) => runAction(() => cancelMutation.mutateAsync(id)),
    updateStatus: (id: string, status: string) => runAction(() => statusMutation.mutateAsync({ id, status })),
  };
};
