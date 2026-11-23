import React, { useState } from 'react'
import { Mark } from '../ui/Nav.jsx'
import { scrollToId } from '../lib/scroll.js'
import { api } from '../services/api.js'

const COLS = [
  ['Shop', [['shop', 'Arrow Tournament'], ['shop', 'Arrow Club'], ['shop', 'Arrow Training']]],
  ['Guides', [['anatomy', 'Parts of a shuttle'], ['flight', 'How a shuttle flies'], ['speed', 'Speed guide'], ['craft', 'How a tube is made']]],
  ['Clubs', [['clubs', 'Bulk prices'], ['clubs', 'Club price request']]],
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState('')
  const [err, setErr] = useState('')
  const [pending, setPending] = useState(false)
  const go = (id) => (e) => {
    e.preventDefault()
    scrollToId(id)
  }
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <a href="#top" className="nav__logo" onClick={go('top')} aria-label="Arrow, back to top">
            <Mark size={30} />
            <span className="nav__word">ARROW</span>
          </a>
          <p className="footer__about">Feather and nylon badminton shuttlecocks, by the tube and by the box.</p>
          <p className="footer__contact">
            Write to <a className="link" href="mailto:hello@arrow.example">hello@arrow.example</a>
          </p>
        </div>
        {COLS.map(([title, links]) => (
          <nav key={title} className="footer__col" aria-label={title}>
            <h3>{title}</h3>
            <ul>
              {links.map(([id, label]) => (
                <li key={label}>
                  <a className="link" href={'#' + id} onClick={go(id)}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <form
          className="footer__news"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault()
            if (pending) return
            if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Write an email address, like you@club.in.')
            setErr('')
            setPending(true)
            const res = await api.subscribe(email)
            setPending(false)
            if (!res.ok) return setErr(res.fields.email ?? res.message)
            setDone(res.data.email)
          }}
        >
          <h3>Restock emails</h3>
          {done ? (
            <p className="footer__done" role="status">
              {done} is on the list for restocks and new speeds.
            </p>
          ) : (
            <>
              <label htmlFor="news-email">Email</label>
              <div className="footer__row">
                <input id="news-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} aria-describedby={err ? 'news-err' : undefined} />
                <button type="submit" className="btn btn--primary btn--sm" disabled={pending} aria-busy={pending}>
                  {pending ? 'Adding…' : 'Subscribe'}
                </button>
              </div>
              {err && (
                <p className="field__error" id="news-err">
                  {err}
                </p>
              )}
            </>
          )}
        </form>
      </div>
      <div className="wrap footer__base">
        <p>© 2026 Arrow</p>
        <p>Feather and nylon shuttlecocks, by the tube</p>
      </div>
    </footer>
  )
}
