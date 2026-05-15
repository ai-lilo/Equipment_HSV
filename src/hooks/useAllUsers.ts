import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    supabase
      .from('users')
      .select('id, username, role, created_at, push_subscription')
      .order('username')
      .then(({ data }) => setUsers((data ?? []) as User[]))
  }, [])

  return users
}
