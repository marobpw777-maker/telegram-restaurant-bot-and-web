// src/services/api/bookings.ts
// Работает с локальным REST API бота (http://localhost:8000/api)
import { format, addMinutes, parseISO } from 'date-fns'

const API_BASE = '/api'

export interface BookingWithUser {
  id: number
  telegram_id: number | null
  start_at: string
  duration_minutes: number
  guests_count: number
  customer_name: string
  phone: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rejected'
  attended: boolean
  source: 'website' | 'telegram'
  admin_comment: string | null
  created_at: string
  updated_at: string | null
  crm?: {
    no_show_count: number
    is_banned: boolean
    visits_count: number
    total_spent: number
  }
}

export interface TimeSlot {
  time: string
  available: boolean
}

export const fetchBookings = async (filters?: {
  startDate?: string
  endDate?: string
  status?: string
}): Promise<BookingWithUser[]> => {
  const params = new URLSearchParams()
  if (filters?.startDate) params.set('start_date', filters.startDate)
  if (filters?.endDate) params.set('end_date', filters.endDate)
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status)

  const res = await fetch(`${API_BASE}/bookings?${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const fetchUserBookings = async (_userId: string): Promise<BookingWithUser[]> => fetchBookings()

export const createBooking = async (booking: any): Promise<BookingWithUser> => {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const updateBooking = async (id: string | number, booking: any): Promise<BookingWithUser> => {
  const res = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const checkAvailability = async (date: string, duration: number, _excludeBookingId?: string): Promise<TimeSlot[]> => {
  const res = await fetch(`${API_BASE}/availability?date=${date}&duration=${duration}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const getAlternativeSlots = async (preferredDate: string, duration: number, rangeDays: number = 3): Promise<{ date: string; slots: TimeSlot[] }[]> => {
  const alternatives: { date: string; slots: TimeSlot[] }[] = []
  const baseDate = parseISO(preferredDate)

  for (let i = 1; i <= rangeDays; i++) {
    const nextDate = addMinutes(baseDate, i * 24 * 60)
    const prevDate = addMinutes(baseDate, -i * 24 * 60)

    const nextSlots = await checkAvailability(format(nextDate, 'yyyy-MM-dd'), duration)
    const prevSlots = await checkAvailability(format(prevDate, 'yyyy-MM-dd'), duration)

    const availableNext = nextSlots.filter((s) => s.available)
    const availablePrev = prevSlots.filter((s) => s.available)

    if (availableNext.length > 0) alternatives.push({ date: format(nextDate, 'yyyy-MM-dd'), slots: availableNext.slice(0, 3) })
    if (availablePrev.length > 0) alternatives.push({ date: format(prevDate, 'yyyy-MM-dd'), slots: availablePrev.slice(0, 3) })
  }

  return alternatives.sort((a, b) => Math.abs(parseISO(a.date).getTime() - baseDate.getTime()) - Math.abs(parseISO(b.date).getTime() - baseDate.getTime())).slice(0, 3)
}
