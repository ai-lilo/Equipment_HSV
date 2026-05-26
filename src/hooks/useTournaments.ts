import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../lib/handleError'
import type { Tournament, TournamentTemplate, TournamentCategory, TournamentTask, TournamentHelper } from '../types/tournament'

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
    handleSupabaseError(t.error, 'Turniere laden')
    handleSupabaseError(tmpl.error, 'Vorlagen laden')
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

    if (error || !newT) { handleSupabaseError(error, 'Turnier erstellen'); return null }

    if (templateId) {
      await copyFromTemplate(newT.id, templateId)
    }

    await load()
    return newT as Tournament
  }

  async function copyFromTemplate(newTournamentId: string, templateId: string) {
    const template = templates.find(t => t.id === templateId)
    if (!template?.source_tournament_id) return

    const srcTournamentId = template.source_tournament_id

    const [cats, hlp] = await Promise.all([
      supabase.from('tournament_categories').select('*').eq('tournament_id', srcTournamentId).order('sort_order'),
      supabase.from('tournament_helpers').select('*').eq('tournament_id', srcTournamentId).order('sort_order'),
    ])

    const srcCategories = (cats.data ?? []) as TournamentCategory[]
    const srcHelpers = (hlp.data ?? []) as TournamentHelper[]

    if (srcCategories.length === 0) return

    // Filter tasks server-side instead of loading entire DB
    const { data: tasksData } = await supabase.from('tasks').select('*')
      .in('category_id', srcCategories.map(c => c.id))
    const srcTasks = (tasksData ?? []) as TournamentTask[]

    // Map old task IDs → new task IDs for equipment link copying
    const taskIdMap = new Map<string, string>()

    for (const cat of srcCategories) {
      const { data: newCat } = await supabase
        .from('tournament_categories')
        .insert({ tournament_id: newTournamentId, name: cat.name, sort_order: cat.sort_order, is_checklist: cat.is_checklist })
        .select()
        .single()

      if (!newCat) continue

      const catTasks = srcTasks.filter(t => t.category_id === cat.id)
      if (catTasks.length === 0) continue

      // Generate IDs client-side for reliable old→new mapping
      const inserts = catTasks.map(t => ({
        id: crypto.randomUUID(),
        category_id: (newCat as TournamentCategory).id,
        title: t.title,
        status: 'nicht_begonnen' as const,
      }))
      await supabase.from('tasks').insert(inserts)
      catTasks.forEach((oldTask, i) => taskIdMap.set(oldTask.id, inserts[i].id))
    }

    // Copy task_equipment links to new tasks
    if (taskIdMap.size > 0) {
      const { data: links } = await supabase.from('task_equipment')
        .select('task_id, equipment_id')
        .in('task_id', [...taskIdMap.keys()])
      if (links && links.length > 0) {
        await supabase.from('task_equipment').insert(
          (links as { task_id: string; equipment_id: string }[]).map(l => ({
            task_id: taskIdMap.get(l.task_id)!,
            equipment_id: l.equipment_id,
          }))
        )
      }
    }

    if (srcHelpers.length > 0) {
      await supabase.from('tournament_helpers').insert(
        srcHelpers.map(h => ({
          tournament_id: newTournamentId,
          member_id: null,
          role: h.role,
          time_start: h.time_start,
          time_end: h.time_end,
          sort_order: h.sort_order,
        }))
      )
    }
  }

  async function buildTemplateFromTournament(sourceTournamentId: string): Promise<string | null> {
    const [cats, hlp] = await Promise.all([
      supabase.from('tournament_categories').select('*').eq('tournament_id', sourceTournamentId).order('sort_order'),
      supabase.from('tournament_helpers').select('*').eq('tournament_id', sourceTournamentId).order('sort_order'),
    ])

    const srcCats = (cats.data ?? []) as TournamentCategory[]
    const srcHelpers = (hlp.data ?? []) as TournamentHelper[]

    // Filter tasks server-side instead of loading entire DB
    const { data: tasksData } = srcCats.length > 0
      ? await supabase.from('tasks').select('*').in('category_id', srcCats.map(c => c.id))
      : { data: [] }
    const allTasks = (tasksData ?? []) as TournamentTask[]

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
        .insert({ tournament_id: tmplId, name: cat.name, sort_order: cat.sort_order, is_checklist: cat.is_checklist })
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

    if (srcHelpers.length > 0) {
      await supabase.from('tournament_helpers').insert(
        srcHelpers.map(h => ({
          tournament_id: tmplId,
          member_id: null,
          role: h.role,
          time_start: h.time_start,
          time_end: h.time_end,
          sort_order: h.sort_order,
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

    // Alte Vorlage archivieren statt löschen (ermöglicht Wiederherstellung)
    if (existing?.source_tournament_id) {
      await supabase.from('tournaments')
        .update({ archived: true, is_template: false })
        .eq('id', existing.source_tournament_id)
    }

    await supabase
      .from('tournament_templates')
      .update({
        source_tournament_id: tmplTournamentId,
        previous_source_tournament_id: existing?.source_tournament_id ?? null,
      })
      .eq('id', existingTemplateId)

    await load()
  }

  async function restoreTemplate(templateId: string) {
    const template = templates.find(t => t.id === templateId)
    if (!template?.previous_source_tournament_id) return

    // Neu erstellte Vorlage löschen
    if (template.source_tournament_id) {
      await supabase.from('tournaments').delete().eq('id', template.source_tournament_id)
    }

    // Alte Vorlage reaktivieren
    await supabase.from('tournaments')
      .update({ archived: false, is_template: true })
      .eq('id', template.previous_source_tournament_id)

    await supabase
      .from('tournament_templates')
      .update({
        source_tournament_id: template.previous_source_tournament_id,
        previous_source_tournament_id: null,
      })
      .eq('id', templateId)

    await load()
  }

  async function archiveTournament(id: string) {
    const { error } = await supabase.from('tournaments').update({ archived: true }).eq('id', id)
    if (error) { handleSupabaseError(error, 'Turnier archivieren'); return }
    await load()
  }

  async function unarchiveTournament(id: string) {
    const { error } = await supabase.from('tournaments').update({ archived: false }).eq('id', id)
    if (error) { handleSupabaseError(error, 'Turnier reaktivieren'); return }
    await load()
  }

  async function deleteTournament(id: string) {
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) { handleSupabaseError(error, 'Turnier löschen'); return }
    await load()
  }

  async function updateTournament(id: string, name: string, date: string) {
    const { error } = await supabase.from('tournaments').update({ name, date }).eq('id', id)
    if (error) { handleSupabaseError(error, 'Turnier speichern'); return }
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, name, date } : t))
  }

  return { tournaments, templates, loading, load, createTournament, updateTournament, archiveTournament, unarchiveTournament, deleteTournament, createTemplateFromTournament, replaceTemplate, restoreTemplate }
}
