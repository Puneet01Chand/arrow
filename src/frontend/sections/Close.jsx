import React, { useEffect, useRef, useState } from 'react'
import LiquidLogo from '../fx/LiquidLogo.jsx'
import HeroGradient from '../fx/HeroGradient.jsx'
import { useSection } from '../lib/hooks.js'
import { scrollToId } from '../lib/scroll.js'

export default function Close() {
  const ref = useSection('close')
  const box = useRef(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '300px 0px' })
    io.observe(box.current)
    return () => io.disconnect()
  }, [])
  return (
    <section id="close" className="close" ref={ref} aria-labelledby="close-title">
      <div className="close__bg" aria-hidden="true">
        <HeroGradient className="hero__gradient" tone="close" />
        <div className="hero__fade hero__fade--both" />
      </div>
      <div className="wrap close__wrap" ref={box}>
        <h2 id="close-title" className="sr-only">
          Arrow shuttlecocks
        </h2>
        <div className="close__mark">{near && <LiquidLogo className="close__logo" glyph={false} label="Arrow" />}</div>
        <p className="close__line">Feather and nylon shuttlecocks, sold by the tube.</p>
        <a
          href="#shop"
          className="btn btn--primary"
          onClick={(e) => {
            e.preventDefault()
            scrollToId('shop')
          }}
        >
          Buy shuttles
        </a>
      </div>
    </section>
  )
}
