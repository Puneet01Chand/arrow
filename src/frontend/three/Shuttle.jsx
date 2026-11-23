import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { bandTexture, corkTexture, featherTexture, leatherTexture, nylonTexture } from './textures.js'

// A shuttlecock built to the Laws of Badminton, in centimetres:
// 16 feathers 6.6 cm long, tips on a 6.4 cm circle, cork base 2.64 cm across.
export const DIM = {
  corkR: 1.32,
  corkTop: 2.48,
  capTop: 1.42,
  baseR: 1.0,
  tipR: 3.2,
  len: 6.6,
  count: 16,
}
DIM.height = Math.sqrt(DIM.len ** 2 - (DIM.tipR - DIM.baseR) ** 2)
export const MODEL_HEIGHT = DIM.corkTop + DIM.height // about 8.7
export const PIVOT_Y = -3.9 // turns about a point a little below the middle, like the real thing

const VARIANTS = {
  tournament: { feather: 'goose', thread: '#2C8A5E', band: (s) => `ARROW TOURNAMENT  ${s}`, ink: '#1f6e4b', cork: '#ffffff' },
  club: { feather: 'duck', thread: '#cfcbbf', band: (s) => `ARROW CLUB  ${s}`, ink: '#2b2f2c', cork: '#c9b39a' },
  training: { feather: null, thread: null, band: () => `ARROW TRAINING`, ink: '#2C8A5E', cork: '#ffffff' },
}
const CAP_INK = { Green: '#2a9a55', Blue: '#2f6fd6', Red: '#d8432f' }
const SKIRT = { Yellow: '#e9f43c', White: '#f3f3ee' }

const UP = new THREE.Vector3(0, 1, 0)
export const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function corkProfile(r, top, steps = 18) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    pts.push(new THREE.Vector2(Math.max(0.0001, r * Math.sin(a)), r - r * Math.cos(a)))
  }
  pts.push(new THREE.Vector2(r * 0.99, top - 0.06))
  pts.push(new THREE.Vector2(r * 0.95, top))
  pts.push(new THREE.Vector2(0.0001, top - 0.03))
  return pts
}

function capProfile(r, top, steps = 18) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    const y = r - r * Math.cos(a)
    if (y > top) break
    pts.push(new THREE.Vector2(Math.max(0.0001, (r + 0.025) * Math.sin(a)), y - 0.02))
  }
  pts.push(new THREE.Vector2(r + 0.025, top))
  return pts
}

