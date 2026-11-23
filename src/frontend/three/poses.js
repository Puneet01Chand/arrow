import { getSections, viewport, smooth, lerp, clamp, easeInOut, flags, easeOut } from '../lib/scroll.js'
import { flightPath } from './bridge.js'

// Where the one shuttle sits in each section. x and y are fractions of the
// viewport from its centre (y up), s is the model's height as a fraction of
// the viewport height, e is how far it is taken apart.

const P = (o) => ({ x: 0, y: 0, s: 0.5, rx: 0, ry: 0, rz: 0, e: 0, spin: 0.3, ...o })
// phones, and tablets held upright, stack the shuttle above the words
const mobile = () => viewport.w < 760 || (viewport.w <= 1100 && viewport.h > viewport.w * 1.05)
const tablet = () => viewport.w < 1100

const POSES = {
  hero: () =>
    mobile()
      ? P({ x: 0.04, y: 0.17, s: 0.3, rx: 0.2, rz: -0.42, spin: 0.35 })
      : P({ x: tablet() ? 0.25 : 0.24, y: -0.07, s: 0.5, rx: 0.2, rz: -0.4, spin: 0.35 }),

  anatomy: (p) => {
    const e = smooth(0.1, 0.5, p)
    const m = mobile()
    return P({
      x: m ? 0 : lerp(0, 0.05, e),
      y: lerp(-0.04, m ? -0.02 : -0.08, e),
      s: lerp(m ? 0.34 : 0.54, m ? 0.24 : 0.4, e),
      rx: lerp(0.15, 0.42, e),
      rz: lerp(-0.25, 0, smooth(0, 0.25, p)),
      ry: p * 1.2,
      e,
      spin: 0.12,
    })
  },

  flight: (p) => flightPose(p),

  speed: () =>
    mobile()
      ? P({ x: 0.3, y: 0.95, s: 0.2, rx: 0.2, rz: 0.5, spin: 0.6 })
      : P({ x: -0.25, y: -0.02, s: 0.44, rx: 0.22, rz: 0.38, spin: 0.4 }),

  shop: () => P({ x: 0.1, y: 0.95, s: 0.4, rz: 0.6, spin: 0.6 }),

  craft: (p) => {
    const m = mobile()
    const keys = [
      // 1 feathers, side on and close
      P({ x: 0.2, y: -0.06, s: 0.62, rx: 0.2, rz: -0.5, spin: 0.1 }),
      // 2 cork, base turned to the viewer
      P({ x: 0.22, y: 0.02, s: 0.6, rx: -1.05, rz: 0.2, spin: 0.1 }),
      // 3 threads and quills, looking down into the skirt
      P({ x: 0.22, y: -0.02, s: 0.62, rx: 1.2, rz: -0.1, spin: 0.08 }),
      // 4 the finished shuttle
      P({ x: 0.22, y: -0.02, s: 0.56, rx: 0.15, rz: -0.12, spin: 0.3 }),
    ]
    const f = clamp(p * 3.6 - 0.3, 0, 3)
    const i = Math.min(2, Math.floor(f))
    const t = easeInOut(clamp(f - i, 0, 1))
    const out = mix(keys[i], keys[i + 1], t)
    if (m) {
      out.x = 0
      out.y = out.y * 0.4 + 0.22
      out.s *= 0.5
    }
    return out
  },

  // From the clubs section on, the shuttle stays parked below the screen. It
  // used to rise again in the close section, where it sat behind the logo.
  clubs: () => PARKED,
  close: () => PARKED,
}

const PARKED = P({ x: -0.1, y: -1.0, s: 0.4, rz: 0.4, spin: 0.6 })

function flightPose(p) {
  const pts = flightPath.pts
  const m = mobile()
  if (!flightPath.ready || pts.length < 2) return P({ s: 0.14 })
  // stay at the racket for a moment, then fly the whole arc
  const t = clamp((p - 0.08) / 0.84, 0, 1)
  const f = t * (pts.length - 1)
  const i = Math.min(pts.length - 2, Math.floor(f))
  const k = f - i
  const a = pts[i], b = pts[i + 1]
  const px = lerp(a.x, b.x, k), py = lerp(a.y, b.y, k)
  const dx = b.x - a.x, dy = b.y - a.y
  // stage pixels -> viewport fractions (the stage is pinned at the top of the viewport)
  const x = px / viewport.w - 0.5
  const y = 0.5 - (py + flightPath.offsetY) / viewport.h
  // cork leads along the path; just after the hit it is still feathers-first and turns over
  // model -Y (the cork) along the velocity: (sin rz, -cos rz) ~ (dx, -dy)
  let rz = Math.atan2(dx, dy)
  const flip = 1 - smooth(0.0, 0.14, t)
  rz += Math.PI * flip
  return P({ x, y, s: m ? 0.09 : 0.13, rx: 0.2, rz, spin: 2.2 })
}

function mix(a, b, t) {
  const o = {}
  for (const k in a) o[k] = lerp(a[k], b[k] ?? a[k], t)
  return o
}

// The pose for a scroll position: inside a section, its own pose; in the
// scroll between two sections, a blend from the end of one to the start of the next.
export function targetPose(y) {
  const secs = getSections().filter((s) => POSES[s.id])
  if (!secs.length) return POSES.hero()
  const vh = viewport.h
  const spans = secs.map((s) => ({ id: s.id, start: s.top, end: s.top + Math.max(0, s.height - vh) }))
  let pose
  if (y <= spans[0].start) pose = POSES[spans[0].id](0)
  else {
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i]
      if (y >= s.start && y <= s.end) {
        pose = POSES[s.id]((y - s.start) / Math.max(1, s.end - s.start))
        break
      }
      const n = spans[i + 1]
      if (n && y > s.end && y < n.start) {
        const t = easeInOut((y - s.end) / Math.max(1, n.start - s.end))
        pose = mix(POSES[s.id](1), POSES[n.id](0), t)
        break
      }
    }
    if (!pose) pose = POSES[spans[spans.length - 1].id](1)
  }
  // hero entrance: drops in from above, spinning, once the loader lifts
  if (flags.intro < 1) {
    const k = easeOut(flags.intro)
    pose = { ...pose, y: pose.y + (1 - k) * 1.1, rz: pose.rz + (1 - k) * 1.6, spin: pose.spin + (1 - k) * 6 }
  }
  return pose
}
