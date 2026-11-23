import React, { forwardRef, useEffect, useId, useRef, useState } from 'react'

// Liquid glass. The refraction profile is the one liquid-glass-js computes in
// its fragment shader (edge, rim and corner terms off a rounded-rect distance
// field), baked into a displacement map and run live as an SVG backdrop filter,
// so the glass bends whatever moves behind it, the WebGL shuttle included.
// Chromium runs the bend; other browsers get the frosted fallback.

const supportsBend = (() => {
  if (typeof navigator === 'undefined') return false
  const brands = navigator.userAgentData?.brands?.map((b) => b.brand).join(' ') || ''
  return /Chromium|Google Chrome|Microsoft Edge/.test(brands) || (/Chrome\//.test(navigator.userAgent) && !/Edg\/|OPR\//.test(navigator.userAgent) && !/Firefox/.test(navigator.userAgent))
})()

// liquid-glass-js defaults, in pixels
const OPT = { edgeDistance: 0.15, rimDistance: 0.8, edgeIntensity: 0.01, rimIntensity: 0.05, cornerBoost: 0.02 }

function roundedRectDistance(px, py, w, h, r) {
  const cx = w / 2, cy = h / 2
  const qx = Math.abs(px - cx) - (cx - r)
  const qy = Math.abs(py - cy) - (cy - r)
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  const inside = Math.min(Math.max(qx, qy), 0)
  return outside + inside - r
}

function makeMap(w, h, radius) {
  const s = 0.5 // half resolution is plenty; feImage stretches it
  const W = Math.max(2, Math.round(w * s)), H = Math.max(2, Math.round(h * s))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const img = g.createImageData(W, H)
  const r = Math.min(radius, w / 2, h / 2)
  const minDim = Math.min(w, h)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const px = (x + 0.5) / s, py = (y + 0.5) / s
      const d = Math.max(0, -roundedRectDistance(px, py, w, h, r))
      const edge = Math.exp(-d * OPT.edgeDistance)
      const rim = Math.exp(-d * OPT.rimDistance)
      const cxn = Math.min(px, w - px), cyn = Math.min(py, h - py)
      const corner = Math.exp(-Math.max(cxn, cyn) * 0.3) * OPT.cornerBoost
      let nx = px / w - 0.5, ny = py / h - 0.5
      const nl = Math.hypot(nx, ny) || 1
      nx /= nl
      ny /= nl
      // shader works in page-uv units; scale back to a 0..1 strength over the element
      const strength = Math.min(1, ((edge * OPT.edgeIntensity + rim * OPT.rimIntensity + corner) * 1400) / minDim)
      const i = (y * W + x) * 4
      img.data[i] = 128 + nx * strength * 127
      img.data[i + 1] = 128 + ny * strength * 127
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  g.putImageData(img, 0, 0)
  return c.toDataURL()
}

const Glass = forwardRef(function Glass({ as: Tag = 'div', radius = 28, bend = 46, className = '', children, style, ...rest }, fwd) {
  const own = useRef(null)
  const id = 'lg' + useId().replace(/[^a-z0-9]/gi, '')
  const [map, setMap] = useState(null)
  const setRef = (el) => {
    own.current = el
    if (typeof fwd === 'function') fwd(el)
    else if (fwd) fwd.current = el
  }
  useEffect(() => {
    if (!supportsBend || !own.current) return
    let last = ''
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const el = entry.target
      const w = Math.round(el.offsetWidth || width), h = Math.round(el.offsetHeight || height)
      const key = w + 'x' + h
      if (key === last || w < 4 || h < 4) return
      last = key
      setMap({ url: makeMap(w, h, radius), w, h })
    })
    ro.observe(own.current)
    return () => ro.disconnect()
  }, [radius])

  return (
    <Tag
      ref={setRef}
      className={`glass ${supportsBend && map ? 'glass--bend' : ''} ${className}`}
      style={{ '--glass-r': radius + 'px', '--glass-filter': map ? `url(#${id})` : 'none', ...style }}
      {...rest}
    >
      {supportsBend && map && (
        <svg className="glass__svg" aria-hidden="true" focusable="false" width="0" height="0">
          <filter id={id} x="0" y="0" width={map.w} height={map.h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={map.url} x="0" y="0" width={map.w} height={map.h} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={bend} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <span className="glass__rim" aria-hidden="true" />
      {children}
    </Tag>
  )
})

export default Glass
