import React from 'react'
import { motion } from 'motion/react'
import HeroGradient from '../fx/HeroGradient.jsx'
import Lattice from '../fx/Lattice.jsx'
import Glass from '../fx/Glass.jsx'
import Decode from '../ui/Decode.jsx'
import { useSection } from '../lib/hooks.js'
import { scrollToId, flags } from '../lib/scroll.js'

const LINES = ['Feather', 'shuttlecocks', 'for club and', 'tournament play']
const CHIPS = [
  ['16', 'goose feathers'],
  ['25–28 mm', 'natural cork base'],
  ['76 · 77 · 78', 'speeds in stock'],
]

export default function Hero({ lifted }) {
  const ref = useSection('hero')
  const ease = [0.22, 1, 0.36, 1]
  const d = flags.reduced ? 0 : 1
  const go = (id) => (e) => {
    e.preventDefault()
    scrollToId(id)
  }
  return (
    <section id="top" className="hero" ref={ref} data-enter aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <HeroGradient className="hero__gradient" />
        <Lattice className="hero__lattice" />
        <div className="hero__court" />
        <div className="hero__fade" />
      </div>
      <div className="wrap hero__wrap">
        <div className="hero__copy">
          <p className="eyebrow">
            <Decode text="ARROW · FEATHER SHUTTLECOCKS" active={lifted} delay={300} duration={900} />
          </p>
          <h1 id="hero-title" className="hero__title">
            {LINES.map((l, i) => (
              <span className="line" key={l}>
                <motion.span
                  className="line__in"
                  initial={{ y: '108%' }}
                  animate={lifted ? { y: '0%' } : { y: '108%' }}
                  transition={{ duration: 0.9 * d, delay: (0.35 + i * 0.09) * d, ease }}
                >
                  {l}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div
            className="hero__rest"
            initial={{ opacity: 0, y: 18 }}
            animate={lifted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 * d, delay: 0.75 * d, ease }}
          >
            <p className="hero__sub">
              Sixteen goose feathers set in natural cork and capped in leather, weighed and sorted by speed, then packed in tubes of 12 for clubs, coaches and match nights.
            </p>
            <div className="hero__actions">
              <a href="#shop" className="btn btn--primary" onClick={go('shop')}>
                Buy shuttles
              </a>
              <a href="#speed" className="btn btn--ghost" onClick={go('speed')}>
                Find your speed
              </a>
            </div>
            <p className="hero__fact">
              Feather tubes from <strong data-assumed>₹1,449</strong>
            </p>
          </motion.div>
        </div>
        <ul className="hero__chips" aria-label="Shuttle facts">
          {CHIPS.map(([a, b], i) => (
            <motion.li
              key={a}
              initial={{ opacity: 0, y: 14 }}
              animate={lifted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 * d, delay: (1.1 + i * 0.12) * d, ease }}
            >
              <Glass className="chip" radius={18} bend={28}>
                <Decode className="chip__num" text={a} active={lifted} delay={1300 + i * 160} duration={700} />
                <span className="chip__label">{b}</span>
              </Glass>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
