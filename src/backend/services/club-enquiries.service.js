import 'server-only'
import { randomUUID } from 'node:crypto'
import { clubEnquirySchema } from '../validation/schemas.js'
import { collection } from '../db/json-store.js'

const enquiries = collection('club-enquiries')

export async function createClubEnquiry(input) {
  const data = clubEnquirySchema.parse(input)
  const enquiry = { id: randomUUID(), ...data, status: 'new', createdAt: new Date().toISOString() }
  await enquiries.insert(enquiry)
  return enquiry
}
