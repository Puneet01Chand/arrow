import React, { useEffect, useRef } from 'react'
import { animate, svg, stagger } from 'animejs'
import Decode from '../ui/Decode.jsx'
import { useProgressVar, useSection, useSteps, useInView } from '../lib/hooks.js'
import { flightPath } from '../three/bridge.js'
import { onMeasure, flags } from '../lib/scroll.js'

// Court in side view, 1 unit = 1 cm: 13.4 m long, net 1.55 m at the posts.
// The path is a clear hit from the back line; the shuttle flies it as you scroll.
const FLOOR = 760
const PATH = 'M 60 520 C 420 -60, 960 -150, 1268 760'
const NOTES = [
  { at: 0.18, x: 200, y: 470, text: 'Turnover: the cork swings to the front' },
  { at: 0.48, x: 600, y: 250, text: 'The skirt drags hard at the top' },
  { at: 0.8, x: 1060, y: 330, text: 'A steep fall near the back line' },
]

export default function Flight() {
  const ref = useSection('flight')
  const stageRef = useProgressVar('flight')
  const pathRef = useRef(null)
  const svgRef = useRef(null)
  const n = useSteps('flight', NOTES.map((x) => x.at))
  const [courtRef, seen] = useInView({ threshold: 0.2 })

  // sample the path in stage pixels for the 3D shuttle
  useEffect(() => {
    const sample = () => {
      const path = pathRef.current, stage = stageRef.current
      if (!path || !stage) return
      const sr = stage.getBoundingClientRect()
      const ctm = path.getScreenCTM()
      if (!ctm) return
      const L = path.getTotalLength()
      const pts = []
      const N = 160
      for (let i = 0; i <= N; i++) {
        const p = path.getPointAtLength((i / N) * L)
        pts.push({ x: ctm.a * p.x + ctm.c * p.y + ctm.e - sr.left, y: ctm.b * p.x + ctm.d * p.y + ctm.f - sr.top })
      }
      flightPath.pts = pts
      flightPath.offsetY = 0
      flightPath.ready = true
    }
    sample()
    return onMeasure(sample)
  }, [])

  // court lines draw themselves the first time the court comes into view
  useEffect(() => {
    if (!seen || flags.reduced || !svgRef.current) return
    const lines = svgRef.current.querySelectorAll('.court-line')
    const drawables = svg.createDrawable(lines)
    animate(drawables, { draw: ['0 0', '0 1'], duration: 1100, delay: stagger(90), ease: 'inOutQuad' })
  }, [seen])

  return (
    <section id="flight" className="flight pin" ref={ref} aria-labelledby="flight-title">
      <div className="pin__stage" ref={stageRef}>
        <div className="wrap flight__head">
          <h2 id="flight-title" className="h2">
            How a shuttle flies
          </h2>
          <p className="lede">
            Just after the hit it travels feathers-first, then flips so the cork leads. The skirt drags hard, so a clear climbs long and falls almost straight down.
          </p>
        </div>
        <div className="flight__court" ref={courtRef}>
          <svg ref={svgRef} viewBox="0 0 1340 800" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Side view of a badminton court with the path of a clear from one back line to the other">
            <defs>
              <linearGradient id="trail" x1="0" x2="1">
                <stop offset="0" stopColor="#D9FF3F" stopOpacity="0.15" />
                <stop offset="1" stopColor="#D9FF3F" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <line className="court-line" x1="0" y1={FLOOR} x2="1340" y2={FLOOR} />
            <line className="court-line" x1="670" y1={FLOOR} x2="670" y2={FLOOR - 155} />
            <line className="court-line court-line--net" x1="670" y1={FLOOR - 155} x2="670" y2={FLOOR - 79} />
            <line className="court-line court-line--tick" x1="0" y1={FLOOR} x2="0" y2={FLOOR - 24} />
            <line className="court-line court-line--tick" x1="1340" y1={FLOOR} x2="1340" y2={FLOOR - 24} />
            <rect className="flight__zone" x={1340 - 99} y={FLOOR - 10} width={46} height={10} />
            <path className="flight__ghost" d={PATH} />
            <path ref={pathRef} className="flight__trail" d={PATH} pathLength="1" />
            <text className="flight__axis" x="0" y={FLOOR + 30}>
              Back line
            </text>
            <text className="flight__axis" x="670" y={FLOOR + 30} textAnchor="middle">
              Net, 1.55 m
            </text>
            <text className="flight__axis" x="1340" y={FLOOR + 30} textAnchor="end">
              Back line
            </text>
          </svg>
          {NOTES.map((note, i) => (
            <p key={i} className={`flight__note ${n > i ? 'is-on' : ''}`} style={{ '--nx': note.x / 1340, '--ny': note.y / 800 }}>
              <Decode text={note.text} active={n > i} duration={700} />
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
