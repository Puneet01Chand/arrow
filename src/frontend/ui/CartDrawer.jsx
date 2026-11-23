import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCart } from '../lib/cart.jsx'
import { rupees } from '@/shared/catalogue.js'
import AddToCart from './AddToCart.jsx'
import Glass from '../fx/Glass.jsx'
import { api, fieldsUnder } from '../services/api.js'

// A modal <dialog> drawer: top-layer entry and exit animated in CSS with
// @starting-style and transition-behavior: allow-discrete; the page under it
// does not scroll (overscroll-behavior: contain on the dialog and backdrop).
export default function CartDrawer() {
  const cart = useCart()
  const [step, setStep] = useState('cart')
  const [form, setForm] = useState({ name: '', email: '', city: '' })
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)
  const [serverError, setServerError] = useState('')
  const sent = useRef(null)

  useEffect(() => {
    const d = cart.dialog.current
    if (!d) return
    const onClose = () => {
      if (step === 'done') {
        cart.dispatch({ type: 'clear' })
        setStep('cart')
      }
    }
    d.addEventListener('close', onClose)
    return () => d.removeEventListener('close', onClose)
  }, [step, cart])

  const lightDismiss = (e) => {
    if (e.target === e.currentTarget) cart.close()
  }

  const submit = async (e) => {
    e.preventDefault()
    if (pending) return
    const err = {}
    if (!form.name.trim()) err.name = 'Write the name for the order.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Write an email address, like you@club.in.'
    if (!form.city.trim()) err.city = 'Write the city the tubes go to.'
    setErrors(err)
    setServerError('')
    if (Object.keys(err).length) return

    // The server prices the order from the catalogue and returns the totals it stored.
    setPending(true)
    const res = await api.createOrder({ customer: form, lines: cart.lines })
    setPending(false)
    if (!res.ok) {
      setErrors(fieldsUnder('customer', res.fields))
      setServerError(res.message)
      return
    }
    sent.current = { ...form, ...res.data }
    setStep('done')
  }

  return (
    <dialog ref={cart.dialog} className="cart" aria-labelledby="cart-title" onClick={lightDismiss}>
      <Glass className="cart__panel" radius={28} bend={56}>
        <div className="cart__head">
          <h2 id="cart-title" className="cart__title">
            {step === 'cart' ? 'Your cart' : step === 'details' ? 'Order details' : 'Order request sent'}
          </h2>
          <button type="button" className="icon-btn" onClick={cart.close} aria-label="Close cart">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {step === 'cart' && (
          <>
            {cart.lines.length === 0 ? (
              <p className="cart__empty">No tubes yet. Pick a line and a speed in the shop and they show up here.</p>
            ) : (
              <ul className="cart__lines">
                <AnimatePresence initial={false}>
                  {cart.lines.map((l) => (
                    <motion.li
                      key={l.key}
                      layout
                      className="cart__line"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                    >
                      <div>
                        <p className="cart__name">{l.name}</p>
                        <p className="cart__meta">
                          {l.optionLabel} {l.option}
                          {l.colour ? `, ${l.colour.toLowerCase()} skirt` : ''} · {l.pack}
                        </p>
                      </div>
                      <AddToCart quantity={l.qty} name={l.name} onQuantityChange={(q) => cart.setQty(l.productId, l.option, l.colour, q)} />
                      <p className="cart__price" data-assumed>
                        {rupees(l.price * l.qty)}
                      </p>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            <div className="cart__foot">
              <p className="cart__total">
                <span>Subtotal</span>
                <strong data-assumed>{rupees(cart.total)}</strong>
              </p>
              <button type="button" className="btn btn--primary btn--block" disabled={!cart.count} onClick={() => setStep('details')}>
                Review order
              </button>
            </div>
          </>
        )}

        {step === 'details' && (
          <form className="cart__form" onSubmit={submit} noValidate>
            <ul className="cart__summary">
              {cart.lines.map((l) => (
                <li key={l.key}>
                  <span>
                    {l.qty} × {l.name}, {l.optionLabel.toLowerCase()} {l.option}
                  </span>
                  <span data-assumed>{rupees(l.qty * l.price)}</span>
                </li>
              ))}
              <li className="cart__summary-total">
                <span>Total</span>
                <span data-assumed>{rupees(cart.total)}</span>
              </li>
            </ul>
            {[
              ['name', 'Name', 'text', 'name'],
              ['email', 'Email', 'email', 'email'],
              ['city', 'City', 'text', 'address-level2'],
            ].map(([k, label, type, ac]) => (
              <div className={`field ${errors[k] ? 'has-error' : ''}`} key={k}>
                <label htmlFor={'o-' + k}>{label}</label>
                <input
                  id={'o-' + k}
                  type={type}
                  autoComplete={ac}
                  value={form[k]}
                  aria-invalid={!!errors[k]}
                  aria-describedby={errors[k] ? 'o-' + k + '-err' : undefined}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
                {errors[k] && (
                  <p className="field__error" id={'o-' + k + '-err'}>
                    {errors[k]}
                  </p>
                )}
              </div>
            ))}
            <div className="cart__foot">
              {serverError && (
                <p className="field__error" role="alert">
                  {serverError}
                </p>
              )}
              <button type="submit" className="btn btn--primary btn--block" disabled={pending} aria-busy={pending}>
                {pending ? 'Sending…' : 'Send order request'}
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => setStep('cart')}>
                Back to cart
              </button>
            </div>
          </form>
        )}

        {step === 'done' && sent.current && (
          <div className="cart__done">
            <p className="cart__done-line">
              Thanks, {sent.current.name.split(' ')[0]}. Your request for {sent.current.count} {sent.current.count === 1 ? 'tube' : 'tubes'} ({rupees(sent.current.total)}) to {sent.current.city} is in.
            </p>
            <p className="cart__note">
              Order number {sent.current.id}. The shop takes no payment online yet: the request is saved for Arrow to confirm with you at {sent.current.email}.
            </p>
            <button type="button" className="btn btn--ghost btn--block" onClick={cart.close}>
              Close cart
            </button>
          </div>
        )}
      </Glass>
    </dialog>
  )
}
