/**
 * Generates the BreakerBox app icon set from inline SVG.
 * Run with: node scripts/make-icons.mjs
 *
 * Motif: a dark breaker panel (two columns of slots, a few energized amber
 * handles) with a bold amber lightning bolt — legible down to favicon size.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'assets', 'images')

const BG = '#0f1115'
const PANEL = '#16191f'
const PANEL_EDGE = '#313845'
const SLOT = '#262c38'
const SLOT_ON = '#f6b73c'
const BOLT = '#f6b73c'

/** The panel + bolt mark, drawn in a 1024 box. `scale` shrinks it toward center. */
function mark(scale = 1) {
  const c = 512
  const s = (n) => c + (n - c) * scale
  // Two columns of breaker slots.
  const rows = 6
  const onSet = new Set(['0-1', '1-0', '2-1', '3-0', '4-1'])
  let slots = ''
  const top = 250
  const gap = 86
  for (let r = 0; r < rows; r++) {
    const y = top + r * gap
    for (let col = 0; col < 2; col++) {
      const x = col === 0 ? 322 : 538
      const on = onSet.has(`${r}-${col}`)
      slots += `<rect x="${s(x)}" y="${s(y)}" width="${164 * scale}" height="${52 * scale}" rx="${12 * scale}" fill="${on ? SLOT_ON : SLOT}"/>`
    }
  }
  const bolt = [
    [567, 250],
    [405, 548],
    [512, 548],
    [452, 792],
    [648, 470],
    [527, 470],
  ]
    .map(([x, y]) => `${s(x)},${s(y)}`)
    .join(' ')

  return `
    <rect x="${s(286)}" y="${s(196)}" width="${452 * scale}" height="${632 * scale}" rx="${44 * scale}"
          fill="${PANEL}" stroke="${PANEL_EDGE}" stroke-width="${10 * scale}"/>
    ${slots}
    <polygon points="${bolt}" fill="${BOLT}" stroke="${BG}" stroke-width="${18 * scale}" stroke-linejoin="round"/>
  `
}

function svg({ background, scale }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${background ? `<rect width="1024" height="1024" rx="224" fill="${BG}"/>` : ''}
    ${mark(scale)}
  </svg>`
}

async function render(name, opts, size = 1024) {
  const buf = Buffer.from(svg(opts))
  await sharp(buf).resize(size, size).png().toFile(path.join(OUT, name))
  console.log('wrote', name, `${size}x${size}`)
}

await mkdir(OUT, { recursive: true })
// Full-bleed icon (iOS masks the corners), branded splash + android foreground
// (transparent, inset for safe zone), and a small favicon.
await render('icon.png', { background: true, scale: 1 }, 1024)
await render('splash-icon.png', { background: false, scale: 0.78 }, 1024)
await render('android-icon-foreground.png', { background: false, scale: 0.62 }, 1024)
await render('favicon.png', { background: true, scale: 1 }, 196)
console.log('done')
