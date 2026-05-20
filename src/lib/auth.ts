import { supabase } from './supabase'
import type { User } from '../types'

async function loadUserByEmail(email: string): Promise<User | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  return data as User | null
}

export async function sendLoginOTP(email: string): Promise<void> {
  const user = await loadUserByEmail(email)
  if (!user) {
    throw new Error('Diese E-Mail ist nicht registriert. Bitte Admin kontaktieren.')
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: { shouldCreateUser: true },
  })
  if (error) throw new Error('Code konnte nicht gesendet werden: ' + error.message)
}

export async function verifyLoginOTP(email: string, token: string): Promise<User> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.toLowerCase().trim(),
    token,
    type: 'email',
  })
  if (error) throw new Error('Ungültiger oder abgelaufener Code. Bitte erneut versuchen.')
  const user = await loadUserByEmail(email)
  if (!user) throw new Error('Benutzer nicht gefunden.')
  return user
}

export async function getSessionUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) return null
  return loadUserByEmail(session.user.email)
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}
