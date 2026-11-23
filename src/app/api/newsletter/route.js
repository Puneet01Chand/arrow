import { handle, ok, readJson } from '@/backend/http/respond.js'
import { subscribe } from '@/backend/services/newsletter.service.js'

// POST /api/newsletter — footer sign-up. Repeat sign-ups return 200, new ones 201.
export const POST = handle(async (request) => {
  const result = await subscribe(await readJson(request))
  return ok(result, result.alreadySubscribed ? 200 : 201)
})
