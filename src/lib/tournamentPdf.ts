import jsPDF from 'jspdf'
import type { Tournament, TournamentCategory, TournamentTask, TournamentHelper } from '../types/tournament'
import type { User } from '../types'

export interface TaskEquipmentEntry {
  name: string
  location: string
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':')
  return m === '00' ? String(parseInt(h)) : `${parseInt(h)}:${m}`
}

const BLUE: [number, number, number] = [30, 64, 175]
const LIGHT_BLUE: [number, number, number] = [219, 234, 254]
const DARK_TEXT: [number, number, number] = [30, 30, 30]
const GRAY_TEXT: [number, number, number] = [80, 80, 80]
const LIGHT_GRAY: [number, number, number] = [160, 160, 160]
const EQ_BLUE: [number, number, number] = [60, 80, 170]
const ROW_SEP: [number, number, number] = [220, 220, 220]

function drawBanner(doc: jsPDF, pageW: number, margin: number, left: string, right: string) {
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(left, margin, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(right, pageW - margin, 14, { align: 'right' })
}

function drawFooter(doc: jsPDF, pageW: number) {
  const pageNum = (doc.internal as { getNumberOfPages(): number }).getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(...LIGHT_GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(`Seite ${pageNum}`, pageW / 2, 290, { align: 'center' })
}

function drawSectionHeader(doc: jsPDF, text: string, margin: number, pageW: number, y: number): number {
  doc.setFontSize(13)
  doc.setTextColor(...BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text(text, margin, y)
  y += 2
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 6
  return y
}

// ─────────────────────────────────────────────────────────────
// Tournament overview PDF (all categories, cover page)
// ─────────────────────────────────────────────────────────────
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
  const now = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const userMap = Object.fromEntries(users.map(u => [u.id, u.username]))

  // ── Deckblatt ──────────────────────────────────────────────
  drawBanner(doc, pageW, margin, 'HSV Pegnitz', `Stand: ${now}`)
  drawFooter(doc, pageW)

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK_TEXT)
  doc.text(tournament.name, pageW / 2, 68, { align: 'center' })

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  doc.text(dateStr, pageW / 2, 80, { align: 'center' })

  doc.setFontSize(10)
  doc.text('Veranstaltungs-Checkliste', pageW / 2, 90, { align: 'center' })

  // ── Kategorie-Seiten ───────────────────────────────────────
  const sortedCats = [...categories].sort((a, b) => a.sort_order - b.sort_order)

  for (const cat of sortedCats) {
    const catTasks = tasks.filter(t => t.category_id === cat.id)
    if (catTasks.length === 0) continue

    doc.addPage()
    drawBanner(doc, pageW, margin, `HSV Pegnitz – ${tournament.name}`, dateStr)
    drawFooter(doc, pageW)

    let y = 32
    y = drawSectionHeader(doc, cat.name, margin, pageW, y)
    y = renderTournamentTasks(doc, catTasks, userMap, taskEquipmentMap, margin, contentW, pageH, pageW, tournament.name, dateStr, y)
  }

  const safeName = tournament.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim()
  doc.save(`HSV_Pegnitz_${safeName}_${dateStr.replace(/\./g, '-')}.pdf`)
}

function renderTournamentTasks(
  doc: jsPDF,
  catTasks: TournamentTask[],
  userMap: Record<string, string>,
  taskEquipmentMap: Record<string, TaskEquipmentEntry[]>,
  margin: number,
  contentW: number,
  pageH: number,
  pageW: number,
  tournamentName: string,
  dateStr: string,
  y: number
): number {
  const checkW = 10
  const textW = contentW - checkW

  // Table header row
  doc.setFillColor(...LIGHT_BLUE)
  doc.rect(margin, y, contentW, 6, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text('Status', margin + 1.5, y + 4.2)
  doc.text('Aufgabe / Verantwortliche Person', margin + checkW + 2, y + 4.2)
  y += 6

  for (const task of catTasks) {
    const responsible = task.responsible_user_id ? userMap[task.responsible_user_id] : null
    const equipment = taskEquipmentMap[task.id] ?? []
    const titleLines = doc.splitTextToSize(task.title, textW - 4)
    const respHeight = responsible ? 5 : 0
    const eqHeight = equipment.length > 0 ? equipment.length * 5 + 2 : 0
    const rowH = Math.max(8, titleLines.length * 5.5 + respHeight) + eqHeight + 2

    // Page break
    if (y + rowH > pageH - margin - 10) {
      doc.addPage()
      drawBanner(doc, pageW, margin, `HSV Pegnitz – ${tournamentName}`, dateStr)
      drawFooter(doc, pageW)
      y = 32
    }

    // Row background
    doc.setFillColor(255, 255, 255)
    doc.rect(margin, y, contentW, rowH, 'F')

    // Checkbox square
    doc.setDrawColor(...GRAY_TEXT)
    doc.setLineWidth(0.3)
    doc.rect(margin + 2, y + 1.5, 5, 5)

    // Task title
    doc.setFontSize(8.5)
    doc.setTextColor(...DARK_TEXT)
    doc.setFont('helvetica', 'normal')
    doc.text(titleLines, margin + checkW + 2, y + 5)

    // Responsible person
    if (responsible) {
      const respY = y + 5 + titleLines.length * 5.5
      doc.setFontSize(7.5)
      doc.setTextColor(...GRAY_TEXT)
      doc.text(`Verantwortlich: ${responsible}`, margin + checkW + 4, respY)
    }

    // Equipment rows
    if (equipment.length > 0) {
      const eqStartY = y + Math.max(8, titleLines.length * 5.5 + respHeight) + 2
      doc.setFontSize(7.5)
      doc.setTextColor(...EQ_BLUE)
      doc.setFont('helvetica', 'italic')
      for (let i = 0; i < equipment.length; i++) {
        const eq = equipment[i]
        const eqText = eq.location ? `  ${eq.name}  –  ${eq.location}` : `  ${eq.name}`
        const eqLine = doc.splitTextToSize(eqText, textW - 6)[0] as string
        doc.text(eqLine, margin + checkW + 4, eqStartY + i * 5)
      }
    }

    // Row separator
    doc.setDrawColor(...ROW_SEP)
    doc.setLineWidth(0.2)
    doc.line(margin, y + rowH, margin + contentW, y + rowH)

    y += rowH
  }

  return y
}

// ─────────────────────────────────────────────────────────────
// Checklist PDF (one page per category, print-optimized)
// ─────────────────────────────────────────────────────────────
export function exportChecklistPDF(
  tournamentName: string,
  categories: TournamentCategory[],
  tasks: TournamentTask[],
  taskEquipmentMap: Record<string, TaskEquipmentEntry[]> = {}
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

    renderChecklistPage(doc, cat.name, tournamentName, pageW)
    drawFooter(doc, pageW)
    let y = 34

    for (const task of catTasks) {
      const equipment = taskEquipmentMap[task.id] ?? []
      const titleLines = doc.splitTextToSize(task.title, contentW - 12)
      const eqHeight = equipment.length > 0 ? equipment.length * 5 + 1 : 0
      const itemH = Math.max(10, titleLines.length * 6.5) + eqHeight + 3

      // Page break
      if (y + itemH > pageH - margin - 10) {
        doc.addPage()
        renderChecklistPage(doc, `${cat.name} (Fortsetzung)`, tournamentName, pageW)
        drawFooter(doc, pageW)
        y = 34
      }

      // Checkbox (5×5mm)
      doc.setDrawColor(60, 60, 60)
      doc.setLineWidth(0.4)
      doc.rect(margin, y, 5, 5)

      // Task title
      doc.setFontSize(10)
      doc.setTextColor(...DARK_TEXT)
      doc.setFont('helvetica', 'normal')
      doc.text(titleLines, margin + 9, y + 4)

      // Equipment
      if (equipment.length > 0) {
        const eqStartY = y + Math.max(10, titleLines.length * 6.5) + 1
        doc.setFontSize(8)
        doc.setTextColor(...EQ_BLUE)
        doc.setFont('helvetica', 'italic')
        for (let i = 0; i < equipment.length; i++) {
          const eq = equipment[i]
          const eqText = eq.location ? `  ${eq.name}  –  ${eq.location}` : `  ${eq.name}`
          const eqLine = doc.splitTextToSize(eqText, contentW - 12)[0] as string
          doc.text(eqLine, margin + 9, eqStartY + i * 5)
        }
        doc.setFont('helvetica', 'normal')
      }

      // Row separator
      doc.setDrawColor(...ROW_SEP)
      doc.setLineWidth(0.15)
      doc.line(margin, y + itemH, margin + contentW, y + itemH)

      y += itemH
    }
  }

  const safeName = tournamentName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim()
  const now = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.save(`Checkliste_${safeName}_${now.replace(/\./g, '-')}.pdf`)
}

function renderChecklistPage(doc: jsPDF, catName: string, tournamentName: string, pageW: number) {
  // Two-line banner: tournament name + category name
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, pageW, 24, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.text(tournamentName, 14, 11)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(catName, 14, 20)
}

// ─────────────────────────────────────────────────────────────
// Helper list PDF
// ─────────────────────────────────────────────────────────────
export function exportHelperListPDF(tournamentName: string, helpers: TournamentHelper[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentW = pageW - margin * 2
  const now = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  drawBanner(doc, pageW, margin, `HSV Pegnitz – ${tournamentName}`, `Stand: ${now}`)
  drawFooter(doc, pageW)

  let y = 36
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK_TEXT)
  doc.text('Helferliste', margin, y)
  y += 10

  if (helpers.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_TEXT)
    doc.text('Keine Helfer eingetragen.', margin, y)
  } else {
    // Column widths: # | Aufgabe | Zeitfenster | Person
    const colNum = 8
    const colRole = contentW * 0.35
    const colSlot = contentW * 0.22
    const colPerson = contentW - colNum - colRole - colSlot

    // Table header
    doc.setFillColor(...LIGHT_BLUE)
    doc.rect(margin, y, contentW, 7, 'F')
    doc.setFontSize(8.5)
    doc.setTextColor(...BLUE)
    doc.setFont('helvetica', 'bold')
    doc.text('#', margin + 2, y + 5)
    doc.text('Aufgabe / Rolle', margin + colNum, y + 5)
    doc.text('Zeitfenster', margin + colNum + colRole, y + 5)
    doc.text('Person', margin + colNum + colRole + colSlot, y + 5)
    y += 7

    helpers.forEach((helper, i) => {
      const rowH = 8
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248)
      doc.rect(margin, y, contentW, rowH, 'F')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK_TEXT)
      doc.text(String(i + 1), margin + 2, y + 5.5)

      if (helper.role) {
        const roleLines = doc.splitTextToSize(helper.role, colRole - 2)
        doc.text(roleLines[0] as string, margin + colNum, y + 5.5)
      }

      const timeSlot = helper.time_start && helper.time_end ? `${fmtTime(helper.time_start)} bis ${fmtTime(helper.time_end)} Uhr` : ''
      if (timeSlot) {
        doc.setTextColor(...GRAY_TEXT)
        doc.text(timeSlot, margin + colNum + colRole, y + 5.5)
      }

      const personName = helper.member?.name ?? ''
      if (personName) {
        doc.setTextColor(...GRAY_TEXT)
        const nameLines = doc.splitTextToSize(personName, colPerson - 2)
        doc.text(nameLines[0] as string, margin + colNum + colRole + colSlot, y + 5.5)
      }

      doc.setDrawColor(...ROW_SEP)
      doc.setLineWidth(0.2)
      doc.line(margin, y + rowH, margin + contentW, y + rowH)
      y += rowH
    })
  }

  const safeName = tournamentName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim()
  doc.save(`Helferliste_${safeName}_${now.replace(/\./g, '-')}.pdf`)
}
