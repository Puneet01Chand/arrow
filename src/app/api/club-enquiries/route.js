import { handle, ok, readJson } from '@/backend/http/respond.js'
import { createClubEnquiry } from '@/backend/services/club-enquiries.service.js'

// POST /api/club-enquiries — a club or academy asking for bulk prices.
export const POST = handle(async (request) => {
  const enquiry = await createClubEnquiry(await readJson(request))
  return ok({ id: enquiry.id, status: enquiry.status }, 201)
})
