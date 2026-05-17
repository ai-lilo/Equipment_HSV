import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Tournament, TournamentTemplate, TournamentCategory, TournamentTask } from '../types/tournament'

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [templates, setTemplates] = useState<TournamentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [t, tmpl] = await Promise.all([
      supabase
        .from('tournaments')
        .select('*')
        .eq('is_template', false)
        .order('date', { ascending: false }),
      supabase
        .from('tournament_templates')
        .select('*')
        .order('name'),
    ])
    setTournaments((t.data ?? []) as Tournament[])
    setTemplates((tmpl.data ?? []) as TournamentTemplate[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createTournament(name: string, date: string, templateId: string | null, userId: string): Promise<Tournament | null> {
    const { data: newT, error } = await supabase
      .from('tournaments')
      .insert({ name, date, created_by: userId })
      .select()
      .single()

    if (error || !newT) return null

    if (templateId) {
      await copyFromTemplate(newT.id, templateId)
    }

    await load()
    return newT as Tournament
  }

  async function copyFromTemplate(newTournamentId: string, templateId: string) {
    const template = templates.find(t => t.id === templateId)
    if (!template?.source_tournament_id) return

    const [cats, tasks] = await Promise.all([
      supabase
        .from('tournament_categories')
        .select('*')
        .eq('tournament_id', template.source_tournament_id)
        .order('sort_order'),
      supabase
        .from('tasks')
        .select('*'),
    ])

    const srcCategories = (cats.data ?? []) as TournamentCategory[]
    const allTasks = (tasks.data ?? []) as TournamentTask[]

    for (const cat of srcCategories) {
      const { data: newCat } = await supabase
        .from('tournament_categories')
        .insert({ tournament_id: newTournamentId, name: cat.name, sort_order: cat.sort_order })
        .select()
        .single()

      if (!newCat) continue

      const catTasks = allTasks.filter(t => t.category_id === cat.id)
      if (catTasks.length === 0) continue

      await supabase.from('tasks').insert(
        catTasks.map(t => ({
          category_id: newCat.id,
          title: t.title,
          status: 'nicht_begonnen',
        }))
      )
    }
  }

  async function buildTemplateFromTournament(sourceTournamentId: string): Promise<string | null> {
    const [cats, allTasksRes] = await Promise.all([
      supabase
        .from('tournament_categories')
        .select('*')
        .eq('tournament_id', sourceTournamentId)
        .order('sort_order'),
      supabase.from('tasks').select('*'),
    ])

    const srcCats = (cats.data ?? []) as TournamentCategory[]
    const allTasks = (allTasksRes.data ?? []) as TournamentTask[]

    const { data: tmplTournament } = await supabase
      .from('tournaments')
      .insert({ name: '_template_', date: '2000-01-01', is_template: true })
      .select()
      .single()

    if (!tmplTournament) return null
    const tmplId = (tmplTournament as Tournament).id

    for (const cat of srcCats) {
      const { data: newCat } = await supabase
        .from('tournament_categories')
        .insert({ tournament_id: tmplId, name: cat.name, sort_order: cat.sort_order })
        .select()
        .single()
      if (!newCat) continue

      const catTasks = allTasks.filter(t => t.category_id === cat.id)
      if (catTasks.length === 0) continue

      await supabase.from('tasks').insert(
        catTasks.map(t => ({
          category_id: (newCat as TournamentCategory).id,
          title: t.title,
          status: 'nicht_begonnen',
        }))
      )
    }

    return tmplId
  }

  async function createTemplateFromTournament(sourceTournamentId: string, templateName: string) {
    const tmplTournamentId = await buildTemplateFromTournament(sourceTournamentId)
    if (!tmplTournamentId) return
    await supabase.from('tournament_templates').insert({ name: templateName, source_tournament_id: tmplTournamentId })
    await load()
  }

  async function replaceTemplate(existingTemplateId: string, sourceTournamentId: string) {
    const existing = templates.find(t => t.id === existingTemplateId)

    const tmplTournamentId = await buildTemplateFromTournament(sourceTournamentId)
    if (!tmplTournamentId) return

    if (existing?.source_tournament_id) {
      await supabase.from('tournaments').delete().eq('id', existing.source_tournament_id)
    }

    await supabase
      .from('tournament_templates')
      .update({ source_tournament_id: tmplTournamentId })
      .eq('id', existingTemplateId)

    await load()
  }

  async function archiveTournament(id: string) {
    await supabase.from('tournaments').update({ archived: true }).eq('id', id)
    await load()
  }

  async function unarchiveTournament(id: string) {
    await supabase.from('tournaments').update({ archived: false }).eq('id', id)
    await load()
  }

  async function deleteTournament(id: string) {
    await supabase.from('tournaments').delete().eq('id', id)
    await load()
  }

  return { tournaments, templates, loading, load, createTournament, archiveTournament, unarchiveTournament, deleteTournament, createTemplateFromTournament, replaceTemplate }
}
