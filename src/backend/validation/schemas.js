import 'server-only'
import { z } from 'zod'
import { CLUB_VOLUMES, MAX_QTY_PER_LINE } from '@/shared/catalogue.js'

// Request shapes for every write endpoint. Messages match the wording the
// forms already show, so server errors can be displayed as-is.

const email = (example) =>
  z.string().trim().max(254).pipe(z.email({ message: `Write an email address, like ${example}.` }))

const required = (message, max = 120) => z.string().trim().min(1, { message }).max(max, { message: 'That is longer than we can take.' })

export const orderLineSchema = z.object({
  productId: z.string().min(1),
  option: z.string().min(1),
  colour: z.string().min(1).optional().nullable(),
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
})

export const orderRequestSchema = z.object({
  customer: z.object({
    name: required('Write the name for the order.'),
    email: email('you@club.in'),
    city: required('Write the city the tubes go to.'),
  }),
  lines: z.array(orderLineSchema).min(1, { message: 'The cart is empty.' }).max(30),
})

export const clubEnquirySchema = z.object({
  club: required('Write the name of your club or academy.'),
  city: required('Write the city you play in.'),
  tubes: z.enum(CLUB_VOLUMES, { message: 'Pick how many tubes a month.' }),
  email: email('coach@club.in'),
})

export const newsletterSchema = z.object({
  email: email('you@club.in'),
})
