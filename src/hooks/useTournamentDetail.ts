import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { TournamentCategory, TournamentTask, TournamentNote, BestPractice, TaskStatus } from '../types/tournament'

export function useTournamentDetail(tournamentId: string | null) {
  const [categories, setCategories] = useState<TournamentCategory[]>([])
  const [tasks, setTasks] = useState<TournamentTask[]>([])
  const [note, setNoteState] = useState<TournamentNote | null>(null)
  const [bestPractices, setBestPractices] = useState<BestPractice[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!tournamentId) return
    setLoading(true)
    const [cats, tsks, notes, bp] = await Promise.all([
      supabase.from('tournament_categories').select('*').eq('tournament_id', tournamentId).order('sort_order'),
      supabase.from('tasks').select(`
        *,
        tournament_categories!inner(tournament_id)
      `).eq('tournament_categories.tournament_id', tournamentId).order('created_at'),
      supabase.from('tournament_notes').select('*').eq('tournament_id', tournamentId).maybeSingle(),
      supabase.from('best_practices').select('*').eq('tournament_id', tournamentId).order('generated_at', { ascending: false }),
    ])
    setCategories((cats.data ?? []) as TournamentCategory[])
    setTasks((tsks.data ?? []) as TournamentTask[])
    setNoteState(notes.data as TournamentNote | null)
    setBestPractices((bp.data ?? []) as BestPractice[])
    setLoading(false)
  }, [tournamentId])

  useEffect(() => { load() }, [load])

  // --- Categories ---
  async function addCategory(name: string) {
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0)
    await supabase.from('tournament_categories').insert({ tournament_id: tournamentId, name, sort_order: maxOrder + 10 })
    await load()
  }

  async function renameCategory(id: string, name: string) {
    await supabase.from('tournament_categories').update({ name }).eq('id', id)
    await load()
  }

  async function deleteCategory(id: string) {
    await supabase.from('tournament_categories').delete().eq('id', id)
    await load()
  }

  async function reorderCategories(orderedIds: string[]) {
    const updates = orderedIds.map((id, i) =>
      supabase.from('tournament_categories').update({ sort_order: (i + 1) * 10 }).eq('id', id)
    )
    await Promise.all(updates)
    await load()
  }

  // --- Tasks ---
  async function addTask(categoryId: string, title: string, userId?: string) {
    await supabase.from('tasks').insert({ category_id: categoryId, title, created_by: userId ?? null })
    await load()
  }

  async function updateTask(id: string, changes: Partial<Pick<TournamentTask, 'title' | 'status' | 'responsible_user_id' | 'due_date' | 'notes'>>) {
    await supabase.from('tasks').update(changes).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // --- Notes ---
  async function saveNote(content: string) {
    if (note) {
      const { data } = await supabase
        .from('tournament_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', note.id)
        .select()
        .single()
      setNoteState(data as TournamentNote)
    } else {
      const { data } = await supabase
        .from('tournament_notes')
        .insert({ tournament_id: tournamentId, content })
        .select()
        .single()
      setNoteState(data as TournamentNote)
    }
  }

  async function saveBestPractice(content: string) {
    const { data } = await supabase
      .from('best_practices')
      .insert({ tournament_id: tournamentId, content })
      .select()
      .single()
    if (data) setBestPractices(prev => [data as BestPractice, ...prev])
  }

  return {
    categories,
    tasks,
    note,
    bestPractices,
    loading,
    load,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
    addTask,
    updateTask,
    deleteTask,
    saveNote,
    saveBestPractice,
  }
}

export type TaskStatusFilter = TaskStatus | 'ueberfaellig' | null

export function isOverdue(task: TournamentTask): boolean {
  if (!task.due_date || task.status === 'abgeschlossen') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}
