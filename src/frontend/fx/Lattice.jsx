import React, { useEffect, useRef } from 'react'
import { flags } from '../lib/scroll.js'

// The hero's grid: court-line squares that light up under the cursor and
// fade a beat later. On touch screens a few squares glow on their own.
export default function Lattice({ className }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const g = canvas.getContext('2d')
    let W = 0, H = 0, cell = 48, cols = 0, rows = 0, vals = new Float32Array(0), dpr = 1
    let raf = 0, visible = true, last = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = r.width
      H = r.height
      cell = W < 760 ? 38 : 52
      canvas.width = W * dpr
      canvas.height = H * dpr
      cols = Math.ceil(W / cell) + 1
      rows = Math.ceil(H / cell) + 1
      vals = new Float32Array(cols * rows)
    }
    const light = (x, y, amt = 1) => {
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell)
      for (let j = -2; j <= 2; j++)
        for (let i = -2; i <= 2; i++) {
          const X = cx + i, Y = cy + j
          if (X < 0 || Y < 0 || X >= cols || Y >= rows) continue
          const d = Math.hypot(i, j)
          const v = Math.max(0, 1 - d / 2.4) * amt
          const k = Y * cols + X
          if (v > vals[k]) vals[k] = v
        }
    }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      if (x < 0 || y < 0 || x > W || y > H) return
      light(x, y)
    }
    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      if (!visible) return
      if (now - last > 380 && !flags.reduced) {
        last = now
        light(Math.random() * W, Math.random() * H, 0.35 + Math.random() * 0.25)
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, W, H)
      g.strokeStyle = 'rgba(232,238,228,0.055)'
      g.lineWidth = 1
      g.beginPath()
      for (let x = 0; x <= W; x += cell) {
        g.moveTo(Math.round(x) + 0.5, 0)
        g.lineTo(Math.round(x) + 0.5, H)
      }
      for (let y = 0; y <= H; y += cell) {
        g.moveTo(0, Math.round(y) + 0.5)
        g.lineTo(W, Math.round(y) + 0.5)
      }
      g.stroke()
      for (let k = 0; k < vals.length; k++) {
        const v = vals[k]
        if (v < 0.01) continue
        const x = (k % cols) * cell, y = Math.floor(k / cols) * cell
        g.fillStyle = `rgba(217,255,63,${v * 0.1})`
        g.fillRect(x + 1, y + 1, cell - 1, cell - 1)
        g.strokeStyle = `rgba(217,255,63,${v * 0.45})`
        g.strokeRect(x + 0.5, y + 0.5, cell, cell)
        vals[k] = v * 0.94
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [])
  return <canvas ref={ref} className={className} aria-hidden="true" />
}
