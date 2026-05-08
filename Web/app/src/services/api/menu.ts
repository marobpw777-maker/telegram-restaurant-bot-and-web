// src/services/api/menu.ts
// Работает с локальным REST API бота (http://localhost:8000/api)

const API_BASE = '/api'

export interface Category {
  id: number
  name: string
  type: 'food' | 'drink' | 'wine' | 'dessert'
  description: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string | null
}

export interface MenuItem {
  id: number
  category_id: number
  name: string
  description: string | null
  price: number
  weight: string | null
  composition: string | null
  allergens: string | null
  spice_level: number | null
  is_available: boolean
  is_hit: boolean
  is_new: boolean
  image_url: string | null
  vintage?: string | null
  region?: string | null
  grape_variety?: string | null
  wine_type?: string | null
  food_pairing?: string | null
  created_at: string
  updated_at: string | null
}

export interface MenuItemWithCategory extends MenuItem {
  category?: Category
}

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${API_BASE}/categories`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const fetchMenuItems = async (categoryId?: string | number): Promise<MenuItemWithCategory[]> => {
  const params = categoryId ? `?category_id=${categoryId}` : ''
  const res = await fetch(`${API_BASE}/menu-items${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const createMenuItem = async (item: any): Promise<MenuItem> => {
  const res = await fetch(`${API_BASE}/menu-items`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const updateMenuItem = async (id: string | number, item: any): Promise<MenuItem> => {
  const res = await fetch(`${API_BASE}/menu-items/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const deleteMenuItem = async (id: string | number): Promise<void> => {
  const res = await fetch(`${API_BASE}/menu-items/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export const createCategory = async (category: any): Promise<Category> => {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const updateCategory = async (id: string | number, category: any): Promise<Category> => {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const deleteCategory = async (id: string | number): Promise<void> => {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
