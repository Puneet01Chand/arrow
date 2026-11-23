import * as THREE from 'three'

// All surface detail is drawn on canvases at load, so the page needs no image files.

const cache = new Map()
const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)
}

function rng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

function tex(canvas, { repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.needsUpdate = true
  return t
}

// One feather vane: a rounded trimmed shape with barbs fanning off the rachis.
export function featherTexture(kind = 'goose') {
  return memo('feather-' + kind, () => {
    const w = 256, h = 512
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')
    const r = rng(kind === 'goose' ? 7 : 19)
    const base = kind === 'goose' ? [246, 244, 236] : [232, 229, 220]
    const shade = kind === 'goose' ? [214, 210, 198] : [196, 192, 182]

    // half-width along the vane, t = 0 at the bottom of the vane, 1 at the tip
    const hw = (t) => {
      let v = 0.3 + 0.2 * Math.min(1, t / 0.62)
      if (t > 0.8) v *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.8) / 0.2, 2))) * 0.92 + 0.08
      return v * w * 0.98
    }
    const path = () => {
      g.beginPath()
      const steps = 80
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        g.lineTo(w / 2 - hw(t), h - t * h)
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps
        g.lineTo(w / 2 + hw(t), h - t * h)
      }
      g.closePath()
    }

    path()
    const grad = g.createLinearGradient(0, 0, w, 0)
    grad.addColorStop(0, `rgb(${shade})`)
    grad.addColorStop(0.18, `rgb(${base})`)
    grad.addColorStop(0.5, `rgb(${base.map((v) => v - 6)})`)
    grad.addColorStop(0.82, `rgb(${base})`)
    grad.addColorStop(1, `rgb(${shade})`)
    g.fillStyle = grad
    g.fill()

    // barbs
    g.save()
    path()
    g.clip()
    for (let y = h; y > 0; y -= 2.2) {
      const t = 1 - y / h
      const spread = hw(t) + 6
      const a = 0.09 + r() * 0.12
      g.strokeStyle = `rgba(110,106,94,${a})`
      g.lineWidth = 0.8
      g.beginPath()
      g.moveTo(w / 2, y)
      g.quadraticCurveTo(w / 2 - spread * 0.6, y - spread * 0.25, w / 2 - spread, y - spread * 0.58)
      g.stroke()
      g.beginPath()
      g.moveTo(w / 2, y)
      g.quadraticCurveTo(w / 2 + spread * 0.6, y - spread * 0.25, w / 2 + spread, y - spread * 0.58)
      g.stroke()
    }
    // soft light patches so neighbouring feathers don't read as one sheet
    for (let i = 0; i < 6; i++) {
      const x = w * (0.2 + r() * 0.6), y = h * r()
      const rg = g.createRadialGradient(x, y, 0, x, y, 70)
      rg.addColorStop(0, 'rgba(255,255,255,0.18)')
      rg.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = rg
      g.fillRect(0, 0, w, h)
    }
    g.restore()

    // a few splits in the vane edge
    g.globalCompositeOperation = 'destination-out'
    for (let i = 0; i < 9; i++) {
      const t = 0.15 + r() * 0.7
      const side = r() > 0.5 ? 1 : -1
      const x = w / 2 + side * hw(t)
      const y = h - t * h
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x - side * (10 + r() * 16), y - 6 - r() * 10)
      g.lineTo(x - side * 2, y - 12 - r() * 6)
      g.closePath()
      g.fill()
    }
    g.globalCompositeOperation = 'source-over'

    // rachis (the centre quill)
    const rq = g.createLinearGradient(0, h, 0, 0)
    rq.addColorStop(0, 'rgba(250,248,240,1)')
    rq.addColorStop(1, 'rgba(225,221,208,0.9)')
    g.fillStyle = rq
    g.beginPath()
    g.moveTo(w / 2 - 3.2, h)
    g.lineTo(w / 2 + 3.2, h)
    g.lineTo(w / 2 + 0.8, h * 0.03)
    g.lineTo(w / 2 - 0.8, h * 0.03)
    g.closePath()
    g.fill()
    return tex(c)
  })
}

