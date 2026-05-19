import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ClubMember } from '../types/tournament'

export function useClubMembers() {
  const [members, setMembers] = useState<ClubMember[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('club_members').select('*').order('name')
    setMembers((data ?? []) as ClubMember[])
  }, [])

  useEffect(() => { load() }, [load])

  async function addMember(name: string) {
    const { data } = await supabase.from('club_members').insert({ name }).select().single()
    if (data) setMembers(prev => [...prev, data as ClubMember].sort((a, b) => a.name.localeCompare(b.name, 'de')))
  }

  async function updateMember(id: string, name: string) {
    await supabase.from('club_members').update({ name }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, name } : m))
  }

  async function deleteMember(id: string) {
    await supabase.from('club_members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  return { members, addMember, updateMember, deleteMember, reload: load }
}