// One vane, bent onto the cone the 16 feathers make. Its left edge sits a
// touch inside the cone and its right edge a touch outside, so neighbours
// overlap like shingles, the way real feathers do.
function vaneGeometry(phi) {
  const { baseR, tipR, len, corkTop, height } = DIM
  const W = 1.5
  const segU = 6, segV = 18
  const pos = [], uv = [], idx = []
  const bx = baseR * Math.cos(phi), bz = baseR * Math.sin(phi), by = corkTop - 0.06
  for (let j = 0; j <= segV; j++) {
    const v = j / segV
    const s = len * (0.38 + 0.62 * v)
    const r = baseR + ((tipR - baseR) * s) / len
    const y = corkTop - 0.06 + (height * s) / len
    for (let i = 0; i <= segU; i++) {
      const u = i / segU - 0.5
      const a = (u * W) / r
      const dr = 0.045 * (u + 0.5) - 0.012 * (1 - 4 * u * u) // shingle + slight cup
      const R = r + dr
      pos.push(R * Math.cos(phi + a) - bx, y - by, R * Math.sin(phi + a) - bz)
      uv.push(u + 0.5, v)
    }
  }
  for (let j = 0; j < segV; j++)
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i, b = a + 1, c = a + segU + 1, d = c + 1
      idx.push(a, c, b, b, c, d)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export const Shuttle = forwardRef(function Shuttle(
  { variant = 'tournament', option = '77', colour = 'Yellow', explodeRef, lagGroupRef, onAnchors },
  ref
) {
  const v = VARIANTS[variant]
  const root = useRef()
  const cap = useRef()
  const cork = useRef()
  const threads = useRef([])
  const feathers = useRef([])
  const skirt = useRef()
  const featherGroup = useRef()
  const anchors = useRef({})

  useImperativeHandle(ref, () => root.current)

  const mats = useMemo(() => {
    const cm = corkTexture().clone()
    cm.needsUpdate = true
    cm.repeat.set(3, 1)
    const leather = leatherTexture(variant === 'club' ? 'cream' : 'white').clone()
    leather.needsUpdate = true
    leather.repeat.set(4, 1)
    const ink = variant === 'training' ? CAP_INK[option] || '#2C8A5E' : v.ink
    const band = bandTexture(v.band(option), ink)
    return {
      cork: new THREE.MeshStandardMaterial({ map: cm, color: v.cork, roughness: 0.95 }),
      cap: new THREE.MeshPhysicalMaterial({ map: leather, color: '#ffffff', roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.5 }),
      band: new THREE.MeshStandardMaterial({ map: band, roughness: 0.55 }),
      feather: v.feather
        ? new THREE.MeshPhysicalMaterial({
            map: featherTexture(v.feather),
            alphaTest: 0.45,
            alphaToCoverage: true,
            side: THREE.DoubleSide,
            roughness: 0.68,
            sheen: 0.7,
            sheenRoughness: 0.45,
            sheenColor: new THREE.Color('#ffffff'),
          })
        : null,
      quill: new THREE.MeshStandardMaterial({ color: '#f2efe6', roughness: 0.45 }),
      thread: v.thread ? new THREE.MeshStandardMaterial({ color: v.thread, roughness: 0.8 }) : null,
      skirt:
        variant === 'training'
          ? new THREE.MeshPhysicalMaterial({
              alphaMap: nylonTexture(),
              alphaTest: 0.5,
              alphaToCoverage: true,
              color: SKIRT[colour] || SKIRT.Yellow,
              side: THREE.DoubleSide,
              roughness: 0.38,
              clearcoat: 0.6,
            })
          : null,
    }
  }, [variant, option, colour])

  const geo = useMemo(() => {
    const { corkR, corkTop, capTop, baseR, tipR, len, count, height } = DIM
    const g = {
      cork: new THREE.LatheGeometry(corkProfile(corkR, corkTop), 72),
      cap: new THREE.LatheGeometry(capProfile(corkR, capTop), 72),
      band: new THREE.CylinderGeometry(corkR + 0.012, corkR + 0.012, corkTop - capTop - 0.1, 72, 1, true),
      feathers: [],
      threads: [],
    }
    if (variant !== 'training') {
      const quillLen = len * 0.42
      for (let i = 0; i < count; i++) {
        const phi = (i / count) * Math.PI * 2
        const dir = new THREE.Vector3((tipR - baseR) * Math.cos(phi), height, (tipR - baseR) * Math.sin(phi)).normalize()
        const quill = new THREE.CylinderGeometry(0.03, 0.05, quillLen, 6, 1)
        quill.translate(0, quillLen / 2, 0)
        quill.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir))
        g.feathers.push({
          phi,
          vane: vaneGeometry(phi),
          quill,
          base: new THREE.Vector3(baseR * Math.cos(phi), corkTop - 0.06, baseR * Math.sin(phi)),
          radial: new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi)),
          tangent: new THREE.Vector3(-Math.sin(phi), 0, Math.cos(phi)),
        })
      }
      for (const s of [0.16, 0.29]) {
        const sl = len * s
        const r = baseR + ((tipR - baseR) * sl) / len + 0.05
        const t = new THREE.TorusGeometry(r, 0.06, 8, 120)
        t.rotateX(Math.PI / 2)
        g.threads.push({ geo: t, y: corkTop - 0.06 + (height * sl) / len })
      }
    } else {
      const pts = []
      for (let i = 0; i <= 24; i++) {
        const t = i / 24
        pts.push(new THREE.Vector2(baseR + 0.05 + (tipR + 0.05 - baseR) * Math.pow(t, 0.9), corkTop - 0.1 + height * t))
      }
      g.skirt = new THREE.LatheGeometry(pts, 96)
    }
    return g
  }, [variant])

  const tmpQ = useMemo(() => new THREE.Quaternion(), [])
  const reported = useRef(false)

  useFrame(() => {
    const e = explodeRef ? explodeRef.current : 0
    if (cap.current) cap.current.position.y = -e * 2.3
    if (cork.current) cork.current.position.y = -e * 0.7
    geo.feathers.forEach((f, i) => {
      const node = feathers.current[i]
      if (!node) return
      const ei = smooth(0, 1, e * 1.3 - (i / 16) * 0.3)
      node.position.copy(f.base).addScaledVector(f.radial, ei * 1.05).addScaledVector(UP, ei * 1.0)
      tmpQ.setFromAxisAngle(f.tangent, -ei * 0.3)
      node.quaternion.copy(tmpQ)
    })
    geo.threads.forEach((t, i) => {
      const node = threads.current[i]
      if (!node) return
      node.position.y = t.y + e * (1.9 + i * 0.9)
      const s = 1 + e * (0.55 + i * 0.25)
      node.scale.set(s, 1, s)
    })
    if (onAnchors && !reported.current) {
      reported.current = true
      onAnchors(anchors.current)
    }
  })

  const setAnchor = (k) => (o) => {
    if (o) anchors.current[k] = o
  }

  return (
    <group ref={root}>
      <group position={[0, PIVOT_Y, 0]}>
        <group ref={cork}>
          <mesh geometry={geo.cork} material={mats.cork} />
          <mesh geometry={geo.band} material={mats.band} position={[0, DIM.capTop + (DIM.corkTop - DIM.capTop - 0.1) / 2, 0]} />
          <object3D ref={setAnchor('cork')} position={[DIM.corkR, 1.95, 0.2]} />
        </group>
        <group ref={cap}>
          <mesh geometry={geo.cap} material={mats.cap} />
          <object3D ref={setAnchor('cap')} position={[-DIM.corkR * 0.8, 0.35, 0.3]} />
        </group>
        <group position={[0, DIM.corkTop, 0]}>
        <group
          ref={(o) => {
            featherGroup.current = o
            if (lagGroupRef) lagGroupRef.current = o
          }}
        >
        <group position={[0, -DIM.corkTop, 0]}>
          {geo.feathers.map((f, i) => (
            <group key={i} ref={(o) => (feathers.current[i] = o)} position={f.base}>
              <mesh geometry={f.quill} material={mats.quill} />
              <mesh geometry={f.vane} material={mats.feather} />
              {i === 1 && <object3D ref={setAnchor('feathers')} position={[2.3, 6.0, 0]} />}
            </group>
          ))}
          {geo.threads.map((t, i) => (
            <mesh key={i} ref={(o) => (threads.current[i] = o)} geometry={t.geo} material={mats.thread} position={[0, t.y, 0]}>
              {i === 1 && <object3D ref={setAnchor('threads')} position={[-1.6, 0, 0.8]} />}
            </mesh>
          ))}
          {geo.skirt && <mesh ref={skirt} geometry={geo.skirt} material={mats.skirt} />}
        </group>
        </group>
        </group>
        <object3D ref={setAnchor('weight')} position={[0, MODEL_HEIGHT + 0.6, 0]} />
      </group>
    </group>
  )
})
