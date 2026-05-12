import { supabase } from './supabase'
import type { User } from '../types'

const SESSION_KEY = 'hsv_user'

export async function login(username: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !data) {
    throw new Error('Benutzername nicht gefunden')
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  return data as User
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): User | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function updateSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}
