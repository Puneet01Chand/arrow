import { handle, ok } from '@/backend/http/respond.js'
import { getCatalogue } from '@/backend/services/catalogue.service.js'

// GET /api/products — the catalogue: products, club tiers, currency.
export const GET = handle(async () => ok(getCatalogue()))
