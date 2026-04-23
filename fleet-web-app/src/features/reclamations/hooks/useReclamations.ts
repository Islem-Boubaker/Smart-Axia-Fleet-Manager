import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import reclamationsService, { type ReclamationStatus } from '../services/reclamations.service'
import { queryKeys } from '../../../shared/services/queryKeys'

export interface ReclamationFilters {
  page?: number
  limit?: number
}

export const useReclamations = (filters: ReclamationFilters = {}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 50

  return useQuery({
    queryKey: queryKeys.reclamations.list({ page, limit }),
    queryFn: () => reclamationsService.getAll(page, limit),
  })
}

export const useReclamation = (id: string) => {
  return useQuery({
    queryKey: queryKeys.reclamations.detail(id),
    queryFn: () => reclamationsService.getById(id),
    enabled: Boolean(id),
  })
}

export const useMyReclamations = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.reclamations.my(),
    queryFn: async () => {
      const data = await reclamationsService.getAll(1, 200)
      if (!userId) return data.items
      return data.items.filter((item) => String(item.userId) === String(userId))
    },
  })
}

export const useCreateReclamation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reclamationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export const useUpdateReclamation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { subject?: string; message?: string; vehicleId?: string }
    }) => reclamationsService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export const useDeleteReclamation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reclamationsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export const useUpdateReclamationStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReclamationStatus }) =>
      reclamationsService.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reclamations.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export const useUploadReclamationAttachments = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error('Attachment upload endpoint is not implemented yet')
    },
  })
}
