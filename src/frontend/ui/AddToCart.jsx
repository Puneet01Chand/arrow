/**
 * Ported from Kokonut UI's Cart Button (MIT, @dorianbaffier, kokonutui.com):
 * "Add +" opens into a "− n +" stepper in place. The + never moves, so a
 * second tap lands where the first did. At one, − turns into a bin; holding
 * + or − repeats, and a hold on − stops at one. Tailwind classes swapped for
 * this site's CSS; lucide icons drawn inline.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MAX_QTY_PER_LINE } from '@/shared/catalogue.js'

const EASE_OUT = [0.23, 1, 0.32, 1]
const HOLD_DELAY = 380
const REPEAT_FIRST = 150
const REPEAT_FASTEST = 55
const LIMIT_FOR = 1600

const Plus = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const Minus = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const Bin = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </svg>
)

export default function AddToCart({ quantity, max = MAX_QTY_PER_LINE, name = 'item', label = 'Add', onQuantityChange, onAdd, wide = false }) {
  const value = quantity
  const [direction, setDirection] = useState(1)
  const [limitHits, setLimitHits] = useState(0)
  const [showLimit, setShowLimit] = useState(false)
  const reduceMotion = Boolean(useReducedMotion())
  const valueRef = useRef(value)
  valueRef.current = value
  const holdRef = useRef()
  const touchRef = useRef(null)
  const limitRef = useRef()
  const addRef = useRef(null)
  const plusRef = useRef(null)
  const focusNext = useRef(null)
  const open = value > 0
  const W_CLOSED = wide ? 132 : 92
  const W_OPEN = wide ? 140 : 116

  const commit = useCallback(
    (next) => {
      const clamped = Math.min(max, Math.max(0, next))
      if (clamped === valueRef.current) return
      setDirection(clamped > valueRef.current ? 1 : -1)
      valueRef.current = clamped
      onQuantityChange?.(clamped)
    },
    [max, onQuantityChange]
  )
  const hitLimit = useCallback(() => {
    setLimitHits((h) => h + 1)
    setShowLimit(true)
    clearTimeout(limitRef.current)
    limitRef.current = setTimeout(() => setShowLimit(false), LIMIT_FOR)
  }, [])
  const step = useCallback(
    (delta) => {
      if (delta > 0 && valueRef.current >= max) {
        hitLimit()
        return false
      }
      if (delta < 0 && valueRef.current === 1) focusNext.current = 'add'
      commit(valueRef.current + delta)
      return true
    },
    [commit, hitLimit, max]
  )
  const stopHold = useCallback(() => {
    clearTimeout(holdRef.current)
    touchRef.current = null
  }, [])
  const endPress = () => {
    const delta = touchRef.current
    stopHold()
    if (delta !== null) step(delta)
  }
  const startHold = (delta) => (event) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    stopHold()
    let interval = REPEAT_FIRST
    const tick = () => {
      if (delta < 0 && valueRef.current <= 1) return
      if (!step(delta)) return
      interval = Math.max(REPEAT_FASTEST, interval * 0.82)
      holdRef.current = setTimeout(tick, interval)
    }
    if (event.pointerType === 'touch') {
      touchRef.current = delta
      holdRef.current = setTimeout(() => {
        touchRef.current = null
        if (step(delta)) holdRef.current = setTimeout(tick, REPEAT_FIRST)
      }, HOLD_DELAY)
      return
    }
    if (!step(delta)) return
    holdRef.current = setTimeout(tick, HOLD_DELAY)
  }
  const keyStep = (delta) => (event) => {
    if (event.detail === 0) step(delta)
  }
  const add = (e) => {
    focusNext.current = 'plus'
    setDirection(1)
    commit(1)
    onAdd?.(e.currentTarget)
  }
  useEffect(() => {
    if (focusNext.current === 'plus' && value > 0) plusRef.current?.focus()
    if (focusNext.current === 'add' && value === 0) requestAnimationFrame(() => addRef.current?.focus())
    focusNext.current = null
    if (value === 0) clearTimeout(holdRef.current)
  }, [value])
  useEffect(() => () => (clearTimeout(holdRef.current), clearTimeout(limitRef.current)), [])

  const atMax = value >= max
  const fade = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }

  return (
    <div className="atc">
      <AnimatePresence>
        {showLimit && (
          <motion.span className="atc__limit" role="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 2 }} transition={fade}>
            Limit {max} per order
          </motion.span>
        )}
      </AnimatePresence>
      <motion.div className={`atc__pill ${open ? 'is-open' : ''}`} animate={{ width: open ? W_OPEN : W_CLOSED }} initial={false} transition={{ ...fade, duration: reduceMotion ? 0 : 0.32 }}>
        <AnimatePresence initial={false}>
          {!open && (
            <motion.span
              key="label"
              aria-hidden
              className="atc__label"
              initial={{ opacity: 0, x: -6, filter: 'blur(2px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -6, filter: 'blur(2px)' }}
              transition={fade}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {open ? (
          <fieldset className="atc__set">
            <legend className="sr-only">{`Quantity of ${name}`}</legend>
            <motion.button
              type="button"
              className="atc__btn atc__btn--minus"
              aria-label={value === 1 ? `Remove ${name}` : `One less ${name}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={fade}
              onClick={keyStep(-1)}
              onLostPointerCapture={stopHold}
              onPointerCancel={stopHold}
              onPointerDown={startHold(-1)}
              onPointerUp={endPress}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={value === 1 ? 'bin' : 'minus'}
                  className="atc__glyph"
                  initial={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
                >
                  {value === 1 ? <Bin /> : <Minus />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <motion.output className="atc__value" aria-live="polite" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={fade}>
              <span className="sr-only">{`${value} ${name} in cart`}</span>
              <motion.span
                aria-hidden
                className="atc__roll"
                key={limitHits}
                animate={limitHits > 0 && !reduceMotion ? { x: [0, -3, 3, -2, 2, 0] } : undefined}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <RollingText text={String(value)} direction={direction} reduceMotion={reduceMotion} />
              </motion.span>
            </motion.output>
            <button
              ref={plusRef}
              type="button"
              className={`atc__btn atc__btn--plus ${atMax ? 'is-max' : ''}`}
              aria-disabled={atMax}
              aria-label={`One more ${name}`}
              onClick={keyStep(1)}
              onLostPointerCapture={stopHold}
              onPointerCancel={stopHold}
              onPointerDown={startHold(1)}
              onPointerUp={endPress}
            >
              <Plus />
            </button>
          </fieldset>
        ) : (
          <button ref={addRef} type="button" className="atc__add" aria-label={`${label} ${name} to cart`} onClick={add}>
            <span className="atc__plus">
              <Plus />
            </span>
          </button>
        )}
      </motion.div>
    </div>
  )
}

export function RollingText({ text, direction, reduceMotion }) {
  const places = text.split('').map((char, i) => ({ char, place: text.length - i }))
  return (
    <span className="roll">
      {places.map(({ char, place }) => (
        <span className="roll__cell" key={place}>
          <AnimatePresence custom={direction} initial={false} mode="popLayout">
            <motion.span
              key={char}
              className="roll__char"
              custom={direction}
              initial={reduceMotion ? { opacity: 0 } : 'in'}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : 'out'}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: EASE_OUT }}
              variants={{ in: (d) => ({ y: d * 12, opacity: 0 }), out: (d) => ({ y: d * -12, opacity: 0 }) }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}
