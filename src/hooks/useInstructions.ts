import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Instruction, InstructionStep, InstructionMediaType } from '../types'

export interface StepDraft {
  id?: string
  order_index: number
  description: string
  media_url: string | null
  media_type: InstructionMediaType | null
  file?: File | null
  preview?: string | null
}

export function useInstructions() {
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('instructions')
      .select('*, equipment(name)')
      .order('updated_at', { ascending: false })
    setInstructions((data ?? []) as Instruction[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadSteps(instructionId: string): Promise<InstructionStep[]> {
    const { data } = await supabase
      .from('instruction_steps')
      .select('*')
      .eq('instruction_id', instructionId)
      .order('order_index')
    return (data ?? []) as InstructionStep[]
  }

  async function uploadMedia(instructionId: string, stepIndex: number, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${instructionId}/${stepIndex}.${ext}`
    const { error } = await supabase.storage
      .from('instruction-media')
      .upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('instruction-media').getPublicUrl(path)
    return data.publicUrl
  }

  async function saveInstruction(
    data: { id?: string; title: string; description: string; equipment_id: string | null },
    steps: StepDraft[],
    userId: string
  ): Promise<{ error: string | null }> {
    const isNew = !data.id

    let instructionId = data.id ?? ''

    if (isNew) {
      const { data: inserted, error } = await supabase
        .from('instructions')
        .insert({
          title: data.title.trim(),
          description: data.description.trim() || null,
          equipment_id: data.equipment_id || null,
          created_by: userId,
        })
        .select('id')
        .single()
      if (error) return { error: error.message }
      instructionId = inserted.id
    } else {
      const { error } = await supabase
        .from('instructions')
        .update({
          title: data.title.trim(),
          description: data.description.trim() || null,
          equipment_id: data.equipment_id || null,
        })
        .eq('id', instructionId)
      if (error) return { error: error.message }
      // Delete existing steps – will be re-inserted
      await supabase.from('instruction_steps').delete().eq('instruction_id', instructionId)
      // Remove old media files
      const { data: files } = await supabase.storage
        .from('instruction-media')
        .list(instructionId)
      if (files && files.length > 0) {
        await supabase.storage
          .from('instruction-media')
          .remove(files.map(f => `${instructionId}/${f.name}`))
      }
    }

    // Upload media and insert steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      let mediaUrl = step.media_url
      let mediaType = step.media_type

      if (step.file) {
        const uploaded = await uploadMedia(instructionId, i, step.file)
        if (uploaded) {
          mediaUrl = uploaded
          mediaType = step.file.type.startsWith('video/') ? 'video' : 'image'
        }
      }

      await supabase.from('instruction_steps').insert({
        instruction_id: instructionId,
        order_index: i,
        description: step.description.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      })
    }

    await load()
    return { error: null }
  }

  async function deleteInstruction(id: string): Promise<{ error: string | null }> {
    // Remove all media files
    const { data: files } = await supabase.storage.from('instruction-media').list(id)
    if (files && files.length > 0) {
      await supabase.storage
        .from('instruction-media')
        .remove(files.map(f => `${id}/${f.name}`))
    }
    const { error } = await supabase.from('instructions').delete().eq('id', id)
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }

  return { instructions, loading, reload: load, loadSteps, saveInstruction, deleteInstruction }
}
