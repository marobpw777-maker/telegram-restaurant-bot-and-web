// Re-export types from API services
export type { BookingWithUser, TimeSlot } from '@/services/api/bookings'
export type { Category, MenuItem, MenuItemWithCategory } from '@/services/api/menu'

// Extended types for UI
export interface RestaurantInfo {
  name: string
  description: string
  address: string
  phone: string
  email: string
  workingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean }
  }
  socialLinks: {
    instagram?: string
    telegram?: string
    facebook?: string
  }
  coordinates: {
    lat: number
    lng: number
  }
}

export interface DashboardMetrics {
  totalReservationsToday: number
  averageCheck: number
  noShowRate: number
  totalGuestsToday: number
}

// Legacy types for compatibility
export interface Dish {
  id: number | string
  name: string
  description: string
  price: number
  weight: string
  image?: string
  categoryId: number | string
  isSpicy?: boolean
  isHit?: boolean
  isNew?: boolean
  allergens?: string[]
  ingredients?: string[]
  isAvailable: boolean
}

export interface Reservation {
  id: number | string
  date: string
  time: string
  duration: number
  guestName: string
  guestPhone: string
  guestCount: number
  comment?: string
  status: 'confirmed' | 'cancelled' | 'noshow' | 'pending'
  createdAt: string
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'noshow' | 'pending'
