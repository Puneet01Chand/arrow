import 'server-only'
import { newsletterSchema } from '../validation/schemas.js'
import { collection } from '../db/json-store.js'

const subscribers = collection('newsletter')

// Signing up twice is not an error: the second call reports the existing sign-up.
export async function subscribe(input) {
  const email = newsletterSchema.parse(input).email.toLowerCase()
  const existing = await subscribers.findOne((s) => s.email === email)
  if (existing) return { email, alreadySubscribed: true }
  await subscribers.insert({ email, createdAt: new Date().toISOString() })
  return { email, alreadySubscribed: false }
}
