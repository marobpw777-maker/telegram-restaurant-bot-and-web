
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUnitEconomicsReport, fetchUnitEconomicsSettings, updateUnitEconomicsSettings } from '@/services/api/economics'

export const useUnitEconomicsReport = (months = 6) => {
  return useQuery({
    queryKey: ['unit-economics-report', months],
    queryFn: () => fetchUnitEconomicsReport(months),
    staleTime: 60 * 1000,
  })
}

export const useUnitEconomicsSettings = () => {
  return useQuery({
    queryKey: ['unit-economics-settings'],
    queryFn: fetchUnitEconomicsSettings,
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateUnitEconomicsSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUnitEconomicsSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(['unit-economics-settings'], settings)
      queryClient.invalidateQueries({ queryKey: ['unit-economics-report'] })
    },
  })
}
