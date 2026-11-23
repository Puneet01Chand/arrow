import React, { useEffect, useState } from 'react'
import Glass from '../fx/Glass.jsx'
import { useCart } from '../lib/cart.jsx'
import { RollingText } from './AddToCart.jsx'
import { scrollToId } from '../lib/scroll.js'

export function Mark({ size = 26 }) {
  return (
    <svg className="mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M6 4h20l-6.2 15.5h-7.6z" fill="currentColor" />
      <path d="M9.4 9.2h13.2M11 13.6h10" stroke="#070908" strokeWidth="1.4" />
      <circle cx="16" cy="24.4" r="4.6" fill="#D9FF3F" />
    </svg>
  )
}

const LINKS = [
  ['shop', 'Shuttles'],
  ['anatomy', 'Anatomy'],
  ['speed', 'Speed guide'],
  ['clubs', 'Clubs'],
]

export default function Nav() {
  const cart = useCart()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const go = (id) => (e) => {
    e.preventDefault()
    setMenu(false)
    scrollToId(id)
  }
  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <Glass className="nav__bar" radius={999} bend={38}>
        <a className="nav__logo" href="#top" onClick={go('top')} aria-label="Arrow, back to top">
          <Mark />
          <span className="nav__word">ARROW</span>
        </a>
        <nav className="nav__links" aria-label="Main">
          {LINKS.map(([id, label]) => (
            <a key={id} href={'#' + id} onClick={go(id)} className="link">
              {label}
            </a>
          ))}
        </nav>
        <div className="nav__actions">
          <button ref={cart.cartButton} type="button" className="nav__cart" onClick={cart.open} aria-label={`Cart, ${cart.count} ${cart.count === 1 ? 'tube' : 'tubes'}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            <span className={`nav__count ${cart.count ? 'is-on' : ''}`} aria-hidden="true">
              <RollingText text={String(cart.count)} direction={1} reduceMotion={false} />
            </span>
          </button>
          <a className="btn btn--primary btn--sm nav__buy" href="#shop" onClick={go('shop')}>
            Buy shuttles
          </a>
          <button type="button" className="nav__menu" aria-expanded={menu} aria-controls="nav-sheet" onClick={() => setMenu((m) => !m)}>
            <span className="sr-only">{menu ? 'Close menu' : 'Open menu'}</span>
            <span className="nav__burger" aria-hidden="true" />
          </button>
        </div>
        <span className="nav__progress" aria-hidden="true" />
      </Glass>
      <div id="nav-sheet" className={`nav__sheet ${menu ? 'is-open' : ''}`} hidden={!menu}>
        <Glass className="nav__sheet-in" radius={28}>
          {LINKS.map(([id, label]) => (
            <a key={id} href={'#' + id} onClick={go(id)}>
              {label}
            </a>
          ))}
          <a className="btn btn--primary" href="#shop" onClick={go('shop')}>
            Buy shuttles
          </a>
        </Glass>
      </div>
    </header>
  )
}
