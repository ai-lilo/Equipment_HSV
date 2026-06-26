import jsPDF from 'jspdf'
import type { Room, Cabinet, Equipment, Category } from '../types'

const PAGE_BOTTOM = 278
const CONTENT_START_Y = 32

function drawPageHeader(doc: jsPDF, now: string) {
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('HSV Pegnitz – Inventarliste', margin, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Stand: ${now}`, pageW - margin, 14, { align: 'right' })
}

function drawTableHeader(doc: jsPDF, x: number, y: number, width: number, colName: number, colAnzahl: number) {
  doc.setFillColor(219, 234, 254)
  doc.rect(x, y, width, 6, 'F')
  doc.setFontSize(8)
  doc.setTextColor(30, 64, 175)
  doc.setFont('helvetica', 'bold')
  doc.text('Name', x + 2, y + 4.2)
  doc.text('Anzahl', x + colName + 2, y + 4.2)
  doc.text('Kategorie', x + colName + colAnzahl + 2, y + 4.2)
}

export function exportInventoryPDF(rooms: Room[], cabinets: Cabinet[], equipment: Equipment[], categories: Category[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentW = pageW - margin * 2
  const now = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  let isFirst = true

  for (const room of rooms) {
    const roomEquipment = equipment
      .filter(e => e.room_id === room.id)
      .sort((a, b) => {
        const catA = categories.find(c => c.id === a.category_id)?.name ?? 'zzz'
        const catB = categories.find(c => c.id === b.category_id)?.name ?? 'zzz'
        if (catA !== catB) return catA.localeCompare(catB, 'de')
        return a.name.localeCompare(b.name, 'de')
      })
    if (roomEquipment.length === 0) continue

    if (!isFirst) doc.addPage()
    isFirst = false

    drawPageHeader(doc, now)
    let y = CONTENT_START_Y

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
      y = renderTable(doc, directItems, margin, y, contentW, categories, now)
      y += 4
    }

    // Cabinet groups
    const roomCabinets = cabinets.filter(c => c.room_id === room.id)
    for (const cabinet of roomCabinets) {
      const cabItems = roomEquipment.filter(e => e.cabinet_id === cabinet.id)
      if (cabItems.length === 0) continue

      if (y + 12 > PAGE_BOTTOM) {
        doc.addPage()
        drawPageHeader(doc, now)
        y = CONTENT_START_Y
      }

      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.setFont('helvetica', 'bold')
      doc.text(`Schrank: ${cabinet.name}`, margin + 2, y)
      y += 5

      y = renderTable(doc, cabItems, margin + 2, y, contentW - 2, categories, now)
      y += 4
    }
  }

  // Footers on all pages
  const totalPages = (doc.internal as { getNumberOfPages(): number }).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(`Seite ${i} von ${totalPages}`, pageW / 2, 290, { align: 'center' })
  }

  doc.save(`Inventarliste_HSV_${now.replace(/\./g, '-')}.pdf`)
}

function renderTable(
  doc: jsPDF,
  items: Equipment[],
  x: number,
  y: number,
  width: number,
  categories: Category[],
  now: string,
): number {
  const colAnzahl = 20
  const colSport = 42
  const colName = width - colAnzahl - colSport
  const headerH = 6
  const rowH = 7

  drawTableHeader(doc, x, y, width, colName, colAnzahl)
  y += headerH

  for (const item of items) {
    if (y + rowH > PAGE_BOTTOM) {
      doc.addPage()
      drawPageHeader(doc, now)
      y = CONTENT_START_Y
      drawTableHeader(doc, x, y, width, colName, colAnzahl)
      y += headerH
    }

    doc.setFillColor(255, 255, 255)
    doc.rect(x, y, width, rowH, 'F')

    doc.setFontSize(8.5)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'normal')

    const nameMaxW = colName - 4
    const nameText = doc.splitTextToSize(item.name, nameMaxW)[0] as string
    doc.text(nameText, x + 2, y + 4.8)
    doc.text(String(item.count), x + colName + 2, y + 4.8)

    doc.setTextColor(80, 80, 80)
    const catName = categories.find(c => c.id === item.category_id)?.name
    if (catName) {
      doc.text(catName, x + colName + colAnzahl + 2, y + 4.8)
    }

    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(x, y + rowH, x + width, y + rowH)

    y += rowH
  }

  return y
}
