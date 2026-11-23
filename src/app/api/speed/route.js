import { handle, ok, HttpError } from '@/backend/http/respond.js'
import { recommendSpeed } from '@/backend/services/catalogue.service.js'

// GET /api/speed?temp=26&high=1 — shuttle speed for a hall temperature (°C)
// and whether the hall is at altitude.
export const GET = handle(async (request) => {
  const params = request.nextUrl.searchParams
  const temp = Number(params.get('temp'))
  if (!params.has('temp') || !Number.isFinite(temp) || temp < -10 || temp > 50) {
    throw new HttpError(400, 'invalid_temp', 'Pass temp as a hall temperature in °C between -10 and 50.')
  }
  const high = ['1', 'true', 'yes'].includes(params.get('high') ?? '')
  return ok(recommendSpeed(temp, high))
})
