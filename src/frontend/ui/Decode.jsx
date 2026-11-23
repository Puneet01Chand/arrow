import React, { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { flags } from '../lib/scroll.js'

// Text that resolves out of static. anime.js drives the reveal wave; every
// unresolved character is redrawn from a block/numeric set each tick.
const NOISE = '█▓▒░#%&@01<>/=+*'

export function decode(el, text, { duration = 900, delay = 0 } = {}) {
  if (!el) return null
  if (flags.reduced) {
    el.textContent = text
    return null
  }
  const state = { p: 0 }
  const len = text.length
  el.textContent = ''
  return animate(state, {
    p: 1,
    duration,
    delay,
    ease: 'outQuad',
    onUpdate: () => {
      const revealed = Math.floor(state.p * len)
      let out = text.slice(0, revealed)
      const tail = Math.min(len - revealed, 6)
      for (let i = 0; i < tail; i++) {
        const c = text[revealed + i]
        out += c === ' ' ? ' ' : NOISE[(Math.random() * NOISE.length) | 0]
      }
      el.textContent = out
    },
    onComplete: () => {
      el.textContent = text
    },
  })
}

// Decodes once when `active` turns true. The plain text is always in the DOM
// for screen readers; the animated copy is hidden from them.
export default function Decode({ text, active = true, delay = 0, duration = 900, as: Tag = 'span', className = '' }) {
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    if (!active || done.current) return
    done.current = true
    const a = decode(ref.current, text, { delay, duration })
    return () => a && a.pause && a.pause()
  }, [active, text, delay, duration])
  return (
    <Tag className={`decode ${active ? 'is-on' : ''} ${className}`}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true" className="decode__vis">
        {text}
      </span>
    </Tag>
  )
}
