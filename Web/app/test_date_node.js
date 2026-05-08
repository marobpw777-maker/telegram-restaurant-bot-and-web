import { format, addMinutes, parseISO, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const RESTAURANT_TIMEZONE = 'Europe/Moscow'

async function checkAvailability(date, duration) {
  const zonedDate = toZonedTime(parseISO(date), RESTAURANT_TIMEZONE)
  const dayStart = startOfDay(zonedDate)
  const dayEnd = endOfDay(zonedDate)
  
  // Convert back to UTC for query
  const utcStart = fromZonedTime(dayStart, RESTAURANT_TIMEZONE).toISOString()
  const utcEnd = fromZonedTime(dayEnd, RESTAURANT_TIMEZONE).toISOString()
  
  const existingBookings = []
  
  // Generate time slots from 10:00 to 22:00
  const slots = []
  const startHour = 10
  const endHour = 22
  
  const now = new Date()
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = new Date(zonedDate)
      slotTime.setHours(hour, minute, 0, 0)
      
      // Skip past times
      if (slotTime < now) continue
      
      const slotUTC = fromZonedTime(slotTime, RESTAURANT_TIMEZONE)
      const slotEnd = addMinutes(slotUTC, duration)
      
      slots.push({
        time: format(slotTime, 'HH:mm'),
        available: true,
      })
    }
  }
  return slots
}

checkAvailability('2026-03-31', 90).then(console.log).catch(console.error)
