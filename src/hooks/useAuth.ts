import { useState, useEffect } from 'react'
import { getSession, login as authLogin, logout as authLogout } from '../lib/auth'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getSession())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUser(getSession())
  }, [])

  async function login(username: string) {
    setLoading(true)
    setError(null)
    try {
      const u = await authLogin(username)
      setUser(u)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anmelden')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    authLogout()
    setUser(null)
  }

  return { user, loading, error, login, logout }
}
