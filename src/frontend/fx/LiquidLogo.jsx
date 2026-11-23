import React, { useEffect, useRef } from 'react'
import fragSrc from '../shaders/liquid-logo.frag'
import vertSrc from '../shaders/liquid-logo.vert'
import { flags } from '../lib/scroll.js'

// The liquid-metal pass from collidingScopes/liquid-logo (MIT), fed the Arrow
// mark drawn on a canvas. It animates only inside the letter shapes.

const PRESET = {
  // liquid-logo's "Chrome" preset, nudged toward the court greens
  speed: 0.4,
  iterations: 15,
  scale: 3.12,
  dotFactor: 0.04,
  dotMultiplier: 0.21,
  vOffset: 5.1,
  intensityFactor: 0.07,
  expFactor: 0.2,
  noiseIntensity: 0.5,
  color: [0.8, 1.25, 0.72],
  colorShift: 0.9,
  logoInteractStrength: 0.4,
}

export function drawMark(ctx, w, h, { word = 'ARROW', glyph = true } = {}) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'
  // wide cut of Archivo where the browser supports font-stretch on canvas
  try {
    ctx.fontStretch = 'expanded'
  } catch (e) {}
  // size the word from its measured width so any name fits the canvas
  ctx.font = '800 100px Archivo'
  const per100 = ctx.measureText(word).width / 100
  const fontSize = Math.min(h * 0.62, (w * 0.9) / (per100 + (glyph ? 1.0 : 0)))
  ctx.font = `800 ${fontSize}px Archivo`
  const tw = ctx.measureText(word).width
  const gw = glyph ? fontSize * 0.78 : 0
  const gap = glyph ? fontSize * 0.22 : 0
  const total = tw + gw + gap
  const x0 = (w - total) / 2
  const base = h / 2 + fontSize * 0.36
  if (glyph) {
    // shuttle glyph: a skirt and a cork, cork down
    const gx = x0, gt = base - fontSize * 0.74, gb = base
    const mid = gx + gw / 2
    ctx.beginPath()
    ctx.moveTo(gx, gt)
    ctx.lineTo(gx + gw, gt)
    ctx.lineTo(mid + gw * 0.17, gb - fontSize * 0.26)
    ctx.lineTo(mid - gw * 0.17, gb - fontSize * 0.26)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(mid, gb - fontSize * 0.12, fontSize * 0.15, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillText(word, x0 + gw + gap, base)
}

export default function LiquidLogo({ className, word = 'ARROW', glyph = true, label = 'Arrow', running = true }) {
  const ref = useRef(null)
  const loseTimer = useRef(0)
  const runRef = useRef(running)
  runRef.current = running

  useEffect(() => {
    const canvas = ref.current
    // A cleanup that ran just before this (React Strict Mode remounts every
    // effect once in development) may have scheduled this canvas's context to
    // be discarded. Cancel that: a lost context cannot be used again, and Chrome
    // shows it as a white box with a sad-face icon.
    clearTimeout(loseTimer.current)
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: true })
    if (!gl || gl.isContextLost()) return
    let raf = 0
    let disposed = false
    const logo = document.createElement('canvas')
    const lctx = logo.getContext('2d')

    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aVertexPosition')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = (n) => gl.getUniformLocation(prog, n)
    const u = {
      res: U('u_resolution'), time: U('u_time'), speed: U('u_speed'), it: U('u_iterations'), scale: U('u_scale'),
      dot: U('u_dotFactor'), voff: U('u_vOffset'), inten: U('u_intensityFactor'), exp: U('u_expFactor'),
      col: U('u_colorFactors'), shift: U('u_colorShift'), dotm: U('u_dotMultiplier'), noise: U('u_noiseIntensity'),
      tex: U('u_logoTexture'), op: U('u_logoOpacity'), ls: U('u_logoScale'), ar: U('u_logoAspectRatio'),
      inter: U('u_logoInteractStrength'), blend: U('u_logoBlendMode'),
    }
    const texture = gl.createTexture()
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const resize = () => {
      if (disposed) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const r = canvas.getBoundingClientRect()
      const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr))
      if (canvas.width === w && canvas.height === h) return
      canvas.width = w
      canvas.height = h
      logo.width = w
      logo.height = h
      drawMark(lctx, w, h, { word, glyph })
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, logo)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.viewport(0, 0, w, h)
    }

    const p = PRESET
    const t0 = performance.now()
    const frame = (now) => {
      if (disposed) return
      raf = requestAnimationFrame(frame)
      if (!runRef.current && !flags.reduced) return
      resize()
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.time, flags.reduced ? 2.0 : (now - t0) / 1000)
      gl.uniform1f(u.speed, p.speed)
      gl.uniform1f(u.it, p.iterations)
      gl.uniform1f(u.scale, p.scale)
      gl.uniform1f(u.dot, p.dotFactor)
      gl.uniform1f(u.voff, p.vOffset)
      gl.uniform1f(u.inten, p.intensityFactor)
      gl.uniform1f(u.exp, p.expFactor)
      gl.uniform3f(u.col, p.color[0], p.color[1], p.color[2])
      gl.uniform1f(u.shift, p.colorShift)
      gl.uniform1f(u.dotm, p.dotMultiplier)
      gl.uniform1f(u.noise, p.noiseIntensity)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(u.tex, 0)
      gl.uniform1f(u.op, 1)
      gl.uniform1f(u.ls, 1)
      gl.uniform1f(u.ar, canvas.width / canvas.height)
      gl.uniform1f(u.inter, p.logoInteractStrength)
      gl.uniform1i(u.blend, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      if (flags.reduced) cancelAnimationFrame(raf) // one still frame
    }
    const start = () => {
      if (disposed) return // fonts finished loading after this effect was cleaned up
      resize()
      raf = requestAnimationFrame(frame)
    }
    ;(document.fonts ? document.fonts.load('800 100px Archivo') : Promise.resolve()).then(start, start)
    const ro = new ResizeObserver(() => {
      canvas.width = 0 // force a redraw of the mark at the new size
      resize()
    })
    ro.observe(canvas)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      gl.deleteTexture(texture)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      // Free the GPU context only once the canvas is really gone; if the effect
      // runs again on the same canvas, the timer above is cancelled first.
      loseTimer.current = setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext()
      }, 0)
    }
  }, [word, glyph])

  return <canvas ref={ref} className={className} role="img" aria-label={label} />
}
