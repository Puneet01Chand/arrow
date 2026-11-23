import React, { useCallback, useEffect, useRef } from 'react'
import Decode from '../ui/Decode.jsx'
import { useSection, useSteps } from '../lib/hooks.js'
import { craftMarks, craftStage } from '../three/bridge.js'
import { CRAFT_MARKS } from '../three/craftMarks.js'

// Pinned and sideways: four steps slide past on the left while the shuttle on
// the right turns to show the part each step works on. Technical callouts
// (points, dimension lines, a guide ring) are tied to the shuttle's projected
// position by the 3D stage; see three/craftMarks.js.
const STEPS = [
  {
    spec: 'SAME WING · 16 OF 16',
    title: 'Feathers sorted by wing',
    text: 'All 16 feathers in a shuttle come from the same wing, matched for curve and stiffness so the shuttle spins true.',
    marks: [
      { key: 'feathers', label: '16 feathers', side: 'left' },
      { key: 'featherLength', label: '62–70 mm' },
      { key: 'corkBase', label: 'Natural cork base' },
    ],
  },
  {
    spec: 'CORK Ø 25–28 MM',
    title: 'Cork shaped and capped',
    text: 'Each cork is turned to size, rounded at the base and covered with a thin leather cap.',
    marks: [
      { key: 'corkWidth', label: 'Ø 25–28 mm' },
      { key: 'cap', label: 'Leather cap', lead: 56 },
    ],
  },
  {
    spec: '2 THREAD ROWS',
    title: 'Feathers set and threaded',
    text: 'Feathers go into the cork, then two rows of thread and a line of glue lock the spacing.',
    marks: [
      { key: 'threads', label: '2 thread rows', side: 'left' },
      { key: 'tipCircle', label: 'Tips on Ø 58–68 mm' },
    ],
  },
  {
    spec: '4.74–5.50 G',
    title: 'Weighed and speed-sorted',
    text: 'Finished shuttles are weighed, grouped by speed and packed 12 to a tube.',
    marks: [
      { key: 'speed', label: 'Speed 77 · 12 a tube', side: 'left' },
      { key: 'weight', label: '4.74–5.50 g', side: 'left' },
    ],
  },
]
const AT = [0, 0.22, 0.5, 0.78]

function Mark({ id, mark, on }) {
  const ref = useRef(null)
  const def = CRAFT_MARKS[mark.key]
  useEffect(() => {
    craftMarks.set(id, { el: ref.current, def })
    return () => craftMarks.delete(id)
  }, [id, def])
  const cls = `cmark cmark--${def.kind} ${mark.side === 'left' ? 'cmark--left' : ''} ${on ? 'is-on' : ''}`
  return (
    <li ref={ref} className={cls} style={mark.lead ? { '--lead': mark.lead + 'px' } : undefined}>
      {def.kind === 'guide' && (
        <>
          <span className="cmark__ring" />
          <span className="cmark__cross" />
        </>
      )}
      {def.kind === 'point' && (
        <>
          <span className="cmark__dot" />
          <span className="cmark__lead" />
        </>
      )}
      {def.kind === 'dim' && <span className="cmark__rule" />}
      {mark.label && <span className="cmark__text">{mark.label}</span>}
    </li>
  )
}

export default function Craft() {
  const register = useSection('craft')
  const sectionRef = useCallback(
    (el) => {
      register(el)
      craftStage.section = el
    },
    [register]
  )
  const n = useSteps('craft', AT)
  // once the section unpins and scrolls away, the callouts fade out
  const pinned = useSteps('craft', [0.995]) === 0
  return (
    <section id="craft" className="craft pin" ref={sectionRef} aria-labelledby="craft-title">
      <div className="pin__stage" ref={(el) => (craftStage.el = el)}>
        <ol className="craft__marks" aria-hidden="true">
          <Mark id="guide" mark={{ key: 'guide' }} on={pinned && n > 0} />
          {STEPS.map((s, i) => s.marks.map((m) => <Mark key={`${i}-${m.key}`} id={`${i}-${m.key}`} mark={m} on={pinned && n === i + 1} />))}
        </ol>
        <div className="wrap craft__wrap">
          <div className="craft__col">
            <h2 id="craft-title" className="h2 craft__heading">
              How a tube is made
            </h2>
            <div className="craft__bars" aria-hidden="true">
              {STEPS.map((s, i) => (
                <span key={i} className={`${n > i ? 'is-on' : ''} ${n === i + 1 ? 'is-current' : ''}`} />
              ))}
            </div>
            <div className="craft__window">
              <ol className="craft__track" style={{ '--i': Math.max(0, n - 1) }}>
                {STEPS.map((s, i) => (
                  <li key={s.title} className={`craft__step ${n === i + 1 ? 'is-current' : ''}`}>
                    <Decode className="craft__spec mono" text={s.spec} active={n > i} duration={700} />
                    <h3 className="craft__title">{s.title}</h3>
                    <p className="craft__text">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
