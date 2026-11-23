import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, PerspectiveCamera, View } from '@react-three/drei'
import { Shuttle, MODEL_HEIGHT, DIM, PIVOT_Y, smooth } from './Shuttle.jsx'
import { targetPose } from './poses.js'
import { pointer, viewport, flags, progressOf, getSection } from '../lib/scroll.js'
import { anatomyLabels, productHover, craftMarks, craftStage } from './bridge.js'
import { CRAFT_CENTER, layoutMark } from './craftMarks.js'

// One WebGL canvas for every shuttle on the page: drei Views cut it into the
// full-screen stage (the shuttle that travels down the page) and one window
// per product card.

function Clearer() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false)
    gl.clear(true, true, true)
  }, 1)
  return null
}

export function Lights({ rim = '#b8ffd8' }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 7, 6]} intensity={2.6} color="#fffaf2" />
      <directionalLight position={[-5, 3, 4]} intensity={0.9} color="#f4f7ff" />
      <directionalLight position={[-6, 1.5, -4]} intensity={1.6} color={rim} />
      <directionalLight position={[0, -6, 3]} intensity={0.35} color="#d9ff3f" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 4, 6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.0} color="#ffffff" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#9effc9" position={[-6, 0, -2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={0.9} color="#d9ff3f" position={[5, -2, -3]} scale={3} />
      </Environment>
    </>
  )
}

// Label anchors on the shuttle's outline, in the non-spinning group's space,
// following the same explode offsets the model uses. The outline is round,
// so the spin never moves them.
function anchorPoints(e, out) {
  const { corkR, corkTop, baseR, tipR, len, height } = DIM
  const at = (s) => ({ r: baseR + ((tipR - baseR) * s) / len, y: corkTop + (height * s) / len })
  const ef = smooth(0, 1, e * 1.3 - 0.15)
  const vane = at(len * 0.78)
  out.feathers.set(vane.r + ef * 2.4 + 0.3, PIVOT_Y + vane.y + ef * 1.1, 0)
  const th = at(len * 0.29)
  out.threads.set(-(th.r * (1 + e * 0.8) + 0.25 + ef * 1.2), PIVOT_Y + th.y + e * 2.8, 0)
  out.cork.set(corkR + 0.1, PIVOT_Y + 1.95 - e * 0.7, 0)
  out.cap.set(-(corkR + 0.1), PIVOT_Y + 0.55 - e * 2.3, 0)
  out.weight.set(corkR * 0.9, PIVOT_Y - 0.45 - e * 2.3, 0)
}

// The feather skirt lags the cork as the shuttle follows the pointer. It
// bends at the cork's top, so a large angle pulls the feather ring off the
// cork on one side. tanh keeps small moves as they were (slope 0.9) and eases
// big, fast sweeps into a slight bend of at most LAG_MAX radians.
const LAG_MAX = 0.09
const lagBend = (v) => LAG_MAX * Math.tanh((v * 0.9) / LAG_MAX)

const viewH = (cam) => 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.position.z

