import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data ?? []) as Category[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addCategory(name: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('categories').insert({ name: name.trim() })
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }

  async function renameCategory(id: string, name: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('categories').update({ name: name.trim() }).eq('id', id)
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }

  async function deleteCategory(id: string): Promise<{ error: string | null }> {
    const { count } = await supabase
      .from('equipment')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
    if ((count ?? 0) > 0) {
      return { error: `Diese Kategorie wird noch von ${count} Equipment-Einträgen verwendet und kann nicht gelöscht werden.` }
    }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }

  return { categories, loading, reload: load, addCategory, renameCategory, deleteCategory }
}
