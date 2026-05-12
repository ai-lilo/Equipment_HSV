import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Room, Cabinet, Equipment } from '../types'

export function useInventory() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [r, c, e] = await Promise.all([
      supabase.from('rooms').select('*').order('name'),
      supabase.from('cabinets').select('*').order('name'),
      supabase.from('equipment').select('*').order('name'),
    ])
    setRooms((r.data ?? []) as Room[])
    setCabinets((c.data ?? []) as Cabinet[])
    setEquipment((e.data ?? []) as Equipment[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { rooms, cabinets, equipment, loading, reload: load }
}
