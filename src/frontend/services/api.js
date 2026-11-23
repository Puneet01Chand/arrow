// The frontend's only door to the backend. Components call these functions,
// never fetch() directly, so endpoints and the response shape live in one place.
//
// Every call resolves (never throws) to either
//   { ok: true, data }
//   { ok: false, message, fields }   fields: { 'customer.email': '...', ... }

const OFFLINE = { ok: false, message: 'Could not reach Arrow. Check your connection and try again.', fields: {} }
const NO_BACKEND = {
  ok: false,
  message: 'Online requests are not available on this site yet. Email us and we will sort it out.',
  fields: {},
}

// Same-origin /api by default. A frontend-only build (static, no API routes)
// can point at a backend hosted elsewhere via NEXT_PUBLIC_API_URL.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '')
const HAS_BACKEND = Boolean(API_BASE) || process.env.ARROW_FRONTEND_ONLY !== '1'

async function request(path, { method = 'GET', body } = {}) {
  if (!HAS_BACKEND) return NO_BACKEND
  let res
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    return OFFLINE
  }
  const json = await res.json().catch(() => null)
  if (json?.ok) return { ok: true, data: json.data }
  return {
    ok: false,
    message: json?.error?.message ?? 'Something went wrong. Try again in a moment.',
    fields: json?.error?.fields ?? {},
  }
}

export const api = {
  getCatalogue: () => request('/api/products'),
  getSpeed: (temp, high) => request(`/api/speed?temp=${encodeURIComponent(temp)}&high=${high ? 1 : 0}`),
  createOrder: ({ customer, lines }) =>
    request('/api/orders', {
      method: 'POST',
      body: {
        customer,
        lines: lines.map(({ productId, option, colour, qty }) => ({ productId, option, colour: colour ?? null, qty })),
      },
    }),
  createClubEnquiry: (enquiry) => request('/api/club-enquiries', { method: 'POST', body: enquiry }),
  subscribe: (email) => request('/api/newsletter', { method: 'POST', body: { email } }),
}

// Picks the errors under one prefix and strips it: ('customer', {'customer.email': m}) -> { email: m }
export function fieldsUnder(prefix, fields) {
  const out = {}
  for (const [k, v] of Object.entries(fields)) if (k.startsWith(prefix + '.')) out[k.slice(prefix.length + 1)] = v
  return out
}
