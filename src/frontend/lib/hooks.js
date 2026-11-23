import { useCallback, useEffect, useRef, useState } from 'react'
import { onMeasure, progressOf, registerSection, unregisterSection } from './scroll.js'

export function useSection(id) {
  return useCallback(
    (el) => {
      if (el) registerSection(id, el)
      else unregisterSection(id)
    },
    [id]
  )
}

// How many of the given progress thresholds the visitor has scrolled past.
// Re-renders only when that count changes.
export function useSteps(id, thresholds) {
  const [n, setN] = useState(0)
  const key = thresholds.join(',')
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const p = progressOf(id)
        setN(thresholds.filter((t) => p >= t).length)
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    const off = onMeasure(on)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', on)
      off()
    }
  }, [id, key])
  return n
}

// Writes the section's progress to a CSS variable (--p) on an element.
export function useProgressVar(id, cb) {
  const ref = useRef(null)
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const p = progressOf(id)
        if (ref.current) ref.current.style.setProperty('--p', p.toFixed(4))
        cb && cb(p)
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    const off = onMeasure(on)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', on)
      off()
    }
  }, [id])
  return ref
}

export function useInView(options = { threshold: 0.35 }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true)
        io.disconnect()
      }
    }, options)
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return [ref, seen]
}
