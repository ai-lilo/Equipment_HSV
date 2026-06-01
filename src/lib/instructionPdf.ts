import jsPDF from 'jspdf'
import type { Instruction, InstructionStep } from '../types'

const BLUE: [number, number, number] = [30, 64, 175]
const LIGHT_BLUE: [number, number, number] = [219, 234, 254]
const DARK_TEXT: [number, number, number] = [30, 30, 30]
const GRAY_TEXT: [number, number, number] = [80, 80, 80]
const LIGHT_GRAY: [number, number, number] = [160, 160, 160]
const ROW_SEP: [number, number, number] = [220, 220, 220]

interface ImageInfo {
  dataUrl: string
  width: number
  height: number
}

async function loadImage(url: string): Promise<ImageInfo | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = dataUrl
    })
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight }
  } catch {
    return null
  }
}

function drawBanner(doc: jsPDF, pageW: number, margin: number, right: string) {
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('HSV Pegnitz – Arbeitsanweisungen', margin, 14)
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

export async function exportInstructionPDF(instruction: Instruction, steps: InstructionStep[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  const now = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Preload all step images
  const imageCache = new Map<string, ImageInfo | null>()
  for (const step of steps) {
    if (step.media_url && step.media_type === 'image') {
      imageCache.set(step.media_url, await loadImage(step.media_url))
    }
  }

  // ── Page header ────────────────────────────────────────────
  drawBanner(doc, pageW, margin, `Stand: ${now}`)
  drawFooter(doc, pageW)

  let y = 32

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK_TEXT)
  const titleLines = doc.splitTextToSize(instruction.title, contentW) as string[]
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8

  // Equipment
  if (instruction.equipment?.name) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BLUE)
    doc.text(`Gerät: ${instruction.equipment.name}`, margin, y)
    y += 6
  }

  // Description
  if (instruction.description) {
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...GRAY_TEXT)
    const descLines = doc.splitTextToSize(instruction.description, contentW) as string[]
    doc.text(descLines, margin, y)
    y += descLines.length * 5.5 + 3
  }

  // Divider
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // Step count
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_TEXT)
  doc.text(`${steps.length} ${steps.length === 1 ? 'Schritt' : 'Schritte'}`, margin, y)
  y += 10

  // ── Steps ──────────────────────────────────────────────────
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const imgInfo = step.media_url && step.media_type === 'image' ? imageCache.get(step.media_url) ?? null : null
    const hasVideo = step.media_url && step.media_type === 'video'
    const descLines = doc.splitTextToSize(step.description, contentW - 12) as string[]

    // Compute rendered image dimensions with correct aspect ratio (max 80 mm high)
    let imgRenderW = 0
    let imgRenderH = 0
    if (imgInfo) {
      const maxW = contentW
      const maxH = 80
      const ratio = imgInfo.width / imgInfo.height
      imgRenderW = maxW
      imgRenderH = imgRenderW / ratio
      if (imgRenderH > maxH) {
        imgRenderH = maxH
        imgRenderW = imgRenderH * ratio
      }
    }

    const textH = Math.max(6, descLines.length * 5.5)
    const mediaH = imgInfo ? imgRenderH + 4 : hasVideo ? 10 : 0
    const stepH = 9 + textH + mediaH + 8

    if (y + stepH > pageH - margin - 10) {
      doc.addPage()
      drawBanner(doc, pageW, margin, `Stand: ${now}`)
      drawFooter(doc, pageW)
      y = 32
    }

    // Step badge
    doc.setFillColor(...LIGHT_BLUE)
    doc.roundedRect(margin, y, contentW, 7, 1.5, 1.5, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLUE)
    doc.text(`Schritt ${i + 1}`, margin + 3, y + 5)
    y += 10

    // Description
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_TEXT)
    doc.text(descLines, margin + 2, y)
    y += textH + 4

    // Image
    if (imgInfo) {
      const fmt = imgInfo.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      const imgX = margin + (contentW - imgRenderW) / 2
      try {
        doc.addImage(imgInfo.dataUrl, fmt, imgX, y, imgRenderW, imgRenderH, undefined, 'FAST')
      } catch {
        // silently skip broken images
      }
      y += imgRenderH + 4
    } else if (hasVideo) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...GRAY_TEXT)
      doc.text('(Video – nicht druckbar)', margin + 2, y + 4)
      y += 10
    }

    // Row separator
    doc.setDrawColor(...ROW_SEP)
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageW - margin, y)
    y += 6
  }

  const safeName = instruction.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim()
  doc.save(`Anleitung_${safeName}_${now.replace(/\./g, '-')}.pdf`)
}
