// One shared reading of the page: where each section sits, how far the
// visitor has scrolled through it, and where the pointer is. The 3D stage
// reads this every frame; sections read it to drive their own motion.

const sections = new Map() // id -> { el, top, height, order }
const listeners = new Set()

export const viewport = { w: window.innerWidth, h: window.innerHeight }
export const pointer = { x: 0, y: 0, px: window.innerWidth / 2, py: window.innerHeight / 2, active: false }
export const flags = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  intro: 0, // 0..1, the hero entrance after the loader
  introStart: 0,
  ready: false,
}

let order = 0
export function registerSection(id, el) {
  if (!el) return
  const prev = sections.get(id)
  sections.set(id, { el, top: 0, height: 0, order: prev ? prev.order : order++ })
  measure()
}

export function unregisterSection(id) {
  sections.delete(id)
}

export function measure() {
  viewport.w = window.innerWidth
  viewport.h = window.innerHeight
  const y = window.scrollY
  for (const s of sections.values()) {
    const r = s.el.getBoundingClientRect()
    s.top = r.top + y
    s.height = r.height
  }
  listeners.forEach((fn) => fn())
}

export function onMeasure(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getSections() {
  return [...sections.entries()]
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => a.top - b.top)
}

export function getSection(id) {
  return sections.get(id)
}

// 0 when the section's top meets the viewport top, 1 when its bottom meets the viewport bottom.
export function progressOf(id, y = window.scrollY) {
  const s = sections.get(id)
  if (!s) return 0
  const span = Math.max(1, s.height - viewport.h)
  return clamp((y - s.top) / span, 0, 1)
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// pointer, normalised to -1..1
window.addEventListener(
  'pointermove',
  (e) => {
    pointer.px = e.clientX
    pointer.py = e.clientY
    pointer.x = (e.clientX / viewport.w) * 2 - 1
    pointer.y = (e.clientY / viewport.h) * 2 - 1
    pointer.active = e.pointerType === 'mouse'
  },
  { passive: true }
)

let raf = 0
const schedule = () => {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(measure)
}
window.addEventListener('resize', schedule)
window.addEventListener('load', schedule)
if (document.fonts) document.fonts.ready.then(schedule)
new ResizeObserver(schedule).observe(document.documentElement)

window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  flags.reduced = e.matches
})

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: flags.reduced ? 'auto' : 'smooth', block: 'start' })
}
