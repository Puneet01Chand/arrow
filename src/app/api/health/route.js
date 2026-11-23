import { ok } from '@/backend/http/respond.js'

// GET /api/health — liveness check for hosting and uptime monitors.
export const GET = () => ok({ status: 'ok', time: new Date().toISOString() })