export function corkTexture() {
  return memo('cork', () => {
    const s = 256
    const c = document.createElement('canvas')
    c.width = c.height = s
    const g = c.getContext('2d')
    g.fillStyle = '#b98d64'
    g.fillRect(0, 0, s, s)
    const r = rng(3)
    for (let i = 0; i < 2600; i++) {
      const x = r() * s, y = r() * s, rad = 0.4 + r() * 2.2
      const l = r()
      g.fillStyle = l > 0.6 ? `rgba(90,58,34,${0.25 + r() * 0.4})` : `rgba(226,190,150,${0.18 + r() * 0.3})`
      g.beginPath()
      g.arc(x, y, rad, 0, Math.PI * 2)
      g.fill()
    }
    return tex(c, { repeat: true })
  })
}

export function leatherTexture(tone = 'white') {
  return memo('leather-' + tone, () => {
    const s = 256
    const c = document.createElement('canvas')
    c.width = c.height = s
    const g = c.getContext('2d')
    g.fillStyle = tone === 'white' ? '#f1efe8' : '#e8e2d4'
    g.fillRect(0, 0, s, s)
    const r = rng(11)
    for (let i = 0; i < 900; i++) {
      g.strokeStyle = `rgba(150,140,120,${0.04 + r() * 0.07})`
      g.lineWidth = 0.6
      const x = r() * s, y = r() * s
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + (r() - 0.5) * 18, y + (r() - 0.5) * 6)
      g.stroke()
    }
    return tex(c, { repeat: true })
  })
}

// The printed band round the cork: brand and speed, so a speed swatch
// changes what you see on the shuttle itself.
export function bandTexture(text, ink = '#1f6e4b', paper = '#f4f3ee') {
  return memo('band-' + text + ink + paper, () => {
    const w = 1024, h = 96
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')
    g.fillStyle = paper
    g.fillRect(0, 0, w, h)
    g.fillStyle = ink
    g.fillRect(0, 6, w, 7)
    g.fillRect(0, h - 13, w, 7)
    g.font = '800 40px Archivo, system-ui, sans-serif'
    g.textBaseline = 'middle'
    const unit = text + '   ·   '
    const uw = g.measureText(unit).width
    for (let x = 0; x < w + uw; x += uw) g.fillText(unit, x, h / 2 + 1)
    const t = tex(c)
    t.wrapS = THREE.RepeatWrapping
    return t
  })
}

// Nylon skirt: ribs low down, an open diamond mesh above, a solid rim at the top.
export function nylonTexture() {
  return memo('nylon', () => {
    const w = 1024, h = 512
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')
    g.clearRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    // canvas top = skirt rim
    g.fillRect(0, 0, w, 34)
    // diamond mesh between rim and ribs
    g.lineWidth = 7
    g.strokeStyle = '#ffffff'
    const cells = 32
    const cw = w / cells
    const top = 34, bottom = h * 0.62
    for (let i = -cells; i < cells * 2; i++) {
      g.beginPath()
      g.moveTo(i * cw, top)
      g.lineTo(i * cw + (bottom - top) * 0.55, bottom)
      g.stroke()
      g.beginPath()
      g.moveTo(i * cw, top)
      g.lineTo(i * cw - (bottom - top) * 0.55, bottom)
      g.stroke()
    }
    g.fillRect(0, bottom - 8, w, 22)
    // ribs down to the cork
    const ribs = 16
    for (let i = 0; i < ribs; i++) {
      const x = (i + 0.5) * (w / ribs)
      g.fillRect(x - 9, bottom, 18, h - bottom)
    }
    g.fillRect(0, h - 40, w, 40)
    const t = tex(c)
    t.wrapS = THREE.RepeatWrapping
    return t
  })
}
