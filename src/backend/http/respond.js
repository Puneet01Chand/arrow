import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// One response shape for every API route:
//   success: { ok: true, data }
//   failure: { ok: false, error: { code, message, fields? } }
// The frontend's api client (src/frontend/services/api.js) relies on it.

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export const ok = (data, status = 200) => NextResponse.json({ ok: true, data }, { status })

const fail = (status, code, message, fields) =>
  NextResponse.json({ ok: false, error: { code, message, ...(fields ? { fields } : {}) } }, { status })

// Turns zod issues into { 'lines.0.option': 'message', email: 'message' }.
export function fieldErrors(zodError) {
  const fields = {}
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

const MAX_BODY_BYTES = 32 * 1024

export async function readJson(request) {
  const type = request.headers.get('content-type') || ''
  if (!type.includes('application/json')) throw new HttpError(415, 'unsupported_media_type', 'Send JSON.')
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'payload_too_large', 'The request is too large.')
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'invalid_json', 'The request body is not valid JSON.')
  }
}

// Wraps a route handler so thrown HttpErrors / ZodErrors become clean JSON
// responses and anything unexpected becomes a logged 500.
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context)
    } catch (err) {
      if (err instanceof ZodError) return fail(422, 'validation_failed', 'Some fields need another look.', fieldErrors(err))
      if (err instanceof HttpError) return fail(err.status, err.code, err.message, err.fields)
      console.error('[api] unhandled error', err)
      return fail(500, 'internal_error', 'Something went wrong on our side. Try again in a moment.')
    }
  }
}
