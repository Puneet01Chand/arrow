import 'server-only'
import { randomBytes } from 'node:crypto'
import { findProduct, MAX_QTY_PER_LINE } from '@/shared/catalogue.js'
import { orderRequestSchema } from '../validation/schemas.js'
import { HttpError } from '../http/respond.js'
import { collection } from '../db/json-store.js'

const orders = collection('orders')

const orderNumber = () => 'ARW-' + Date.now().toString(36).toUpperCase() + '-' + randomBytes(2).toString('hex').toUpperCase()

// Checks each cart line against the catalogue and prices it on the server.
// The browser's prices are never trusted; only ids, options and quantities.
function priceLines(lines) {
  const merged = new Map()
  const fields = {}

  lines.forEach((line, i) => {
    const product = findProduct(line.productId)
    if (!product) {
      fields[`lines.${i}.productId`] = 'That product is no longer sold.'
      return
    }
    if (!product.options.values.includes(line.option)) {
      fields[`lines.${i}.option`] = `Pick a ${product.options.label.toLowerCase()} for ${product.name}.`
      return
    }
    const colour = product.colours ? line.colour : null
    if (product.colours && !product.colours.values.includes(colour)) {
      fields[`lines.${i}.colour`] = `Pick a ${product.colours.label.toLowerCase()} colour for ${product.name}.`
      return
    }

    const key = [product.id, line.option, colour].filter(Boolean).join('|')
    const prev = merged.get(key)
    const qty = (prev?.qty ?? 0) + line.qty
    if (qty > MAX_QTY_PER_LINE) {
      fields[`lines.${i}.qty`] = `${MAX_QTY_PER_LINE} tubes is the most per line. Use the club form for bigger orders.`
      return
    }
    merged.set(key, {
      productId: product.id,
      name: product.name,
      optionLabel: product.options.label,
      option: line.option,
      colour,
      pack: product.pack,
      unitPrice: product.price,
      qty,
      lineTotal: product.price * qty,
    })
  })

  if (Object.keys(fields).length) throw new HttpError(422, 'invalid_cart', 'Some items in the cart need another look.', fields)
  return [...merged.values()]
}

export async function createOrderRequest(input) {
  const { customer, lines } = orderRequestSchema.parse(input)
  const priced = priceLines(lines)

  const order = {
    id: orderNumber(),
    status: 'requested', // no payment is taken yet; Arrow confirms by email
    customer,
    lines: priced,
    count: priced.reduce((n, l) => n + l.qty, 0),
    total: priced.reduce((n, l) => n + l.lineTotal, 0),
    currency: 'INR',
    createdAt: new Date().toISOString(),
  }
  await orders.insert(order)
  return order
}
