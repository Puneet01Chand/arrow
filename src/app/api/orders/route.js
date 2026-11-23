import { handle, ok, readJson } from '@/backend/http/respond.js'
import { createOrderRequest } from '@/backend/services/orders.service.js'

// POST /api/orders — an order request from the cart. No payment is taken;
// the server prices every line from the catalogue and stores the request.
export const POST = handle(async (request) => {
  const order = await createOrderRequest(await readJson(request))
  return ok({ id: order.id, count: order.count, total: order.total, currency: order.currency, status: order.status }, 201)
})
