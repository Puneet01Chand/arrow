import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { PRODUCTS, rupees } from '@/shared/catalogue.js'
import { useCart } from '../lib/cart.jsx'
import { useSection, useInView } from '../lib/hooks.js'
import { ProductView } from '../three/Scene.jsx'
import { productHover } from '../three/bridge.js'
import AddToCart from '../ui/AddToCart.jsx'
import { flags } from '../lib/scroll.js'

function Options({ id, group, value, onChange, hint }) {
  return (
    <fieldset className="opts">
      <legend>{group.label}</legend>
      {group.values.map((v) => (
        <label key={v} className={value === v ? 'is-on' : ''}>
          <input type="radio" name={`${id}-${group.label}`} value={v} checked={value === v} onChange={() => onChange(v)} />
          {v}
          {hint && <span className="opts__hint">{hint[v]}</span>}
        </label>
      ))}
    </fieldset>
  )
}

function Card({ p, index, seen }) {
  const cart = useCart()
  const [option, setOption] = useState(p.options.default)
  const [colour, setColour] = useState(p.colours?.default)
  // the speed guide can pick the speed for the feather lines
  useEffect(() => {
    if (cart.speed && p.options.label === 'Speed') setOption(cart.speed)
  }, [cart.speed])
  const qty = cart.qtyOf(p.id, option, colour)
  const hover = (v) => () => productHover.set(p.id, v)
  return (
    <motion.article
      className="pcard"
      onPointerEnter={hover(1)}
      onPointerLeave={hover(0)}
      onFocus={hover(1)}
      onBlur={hover(0)}
      initial={{ opacity: 0, y: 30 }}
      animate={seen ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: flags.reduced ? 0 : 0.8, delay: flags.reduced ? 0 : index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby={`p-${p.id}`}
    >
      <div className="pcard__visual">
        <ProductView id={p.id} variant={p.variant} option={option} colour={colour} className="pcard__view" />
        <span className="pcard__tag mono">{p.pack}</span>
      </div>
      <div className="pcard__body">
        <p className="pcard__material mono">{p.material}</p>
        <h3 id={`p-${p.id}`} className="pcard__name">
          {p.name}
        </h3>
        <p className="pcard__text">{p.body}</p>
        <div className="pcard__opts">
          <Options id={p.id} group={p.options} value={option} onChange={setOption} hint={p.options.hint} />
          {p.colours && <Options id={p.id} group={p.colours} value={colour} onChange={setColour} />}
        </div>
        <div className="pcard__buy">
          <p className="pcard__price">
            <strong data-assumed>{rupees(p.price)}</strong>
            <span>{p.pack.toLowerCase()}</span>
          </p>
          <AddToCart quantity={qty} name={`${p.name}, ${p.options.label.toLowerCase()} ${option}`} label="Add" wide onQuantityChange={(q) => cart.setQty(p.id, option, colour, q)} onAdd={(el) => cart.fly(el)} />
        </div>
      </div>
    </motion.article>
  )
}

export default function Shop() {
  const ref = useSection('shop')
  const [gridRef, seen] = useInView({ threshold: 0.15 })
  const cart = useCart()
  return (
    <section id="shop" className="shop" ref={ref} aria-labelledby="shop-title">
      <div className="wrap">
        <div className="shop__head">
          <h2 id="shop-title" className="h2">
            Shuttles by the tube
          </h2>
          <p className="lede">Pick a line and a speed. Feather tubes hold 12 shuttles, nylon tubes hold 6.</p>
          <button type="button" className="btn btn--ghost btn--sm shop__cart" onClick={cart.open}>
            See cart{cart.count ? ` (${cart.count})` : ''}
          </button>
        </div>
        <div className="shop__grid" ref={gridRef}>
          {PRODUCTS.map((p, i) => (
            <Card key={p.id} p={p} index={i} seen={seen} />
          ))}
        </div>
      </div>
    </section>
  )
}
