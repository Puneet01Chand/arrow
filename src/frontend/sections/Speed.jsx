import React, { useEffect, useMemo, useRef, useState } from 'react'
import { animate, svg } from 'animejs'
import Glass from '../fx/Glass.jsx'
import { RollingText } from '../ui/AddToCart.jsx'
import { useSection } from '../lib/hooks.js'
import { speedFor, SPEED_WORDS } from '@/shared/catalogue.js'
import { useCart } from '../lib/cart.jsx'
import { scrollToId, flags } from '../lib/scroll.js'

// Hall temperature and altitude in, a speed number out. The little court
// redraws the test clear each time it changes, landing in the test zone.
const ARC = 'M 8 92 C 80 -20, 190 -26, 236 98'

export default function Speed() {
  const ref = useSection('speed')
  const cart = useCart()
  const [temp, setTemp] = useState(26)
  const [high, setHigh] = useState(false)
  const speed = speedFor(temp, high)
  const dir = useRef(1)
  const prev = useRef(speed)
  if (prev.current !== speed) {
    dir.current = speed > prev.current ? 1 : -1
    prev.current = speed
  }
  const arcRef = useRef(null)
  useEffect(() => {
    if (!arcRef.current || flags.reduced) return
    const [d] = svg.createDrawable(arcRef.current)
    animate(d, { draw: ['0 0', '0 1'], duration: 700, ease: 'outCubic' })
  }, [speed])

  const buy = (e) => {
    e.preventDefault()
    cart.dispatch({ type: 'speed', speed: String(Math.min(78, Math.max(76, speed))) })
    scrollToId('shop')
  }
  const stocked = speed >= 76 && speed <= 78

  return (
    <section id="speed" className="speed" ref={ref} aria-labelledby="speed-title">
      <div className="wrap speed__grid">
        <div className="speed__room" aria-hidden="true" />
        <Glass className="speed__panel" radius={32} bend={60}>
          <h2 id="speed-title" className="h2 h2--sm">
            Speed guide for your hall
          </h2>
          <p className="lede">Warm, thin air lets a shuttle fly further, so hot halls and hill towns need a slower number. Set your hall and the guide picks the speed.</p>

          <div className="speed__controls">
            <div className="range">
              <div className="range__top">
                <label htmlFor="temp">Hall temperature</label>
                <output htmlFor="temp" className="range__val">
                  {temp} °C
                </output>
              </div>
              <input id="temp" type="range" min="8" max="40" step="1" value={temp} onChange={(e) => setTemp(+e.target.value)} style={{ '--fill': ((temp - 8) / 32) * 100 + '%' }} />
              <div className="range__ends" aria-hidden="true">
                <span>8 °C</span>
                <span>40 °C</span>
              </div>
            </div>
            <fieldset className="seg">
              <legend>Altitude</legend>
              <label className={!high ? 'is-on' : ''}>
                <input type="radio" name="alt" checked={!high} onChange={() => setHigh(false)} />
                Below 1,000 m
              </label>
              <label className={high ? 'is-on' : ''}>
                <input type="radio" name="alt" checked={high} onChange={() => setHigh(true)} />
                Above 1,000 m
              </label>
            </fieldset>
          </div>

          <div className="speed__result" aria-live="polite">
            <div>
              <span className="mono speed__k">Your speed</span>
              <strong className="speed__num">
                <RollingText text={String(speed)} direction={dir.current} reduceMotion={flags.reduced} />
              </strong>
              <span className="speed__word">{SPEED_WORDS[speed]}</span>
            </div>
            <svg className="speed__court" viewBox="0 0 280 110" aria-hidden="true">
              <line x1="0" y1="100" x2="280" y2="100" className="speed__floor" />
              <line x1="140" y1="100" x2="140" y2="78" className="speed__net" />
              <rect x="230" y="96" width="12" height="4" className="speed__zone" />
              <path ref={arcRef} key={speed} d={ARC} className="speed__arc" />
            </svg>
          </div>

          <p className="speed__test">
            Check it on court: hit a full underhand from your back line. A shuttle of the right speed lands 530 to 990 mm short of the far back line.
          </p>
          {stocked ? (
            <a href="#shop" className="btn btn--primary" onClick={buy}>
              Buy speed {speed} shuttles
            </a>
          ) : (
            <p className="speed__stock">Arrow stocks speeds 76 to 78. For speed {speed}, write to hello@arrow.example.</p>
          )}
        </Glass>
      </div>
    </section>
  )
}
