import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react'
import { PRODUCTS } from '@/shared/catalogue.js'

const CartCtx = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'set': {
      const { key, qty, item } = action
      const exists = state.lines.find((l) => l.key === key)
      if (qty <= 0) return { ...state, lines: state.lines.filter((l) => l.key !== key) }
      if (exists) return { ...state, lines: state.lines.map((l) => (l.key === key ? { ...l, qty } : l)) }
      return { ...state, lines: [...state.lines, { ...item, key, qty }] }
    }
    case 'clear':
      return { ...state, lines: [] }
    case 'speed':
      return { ...state, speed: action.speed }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], speed: null })
  const cartButton = useRef(null)
  const dialog = useRef(null)
  const flyLayer = useRef(null)

  const lineKey = (productId, option, colour) => [productId, option, colour].filter(Boolean).join('|')

  const setQty = useCallback((productId, option, colour, qty) => {
    const p = PRODUCTS.find((x) => x.id === productId)
    dispatch({
      type: 'set',
      key: lineKey(productId, option, colour),
      qty,
      item: { productId, option, colour, name: p.name, price: p.price, pack: p.pack, optionLabel: p.options.label },
    })
  }, [])

  const qtyOf = useCallback(
    (productId, option, colour) => state.lines.find((l) => l.key === lineKey(productId, option, colour))?.qty ?? 0,
    [state.lines]
  )

  const count = state.lines.reduce((n, l) => n + l.qty, 0)
  const total = state.lines.reduce((n, l) => n + l.qty * l.price, 0)

  const open = useCallback(() => {
    const d = dialog.current
    if (d && !d.open) d.showModal()
  }, [])
  const close = useCallback(() => dialog.current?.close(), [])

  // A small shuttle flies from the pressed button to the cart in the nav.
  const fly = useCallback((fromEl) => {
    const to = cartButton.current
    const layer = flyLayer.current
    if (!fromEl || !to || !layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const a = fromEl.getBoundingClientRect()
    const b = to.getBoundingClientRect()
    const dot = document.createElement('span')
    dot.className = 'fly-dot'
    dot.innerHTML = SHUTTLE_SVG
    layer.appendChild(dot)
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2
    const lift = Math.min(220, Math.abs(y1 - y0) * 0.35 + 90)
    const anim = dot.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) rotate(0deg) scale(1)`, opacity: 1 },
        { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - lift}px) rotate(200deg) scale(1.15)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x1}px, ${y1}px) rotate(360deg) scale(0.4)`, opacity: 0.2 },
      ],
      { duration: 820, easing: 'cubic-bezier(.45,.05,.3,1)' }
    )
    anim.onfinish = () => {
      dot.remove()
      to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' })
    }
  }, [])

  const value = useMemo(
    () => ({ ...state, count, total, setQty, qtyOf, open, close, fly, cartButton, dialog, flyLayer, dispatch }),
    [state, count, total, setQty, qtyOf, open, close, fly]
  )
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export const useCart = () => useContext(CartCtx)

export const SHUTTLE_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 3h10l-2.6 11.5h-4.8z" fill="#EEF0E8"/><path d="M8.6 7.2h6.8M8 10.6h8" stroke="#2C8A5E" stroke-width="1.1"/><circle cx="12" cy="18" r="3.6" fill="#D9FF3F"/></svg>'
