import jsPDF from 'jspdf'
import type { Tournament, TournamentCategory, TournamentTask } from '../types/tournament'
import type { User } from '../types'

export interface TaskEquipmentEntry {
  name: string
  location: string
}

export function exportTournamentPDF(
  tournament: Tournament,
  categories: TournamentCategory[],
  tasks: TournamentTask[],
  users: User[],
  taskEquipmentMap: Record<string, TaskEquipmentEntry[]> = {}
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  const dateStr = new Date(tournament.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const userMap = Object.fromEntries(users.map(u => [u.id, u.username]))

  // ── Deckblatt ──────────────────────────────────────────────────────
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('HSV Pegnitz', pageW / 2, 60, { align: 'center' })

  doc.setFontSize(16)
  doc.text(tournament.name, pageW / 2, 76, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(dateStr, pageW / 2, 88, { align: 'center' })

  doc.setFontSize(10)
  doc.text('Turnier-Checkliste', pageW / 2, 100, { align: 'center' })

  // ── Seite pro Kategorie ────────────────────────────────────────────
  const sortedCats = [...categories].sort((a, b) => a.sort_order - b.sort_order)

  for (const cat of sortedCats) {
    const catTasks = tasks.filter(t => t.category_id === cat.id)
    if (catTasks.length === 0) continue

    doc.addPage()
    let y = margin + 4

    y = renderCategoryPage(doc, cat.name, catTasks, userMap, taskEquipmentMap, margin, contentW, pageH, y)
  }

  const safeName = tournament.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim()
  doc.save(`HSV_Pegnitz_${safeName}_${dateStr.replace(/\./g, '-')}.pdf`)
}

export function exportChecklistPDF(
  tournamentName: string,
  categories: TournamentCategory[],
  tasks: TournamentTask[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  const sortedCats = [...categories].sort((a, b) => a.sort_order - b.sort_order)
  let first = true

  for (const cat of sortedCats) {
    const catTasks = tasks.filter(t => t.category_id === cat.id)
    if (catTasks.length === 0) continue

    if (!first) doc.addPage()
    first = false

    let y = margin + 4
    renderCategoryPage(doc, cat.name, catTasks, {}, {}, margin, contentW, pageH, y)
  }

  const safeName = tournamentName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim()
  const now = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.save(`Checkliste_${safeName}_${now.replace(/\./g, '-')}.pdf`)
}

function renderCategoryPage(
  doc: jsPDF,
  catName: string,
  catTasks: TournamentTask[],
  userMap: Record<string, string>,
  taskEquipmentMap: Record<string, TaskEquipmentEntry[]>,
  margin: number,
  contentW: number,
  pageH: number,
  y: number
): number {
  // Kategorie-Überschrift
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(catName, margin, y)
  y += 8

  // Trennlinie
  doc.setDrawColor(180, 180, 180)
  doc.line(margin, y, margin + contentW, y)
  y += 6

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  for (const task of catTasks) {
    const responsible = task.responsible_user_id ? userMap[task.responsible_user_id] : null
    const suffix = responsible ? `  [${responsible}]` : ''
    const fullText = `${task.title}${suffix}`

    // Checkbox
    doc.rect(margin, y - 3.5, 4, 4)

    // Task-Text
    const lines = doc.splitTextToSize(fullText, contentW - 8)
    doc.text(lines, margin + 7, y)
    y += lines.length * 6 + 1

    // Equipment-Zeilen
    const equipment = taskEquipmentMap[task.id] ?? []
    if (equipment.length > 0) {
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'italic')
      for (const eq of equipment) {
        const eqText = eq.location ? `  📦 ${eq.name} – ${eq.location}` : `  📦 ${eq.name}`
        const eqLines = doc.splitTextToSize(eqText, contentW - 12)
        doc.text(eqLines, margin + 7, y)
        y += eqLines.length * 5
      }
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      y += 1
    }

    // Neue Seite wenn nötig
    if (y > pageH - margin - 10) {
      doc.addPage()
      y = margin + 4
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${catName} (Fortsetzung)`, margin, y)
      y += 8
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
    }
  }

  return y
}
