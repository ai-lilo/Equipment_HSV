import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/handleError'
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
      supabase.from('equipment').select('id,name,count,room_id,cabinet_id,category_id,status,defect_note,photo_url,description,updated_at').order('name'),
    ])
    handleSupabaseError(r.error)
    handleSupabaseError(c.error)
    handleSupabaseError(e.error)
    setRooms((r.data ?? []) as Room[])
    setCabinets((c.data ?? []) as Cabinet[])
    setEquipment((e.data ?? []) as Equipment[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { rooms, cabinets, equipment, loading, reload: load }
}
