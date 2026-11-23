import 'server-only'
import { PRODUCTS, CLUB_TIERS, SPEED_WORDS, speedFor } from '@/shared/catalogue.js'

// Read side of the catalogue. Today it serves the static shared catalogue;
// when products move into a database, only this file changes.

export function getCatalogue() {
  return { products: PRODUCTS, clubTiers: CLUB_TIERS, currency: 'INR' }
}

export function recommendSpeed(temp, high) {
  const speed = speedFor(temp, high)
  return { speed, label: SPEED_WORDS[speed] }
}
