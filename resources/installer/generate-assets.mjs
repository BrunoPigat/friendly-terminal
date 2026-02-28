/**
 * Generates BMP images for the NSIS installer.
 * Sidebar (164x314) and Header (150x57) with golden gradients
 * matching the Friendly Terminal website brand.
 *
 * Run: node resources/installer/generate-assets.mjs
 */

import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Brand colors from the website (global.css)
const C = {
  white: { r: 255, g: 255, b: 255 },
  golden50: { r: 255, g: 249, b: 240 },
  golden100: { r: 255, g: 240, b: 214 },
  golden200: { r: 255, g: 224, b: 173 },
  golden300: { r: 255, g: 203, b: 122 },
  golden400: { r: 255, g: 179, b: 71 },
  golden500: { r: 245, g: 158, b: 11 },
  golden600: { r: 217, g: 119, b: 6 },
  golden700: { r: 180, g: 83, b: 9 }
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function lerpColor(c1, c2, t) {
  return { r: lerp(c1.r, c2.r, t), g: lerp(c1.g, c2.g, t), b: lerp(c1.b, c2.b, t) }
}

function multiGradient(stops, t) {
  if (t <= stops[0].pos) return stops[0].color
  if (t >= stops[stops.length - 1].pos) return stops[stops.length - 1].color
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].pos && t <= stops[i + 1].pos) {
      const lt = (t - stops[i].pos) / (stops[i + 1].pos - stops[i].pos)
      return lerpColor(stops[i].color, stops[i + 1].color, lt)
    }
  }
  return stops[stops.length - 1].color
}

/**
 * Creates a 24-bit BMP file buffer.
 * @param {number} width
 * @param {number} height
 * @param {(x: number, y: number) => {r:number, g:number, b:number}} getPixel  y=0 is top
 */
function createBMP(width, height, getPixel) {
  const rowSize = Math.ceil((width * 3) / 4) * 4
  const pixelDataSize = rowSize * height
  const fileSize = 54 + pixelDataSize
  const buf = Buffer.alloc(fileSize)

  // -- File header (14 bytes) --
  buf[0] = 0x42
  buf[1] = 0x4d // 'BM'
  buf.writeUInt32LE(fileSize, 2)
  buf.writeUInt32LE(0, 6) // reserved
  buf.writeUInt32LE(54, 10) // pixel data offset

  // -- DIB header (40 bytes) --
  buf.writeUInt32LE(40, 14) // header size
  buf.writeInt32LE(width, 18)
  buf.writeInt32LE(height, 22) // positive = bottom-up
  buf.writeUInt16LE(1, 26) // planes
  buf.writeUInt16LE(24, 28) // bpp
  buf.writeUInt32LE(0, 30) // no compression
  buf.writeUInt32LE(pixelDataSize, 34)
  buf.writeInt32LE(2835, 38) // ~72 DPI
  buf.writeInt32LE(2835, 42)
  buf.writeUInt32LE(0, 46)
  buf.writeUInt32LE(0, 50)

  // -- Pixel data (BGR, bottom-up rows) --
  for (let row = 0; row < height; row++) {
    const srcY = height - 1 - row // BMP stores bottom row first
    for (let x = 0; x < width; x++) {
      const { r, g, b } = getPixel(x, srcY)
      const off = 54 + row * rowSize + x * 3
      buf[off] = b
      buf[off + 1] = g
      buf[off + 2] = r
    }
  }
  return buf
}

// ── Sidebar: 164 x 314  (welcome & finish pages) ──────────────────
function generateSidebar() {
  const W = 164,
    H = 314

  // Vertical gradient: white at top → deep golden at bottom
  const stops = [
    { pos: 0.0, color: C.white },
    { pos: 0.12, color: C.golden50 },
    { pos: 0.3, color: C.golden100 },
    { pos: 0.5, color: C.golden300 },
    { pos: 0.7, color: C.golden400 },
    { pos: 0.85, color: C.golden500 },
    { pos: 1.0, color: C.golden700 }
  ]

  return createBMP(W, H, (x, y) => {
    const t = y / (H - 1)
    const base = multiGradient(stops, t)

    // Left accent bar (5px) — deeper golden for visual anchoring
    if (x < 5) {
      const barColor = lerpColor(C.golden500, C.golden700, t)
      return barColor
    }

    return base
  })
}

// ── Header: 150 x 57  (directory & progress pages) ────────────────
function generateHeader() {
  const W = 150,
    H = 57

  return createBMP(W, H, (x, y) => {
    // Bottom accent stripe (3px) — golden gradient left→right
    if (y >= H - 3) {
      const t = x / (W - 1)
      return lerpColor(C.golden400, C.golden600, t)
    }
    // Main area: very subtle vertical gradient
    const t = y / (H - 4)
    return lerpColor(C.white, C.golden50, t * 0.6)
  })
}

// ── Write files ────────────────────────────────────────────────────
writeFileSync(join(__dirname, 'sidebar.bmp'), generateSidebar())
writeFileSync(join(__dirname, 'header.bmp'), generateHeader())

console.log('Installer assets generated successfully:')
console.log('  sidebar.bmp  (164 x 314)')
console.log('  header.bmp   (150 x 57)')
