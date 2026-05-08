
// src/services/api/economics.ts
const API_BASE = '/api'

export interface UnitEconomicsSettings {
  average_check: number
  average_guests_per_booking: number
  bookings_per_day: number
  occupancy_rate_percent: number
  no_show_rate_percent: number
  days_open_per_month: number
  tax_rate_percent: number
  payroll_tax_percent: number
  rent_monthly: number
  electricity_monthly: number
  water_monthly: number
  salaries_monthly: number
  marketing_monthly: number
  delivery_monthly: number
  other_fixed_monthly: number
  food_cost_percent: number
  acquiring_percent: number
  packaging_cost_per_guest: number
  other_variable_percent: number
}

export interface UnitEconomicsSensitivity {
  average_check_plus_10: number
  average_check_minus_10: number
  no_show_zero: number
  occupancy_plus_10: number
}

export interface UnitEconomicsPeriodRow {
  month: string
  bookings: number
  guests: number
  revenue: number
  gross_profit: number
  operating_profit: number
  net_profit: number
}

export interface UnitEconomicsReport {
  settings: UnitEconomicsSettings
  today_bookings: number
  today_guests: number
  today_no_show_rate: number
  today_revenue_estimate: number
  average_check: number
  bookings_per_day: number
  forecast_bookings_per_month: number
  forecast_guests_per_month: number
  forecast_revenue_per_month: number
  forecast_gross_profit_per_month: number
  forecast_operating_profit_per_month: number
  forecast_net_profit_per_month: number
  fixed_costs_per_month: number
  variable_costs_per_month: number
  fixed_cost_share: number
  variable_cost_share: number
  profit_per_guest: number
  profit_per_booking: number
  break_even_revenue: number
  break_even_guests: number
  no_show_lost_revenue: number
  no_show_lost_profit: number
  occupancy_rate_effective: number
  sensitivities: UnitEconomicsSensitivity
  weekly_series: { day: string; reservations: number; guests: number }[]
  monthly_forecast: UnitEconomicsPeriodRow[]
  formula_notes: string[]
}

export const fetchUnitEconomicsSettings = async (): Promise<UnitEconomicsSettings> => {
  const res = await fetch(`${API_BASE}/unit-economics/settings`, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const updateUnitEconomicsSettings = async (settings: UnitEconomicsSettings): Promise<UnitEconomicsSettings> => {
  const res = await fetch(`${API_BASE}/unit-economics/settings`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const fetchUnitEconomicsReport = async (months = 6): Promise<UnitEconomicsReport> => {
  const res = await fetch(`${API_BASE}/unit-economics/report?months=${months}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
