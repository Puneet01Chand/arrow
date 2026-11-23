import React, { useEffect, useRef } from 'react'
import Decode from '../ui/Decode.jsx'
import { useSection, useSteps } from '../lib/hooks.js'
import { anatomyLabels } from '../three/bridge.js'

// Pinned: the shuttle comes apart while the visitor scrolls, and each part's
// label decodes beside it, tied to the part's projected screen position.
const PARTS = [
  { key: 'feathers', title: 'Feathers × 16', text: '62 to 70 mm long, tips on a 58 to 68 mm circle.', side: 'right' },
  { key: 'threads', title: 'Thread bands', text: 'Two rows of thread hold every feather at the same angle.', side: 'left' },
  { key: 'cork', title: 'Cork base', text: 'Natural cork, 25 to 28 mm across, rounded at the bottom.', side: 'right' },
  { key: 'cap', title: 'Leather cap', text: 'A thin layer of leather takes the strike of the strings.', side: 'left' },
  { key: 'weight', title: 'Weight', text: '4.74 to 5.50 g in all, the range the Laws of Badminton allow.', side: 'right' },
]
const AT = [0.28, 0.36, 0.44, 0.52, 0.6]

function Label({ part, index, on }) {
  const ref = useRef(null)
  useEffect(() => {
    anatomyLabels.set(part.key, ref.current)
    return () => anatomyLabels.delete(part.key)
  }, [part.key])
  return (
    <li ref={ref} className={`part part--${part.side} ${on ? 'is-on' : ''}`}>
      <span className="part__dot" aria-hidden="true">
        {index + 1}
      </span>
      <span className="part__line" aria-hidden="true" />
      <span className="part__box">
        <Decode as="strong" className="part__title" text={part.title} active={on} duration={650} />
        <span className="part__text">{part.text}</span>
      </span>
    </li>
  )
}

export default function Anatomy() {
  const ref = useSection('anatomy')
  const n = useSteps('anatomy', AT)
  return (
    <section id="anatomy" className="anatomy pin" ref={ref} aria-labelledby="anatomy-title">
      <div className="pin__stage">
        <div className="wrap anatomy__head">
          <h2 id="anatomy-title" className="h2">
            Parts of an Arrow shuttle
          </h2>
          <p className="lede">Five parts, each inside the limits the Laws of Badminton set for a feathered shuttle.</p>
        </div>
        <ol className="anatomy__parts">
          {PARTS.map((p, i) => (
            <Label key={p.key} part={p} index={i} on={n > i} />
          ))}
        </ol>
        <ol className="anatomy__legend wrap" aria-hidden="true">
          {PARTS.map((p, i) => (
            <li key={p.key} className={n > i ? 'is-on' : ''}>
              <span>{i + 1}</span>
              {p.title}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
