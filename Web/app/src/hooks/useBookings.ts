import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { 
  fetchBookings, 
  fetchUserBookings, 
  createBooking, 
  updateBooking,
  checkAvailability,
  getAlternativeSlots
} from '@/services/api/bookings'

interface BookingFilters {
  startDate?: string
  endDate?: string
  status?: string
}

export const useBookings = (filters?: BookingFilters) => {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => fetchBookings(filters),
    staleTime: 1 * 60 * 1000,
  })
}

export const useUserBookings = (userId: string) => {
  return useQuery({
    queryKey: ['user-bookings', userId],
    queryFn: () => fetchUserBookings(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export const useUpdateBooking = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export const useAvailability = (date: string, duration: number, excludeBookingId?: string) => {
  return useQuery({
    queryKey: ['availability', date, duration, excludeBookingId],
    queryFn: () => checkAvailability(date, duration, excludeBookingId),
    enabled: !!date && !!duration,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}

export const useAlternativeSlots = (date: string, duration: number, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['alternative-slots', date, duration],
    queryFn: () => getAlternativeSlots(date, duration),
    enabled: enabled && !!date && !!duration,
  })
}