function Traveler() {
  const outer = useRef()
  const body = useRef()
  const lag = useRef()
  const explode = useRef(0)
  const anchors = useMemo(() => ({ feathers: new THREE.Vector3(), threads: new THREE.Vector3(), cork: new THREE.Vector3(), cap: new THREE.Vector3(), weight: new THREE.Vector3() }), [])
  const cur = useRef(null)
  const follow = useRef({ fx: 0, fy: 0, sx: 0, sy: 0, spin: 0 })
  const v3 = useMemo(() => new THREE.Vector3(), [])
  const centreRef = useRef([0, 0]) // the shuttle's projected centre, scratch per frame

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const cam = state.camera
    const target = targetPose(window.scrollY)
    if (!cur.current) cur.current = { ...target }
    const c = cur.current
    const k = flags.reduced ? 1 : 1 - Math.exp(-dt * 7)
    for (const key in target) c[key] += (target[key] - c[key]) * k

    const vh = viewH(cam)
    const vw = vh * cam.aspect
    const g = outer.current
    g.position.set(c.x * vw, c.y * vh, 0)
    g.scale.setScalar((c.s * vh) / MODEL_HEIGHT)

    // the body turns toward the hand quickly, the feathers follow a beat behind
    const f = follow.current
    const px = pointer.active ? pointer.x : 0
    const py = pointer.active ? pointer.y : 0
    const kf = 1 - Math.exp(-dt * 5)
    const ks = 1 - Math.exp(-dt * 1.7)
    f.fx += (px - f.fx) * kf
    f.fy += (py - f.fy) * kf
    f.sx += (px - f.sx) * ks
    f.sy += (py - f.sy) * ks
    g.rotation.set(c.rx + f.fy * 0.22, c.ry + f.fx * 0.5, c.rz - f.fx * 0.08)
    if (!flags.reduced) f.spin += c.spin * dt
    body.current.rotation.y = f.spin
    if (lag.current) lag.current.rotation.set(lagBend(f.sy - f.fy), 0, lagBend(f.fx - f.sx))
    explode.current = c.e

    // anatomy labels follow the parts on screen
    const an = getSection('anatomy')
    if (an && anatomyLabels.size) {
      const y = window.scrollY
      const on = y > an.top - viewport.h * 0.6 && y < an.top + an.height - viewport.h * 0.3
      if (on) {
        g.updateMatrixWorld(true)
        anchorPoints(c.e, anchors)
        for (const [key, el] of anatomyLabels) {
          const a = anchors[key]
          if (!a || !el) continue
          v3.copy(a)
          g.localToWorld(v3)
          v3.project(cam)
          const sx = (v3.x * 0.5 + 0.5) * viewport.w
          const sy = (-v3.y * 0.5 + 0.5) * viewport.h
          el.style.setProperty('--ax', sx.toFixed(1) + 'px')
          el.style.setProperty('--ay', sy.toFixed(1) + 'px')
        }
      }
    }

    // craft callouts and glow follow the shuttle while that section is on screen
    const cs = getSection('craft')
    if (cs && craftStage.el && craftMarks.size) {
      const y = window.scrollY
      if (y > cs.top - viewport.h && y < cs.top + cs.height) {
        g.updateMatrixWorld(true)
        const project = (p, out) => {
          v3.set(p[0], p[1], 0)
          g.localToWorld(v3)
          v3.project(cam)
          out[0] = (v3.x * 0.5 + 0.5) * viewport.w
          out[1] = (-v3.y * 0.5 + 0.5) * viewport.h
          return out
        }
        const centre = project(CRAFT_CENTER, centreRef.current)
        const top = craftStage.el.getBoundingClientRect().top
        const ppu = (g.scale.x * viewport.h) / vh
        for (const m of craftMarks.values()) if (m.el) layoutMark(m, project, top, centre, ppu)
        const sec = craftStage.section
        if (sec) {
          sec.style.setProperty('--gx', centre[0].toFixed(1) + 'px')
          sec.style.setProperty('--gy', centre[1].toFixed(1) + 'px')
        }
      }
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 10]} />
      <Lights />
      <group ref={outer}>
        <group ref={body}>
          <Shuttle variant="tournament" option="77" explodeRef={explode} lagGroupRef={lag} />
        </group>
      </group>
    </>
  )
}

function CardStage({ id, variant, option, colour }) {
  const g = useRef()
  const spin = useRef(Math.random() * 6)
  const hv = useRef(0)
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    hv.current += ((productHover.get(id) || 0) - hv.current) * (1 - Math.exp(-dt * 6))
    const hov = hv.current
    const cam = state.camera
    const vh = viewH(cam)
    if (!flags.reduced) spin.current += dt * (0.35 + hov * 1.6)
    const t = state.clock.elapsedTime
    g.current.scale.setScalar((0.6 * vh) / MODEL_HEIGHT)
    g.current.rotation.set(0.28 + Math.sin(t * 0.7 + spin.current) * 0.03, 0, -0.42 + hov * 0.12)
    g.current.children[0].rotation.y = spin.current
    g.current.position.y = -0.12 + (flags.reduced ? 0 : Math.sin(t * 1.1) * 0.06)
  })
  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 10]} />
      <Lights />
      <group ref={g}>
        <group>
          <Shuttle variant={variant} option={option} colour={colour} />
        </group>
      </group>
    </>
  )
}

export function ProductView({ id, variant, option, colour, className }) {
  return (
    <View className={className} index={3}>
      <CardStage id={id} variant={variant} option={option} colour={colour} />
    </View>
  )
}

export function TravelerView() {
  return (
    <View className="stage-view" index={2}>
      <Traveler />
    </View>
  )
}

export default function Scene() {
  return (
    <Canvas
      className="gl"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    >
      <Clearer />
      <View.Port />
    </Canvas>
  )
}
