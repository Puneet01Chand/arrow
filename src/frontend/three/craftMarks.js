import { DIM, PIVOT_Y } from './Shuttle.jsx'

// Technical callouts for "How a tube is made". Each mark is a point (or two)
// on the shuttle, in the travelling shuttle's non-spinning group space
// (centimetres, z = 0, so points on the rim stay on the silhouette while the
// body spins). Every frame the stage projects them to the screen and
// layoutMark() writes the result to the mark's CSS variables.

const { corkR, corkTop, baseR, tipR, len, height } = DIM
const Y = (y) => PIVOT_Y + y
const tipY = corkTop + height
// a point on the feather skirt's outline, s = 0 at the cork, 1 at the tips
const skirt = (s) => ({ r: baseR + (tipR - baseR) * s, y: corkTop - 0.06 + height * s })
const thread = skirt(0.29) // the upper thread row (see Shuttle.jsx)

// Outward normal of the +x feather edge: the feather-length dimension line
// runs parallel to that feather, set off from it by OFF.
const NX = height / len
const NY = -(tipR - baseR) / len
const OFF = 0.7

export const CRAFT_CENTER = [0, Y(corkTop + height * 0.5)]

export const CRAFT_MARKS = {
  guide: { kind: 'guide', at: CRAFT_CENTER, r: 4.6 },
  feathers: { kind: 'point', at: [-tipR, Y(tipY)] },
  corkBase: { kind: 'point', at: [corkR * 0.72, Y(0.28)] },
  featherLength: {
    kind: 'dim',
    from: [baseR + NX * OFF, Y(corkTop + NY * OFF)],
    to: [tipR + NX * OFF, Y(tipY + NY * OFF)],
    label: 'mid',
  },
  corkWidth: { kind: 'dim', from: [-corkR, Y(1.95)], to: [corkR, Y(1.95)], label: 'end' },
  cap: { kind: 'point', at: [corkR * 0.72, Y(0.28)] },
  threads: { kind: 'point', at: [-(thread.r + 0.05), Y(thread.y)] },
  tipCircle: { kind: 'dim', from: [tipR, Y(tipY)], to: [-tipR, Y(tipY)], label: 'end' },
  weight: { kind: 'point', at: [-corkR * 0.72, Y(0.28)] },
  speed: { kind: 'point', at: [-tipR, Y(tipY)] },
}

const a = [0, 0]
const b = [0, 0]
const px = (v) => v.toFixed(1) + 'px'

// project(point, out) -> out = [screenX, screenY] in viewport pixels.
// top: the pinned stage's offset from the viewport top (non-zero while it
// scrolls in or out). center: the shuttle's projected centre. ppu: screen
// pixels per model centimetre.
export function layoutMark({ el, def }, project, top, center, ppu) {
  const s = el.style
  if (def.kind === 'point' || def.kind === 'guide') {
    project(def.at, a)
    s.setProperty('--x', px(a[0]))
    s.setProperty('--y', px(a[1] - top))
    if (def.kind === 'guide') s.setProperty('--r', px(def.r * ppu))
    return
  }
  project(def.from, a)
  project(def.to, b)
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const L = Math.hypot(dx, dy) || 1
  s.setProperty('--x', px(a[0]))
  s.setProperty('--y', px(a[1] - top))
  s.setProperty('--len', px(L))
  s.setProperty('--ang', ((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2) + 'deg')

  let lx, ly, toRight
  if (def.label === 'end') {
    // just past the `to` end, reading away from the line
    lx = b[0] + (dx / L) * 26
    ly = b[1] + (dy / L) * 26
    toRight = dx >= 0
  } else {
    // beside the midpoint, on the side away from the shuttle
    let nx = -dy / L
    let ny = dx / L
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    if (nx * (mx - center[0]) + ny * (my - center[1]) < 0) {
      nx = -nx
      ny = -ny
    }
    lx = mx + nx * 16
    ly = my + ny * 16
    toRight = nx >= 0
  }
  s.setProperty('--lx', px(lx))
  s.setProperty('--ly', px(ly - top))
  s.setProperty('--la', toRight ? '0%' : '-100%')
}
