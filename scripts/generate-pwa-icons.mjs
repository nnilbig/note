// One-off placeholder PWA icon generator. No image libraries are available
// in this environment, so this hand-encodes minimal valid PNGs using only
// Node's built-in `zlib` (raw RGBA scanlines -> zlib deflate -> PNG chunks).
// Draws a solid gray-900 background with a centered off-white circle,
// echoing the app's `•` BuJo glyph. Run once: `node scripts/generate-pwa-icons.mjs`.
// Replace these with real branded artwork later.

import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const BG = [17, 24, 39, 255] // #111827 (gray-900)
const FG = [249, 250, 251, 255] // #f9fafb (gray-50)

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function drawIcon(size, { maskable = false } = {}) {
  const pixels = Buffer.alloc(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  // Maskable icons need content inside the ~80% "safe zone" since the
  // background already fills the canvas edge-to-edge and gets clipped
  // to a circle/squircle by the OS.
  const radius = size * (maskable ? 0.32 : 0.28)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const inCircle = dx * dx + dy * dy <= radius * radius
      const color = inCircle ? FG : BG
      const offset = (y * size + x) * 4
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = color[3]
    }
  }

  // Each scanline needs a leading filter-type byte (0 = None).
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const srcStart = y * size * 4
    const dstStart = y * (size * 4 + 1)
    raw[dstStart] = 0
    pixels.copy(raw, dstStart + 1, srcStart, srcStart + size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const targets = [
  { file: 'pwa-64x64.png', size: 64 },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'pwa-512x512-maskable.png', size: 512, maskable: true },
  { file: 'apple-touch-icon-180x180.png', size: 180 }
]

for (const { file, size, maskable } of targets) {
  const png = drawIcon(size, { maskable })
  writeFileSync(join(publicDir, file), png)
  console.log(`wrote ${file} (${size}x${size}${maskable ? ', maskable' : ''})`)
}
