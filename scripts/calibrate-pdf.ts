/**
 * PDF Coordinate Calibration Script
 *
 * Usage: npx tsx scripts/calibrate-pdf.ts <input.pdf> <output.pdf> [page]
 * Example: npx tsx scripts/calibrate-pdf.ts src/lib/documents/originals/enrollment_form.pdf /tmp/calibrated.pdf 0
 *
 * Opens the original PDF, draws a labeled grid every 50 points, saves to output.
 * Open output in Preview to identify x/y coordinates for each blank field.
 *
 * pdf-lib origin is BOTTOM-LEFT. y=0 is the bottom of the page.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

async function calibrate(inputPath: string, outputPath: string, pageIndex = 0) {
  const bytes = fs.readFileSync(inputPath)
  const doc = await PDFDocument.load(bytes)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const pages = doc.getPages()
  const page = pages[pageIndex]

  if (!page) {
    console.error(`Page ${pageIndex} does not exist. Document has ${pages.length} pages.`)
    process.exit(1)
  }

  const { width, height } = page.getSize()
  console.log(`Page ${pageIndex} size: ${width} x ${height} points`)

  const STEP = 50
  const gridColor = rgb(0.7, 0.7, 0.9)
  const labelColor = rgb(0.3, 0.3, 0.8)

  // Draw vertical lines
  for (let x = 0; x <= width; x += STEP) {
    page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, color: gridColor })
    page.drawText(`${x}`, { x: x + 1, y: 2, size: 5, font, color: labelColor })
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += STEP) {
    page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, color: gridColor })
    page.drawText(`${y}`, { x: 2, y: y + 1, size: 5, font, color: labelColor })
  }

  const result = await doc.save()
  fs.writeFileSync(outputPath, result)
  console.log(`Calibrated PDF saved to: ${outputPath}`)
  console.log(`Open in Preview and hover over fields to find x/y coordinates.`)
}

const [,, input, output, pageStr] = process.argv
if (!input || !output) {
  console.error('Usage: npx tsx scripts/calibrate-pdf.ts <input.pdf> <output.pdf> [page]')
  process.exit(1)
}

const pageIndex = pageStr ? Number(pageStr) : 0
if (pageStr && isNaN(pageIndex)) {
  console.error(`Invalid page number: "${pageStr}"`)
  process.exit(1)
}
calibrate(path.resolve(input), path.resolve(output), pageIndex)
  .catch(err => { console.error(err); process.exit(1) })
