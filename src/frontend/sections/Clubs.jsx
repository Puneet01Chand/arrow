import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Glass from '../fx/Glass.jsx'
import { CLUB_TIERS, rupees } from '@/shared/catalogue.js'
import { useSection, useInView } from '../lib/hooks.js'
import { flags } from '../lib/scroll.js'
import { api } from '../services/api.js'

export default function Clubs() {
  const ref = useSection('clubs')
  const [listRef, seen] = useInView({ threshold: 0.3 })
  const [form, setForm] = useState({ club: '', city: '', tubes: '25', email: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(null)
  const [pending, setPending] = useState(false)
  const [serverError, setServerError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    if (pending) return
    const err = {}
    if (!form.club.trim()) err.club = 'Write the name of your club or academy.'
    if (!form.city.trim()) err.city = 'Write the city you play in.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Write an email address, like coach@club.in.'
    setErrors(err)
    setServerError('')
    if (Object.keys(err).length) return
    setPending(true)
    const res = await api.createClubEnquiry(form)
    setPending(false)
    if (!res.ok) {
      setErrors(res.fields)
      setServerError(res.message)
      return
    }
    setSent({ ...form, id: res.data.id })
  }
  const field = (k, label, type = 'text', ac) => (
    <div className={`field ${errors[k] ? 'has-error' : ''}`}>
      <label htmlFor={'c-' + k}>{label}</label>
      <input id={'c-' + k} type={type} value={form[k]} onChange={set(k)} autoComplete={ac} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? 'c-' + k + '-err' : undefined} />
      {errors[k] && (
        <p className="field__error" id={'c-' + k + '-err'}>
          {errors[k]}
        </p>
      )}
    </div>
  )
  return (
    <section id="clubs" className="clubs" ref={ref} aria-labelledby="clubs-title">
      <div className="wrap clubs__grid">
        <div className="clubs__copy">
          <h2 id="clubs-title" className="h2">
            Bulk prices for clubs and academies
          </h2>
          <p className="lede">Arrow Club shuttles by the box. The price per tube drops as the order grows.</p>
          <ul className="tiers" ref={listRef}>
            {CLUB_TIERS.map((t, i) => (
              <motion.li
                key={t.tubes}
                initial={{ opacity: 0, x: -16 }}
                animate={seen ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: flags.reduced ? 0 : 0.6, delay: flags.reduced ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="tiers__qty">{t.tubes}</span>
                <span className="tiers__rule" aria-hidden="true" />
                <span className="tiers__price">
                  <strong data-assumed>{rupees(t.price)}</strong> a tube
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
        <Glass className="clubs__panel" radius={30} bend={54}>
          <AnimatePresence mode="wait" initial={false}>
            {!sent ? (
              <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="clubs__form-title">Club price request</h3>
                {field('club', 'Club or academy', 'text', 'organization')}
                {field('city', 'City', 'text', 'address-level2')}
                <div className="field">
                  <label htmlFor="c-tubes">Tubes a month</label>
                  <select id="c-tubes" value={form.tubes} onChange={set('tubes')}>
                    <option value="10">About 10</option>
                    <option value="25">About 25</option>
                    <option value="50">About 50</option>
                    <option value="100">100 or more</option>
                  </select>
                </div>
                {field('email', 'Email', 'email', 'email')}
                {serverError && (
                  <p className="field__error" role="alert">
                    {serverError}
                  </p>
                )}
                <button type="submit" className="btn btn--primary btn--block" disabled={pending} aria-busy={pending}>
                  {pending ? 'Sending…' : 'Request club prices'}
                </button>
              </motion.form>
            ) : (
              <motion.div key="sent" className="clubs__sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="clubs__form-title">Request sent for {sent.club}</h3>
                <p>
                  About {sent.tubes} tubes a month to {sent.city}. Arrow has the request, and the quote comes back to {sent.email}.
                </p>
                <button type="button" className="btn btn--ghost" onClick={() => setSent(null)}>
                  Send another request
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Glass>
      </div>
    </section>
  )
}
