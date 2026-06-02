import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sendLoginOTP, verifyLoginOTP, getSessionUser, logout as authLogout } from '../lib/auth'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [otpEmail, setOtpEmail] = useState<string | null>(null)

  useEffect(() => {
    const timeout = new Promise<User | null>(resolve => setTimeout(() => resolve(null), 8000))
    Promise.race([getSessionUser().catch(() => null), timeout])
      .then(u => setUser(u))
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const u = await getSessionUser()
        setUser(u)
      } else {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function sendOTP(email: string) {
    setLoading(true)
    setError(null)
    try {
      await sendLoginOTP(email)
      setOtpEmail(email)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Senden des Codes')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOTP(token: string) {
    if (!otpEmail) return
    setLoading(true)
    setError(null)
    try {
      const u = await verifyLoginOTP(otpEmail, token)
      setUser(u)
      setOtpEmail(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falscher Code')
    } finally {
      setLoading(false)
    }
  }

  function resetOTP() {
    setOtpEmail(null)
    setError(null)
  }

  async function logout() {
    await authLogout()
    setUser(null)
    setOtpEmail(null)
  }

  return { user, loading, error, otpEmail, sendOTP, verifyOTP, resetOTP, logout }
}
