import jsPDF from 'jspdf'
import type { Room, Cabinet, Equipment } from '../types'

const STATUS_LABEL: Record<string, string> = {
  OK: 'OK',
  DEFECT: 'Defekt',
  IN_REPAIR: 'In Reparatur',
}

export function exportInventoryPDF(rooms: Room[], cabinets: Cabinet[], equipment: Equipment[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentW = pageW - margin * 2
  const now = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  let isFirst = true

  for (const room of rooms) {
    const roomEquipment = equipment.filter(e => e.room_id === room.id)
    if (roomEquipment.length === 0) continue

    if (!isFirst) doc.addPage()
    isFirst = false

    let y = 14

    // Header
    doc.setFillColor(30, 64, 175) // blue-800
    doc.rect(0, 0, pageW, 22, 'F')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('HSV Pegnitz – Inventarliste', margin, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Stand: ${now}`, pageW - margin, 14, { align: 'right' })

    y = 32

    // Room title
    doc.setFontSize(13)
    doc.setTextColor(30, 64, 175)
    doc.setFont('helvetica', 'bold')
    doc.text(room.name, margin, y)
    y += 2

    doc.setDrawColor(30, 64, 175)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageW - margin, y)
    y += 6

    // Direct equipment (no cabinet)
    const directItems = roomEquipment.filter(e => !e.cabinet_id)
    if (directItems.length > 0) {
      y = renderTable(doc, directItems, null, margin, y, contentW)
      y += 4
    }

    // Cabinet groups
    const roomCabinets = cabinets.filter(c => c.room_id === room.id)
    for (const cabinet of roomCabinets) {
      const cabItems = roomEquipment.filter(e => e.cabinet_id === cabinet.id)
      if (cabItems.length === 0) continue

      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.setFont('helvetica', 'bold')
      doc.text(`Schrank: ${cabinet.name}`, margin + 2, y)
      y += 5

      y = renderTable(doc, cabItems, cabinet.name, margin + 2, y, contentW - 2)
      y += 4
    }

    // Footer
    const pageCount = (doc.internal as { getNumberOfPages(): number }).getNumberOfPages()
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(`Seite ${pageCount}`, pageW / 2, 290, { align: 'center' })
  }

  doc.save(`Inventarliste_HSV_${now.replace(/\./g, '-')}.pdf`)
}

function renderTable(
  doc: jsPDF,
  items: Equipment[],
  _context: string | null,
  x: number,
  y: number,
  width: number,
): number {
  const colAnzahl = 20
  const colStatus = 28
  const colSport = 38
  const colName = width - colAnzahl - colStatus - colSport

  const headerH = 6
  const rowH = 7

  // Table header
  doc.setFillColor(219, 234, 254) // blue-100
  doc.rect(x, y, width, headerH, 'F')
  doc.setFontSize(8)
  doc.setTextColor(30, 64, 175)
  doc.setFont('helvetica', 'bold')
  doc.text('Name', x + 2, y + 4.2)
  doc.text('Anzahl', x + colName + 2, y + 4.2)
  doc.text('Status', x + colName + colAnzahl + 2, y + 4.2)
  doc.text('Sportart', x + colName + colAnzahl + colStatus + 2, y + 4.2)
  y += headerH

  for (const item of items) {
    doc.setFillColor(item.status === 'DEFECT' ? 254 : item.status === 'IN_REPAIR' ? 255 : 255,
                     item.status === 'DEFECT' ? 242 : item.status === 'IN_REPAIR' ? 251 : 255,
                     item.status === 'DEFECT' ? 242 : item.status === 'IN_REPAIR' ? 235 : 255)
    doc.rect(x, y, width, rowH, 'F')

    doc.setFontSize(8.5)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'normal')

    const nameMaxW = colName - 4
    const nameText = doc.splitTextToSize(item.name, nameMaxW)[0] as string
    doc.text(nameText, x + 2, y + 4.8)
    doc.text(String(item.count), x + colName + 2, y + 4.8)

    const statusLabel = STATUS_LABEL[item.status] ?? item.status
    if (item.status === 'DEFECT') doc.setTextColor(185, 28, 28)
    else if (item.status === 'IN_REPAIR') doc.setTextColor(161, 98, 7)
    else doc.setTextColor(22, 101, 52)
    doc.text(statusLabel, x + colName + colAnzahl + 2, y + 4.8)

    doc.setTextColor(80, 80, 80)
    if (item.sport) {
      doc.text(item.sport, x + colName + colAnzahl + colStatus + 2, y + 4.8)
    }

    // Defect note
    if (item.defect_note) {
      y += rowH
      doc.setFontSize(7.5)
      doc.setTextColor(185, 28, 28)
      doc.setFont('helvetica', 'italic')
      const note = doc.splitTextToSize(`  ↳ ${item.defect_note}`, width - 4)[0] as string
      doc.text(note, x + 2, y + 4.5)
    }

    // Row separator
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(x, y + rowH, x + width, y + rowH)

    y += rowH
  }

  return y
}
