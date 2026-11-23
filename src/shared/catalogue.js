// Shared catalogue: the single source of truth for products and prices.
// Imported by the frontend (display) and the backend (pricing, validation),
// so it must stay pure — no React, no browser or Node APIs.
// Prices are placeholders for the client to replace (each price element on
// the page carries data-assumed).

// Most tubes of one line/option a single cart line may hold (the stepper's cap).
export const MAX_QTY_PER_LINE = 20

export const PRODUCTS = [
  {
    id: 'tournament',
    name: 'Arrow Tournament',
    material: 'Goose feather, natural cork',
    body: 'For league matches and tournament days, where every shuttle in the tube has to fly the same.',
    price: 2349,
    pack: 'Tube of 12',
    options: { label: 'Speed', values: ['76', '77', '78'], default: '77' },
    variant: 'tournament',
  },
  {
    id: 'club',
    name: 'Arrow Club',
    material: 'Duck feather, composite cork',
    body: 'For club nights and coaching sessions that go through several tubes a week.',
    price: 1449,
    pack: 'Tube of 12',
    options: { label: 'Speed', values: ['76', '77', '78'], default: '77' },
    variant: 'club',
  },
  {
    id: 'training',
    name: 'Arrow Training',
    material: 'Nylon skirt, cork base',
    body: 'For drills, juniors and garden games. A nylon skirt takes far more hits than feathers.',
    price: 649,
    pack: 'Tube of 6',
    options: { label: 'Cap', values: ['Green', 'Blue', 'Red'], default: 'Blue', hint: { Green: 'slow', Blue: 'medium', Red: 'fast' } },
    colours: { label: 'Skirt', values: ['Yellow', 'White'], default: 'Yellow' },
    variant: 'training',
  },
]

export const CLUB_TIERS = [
  { tubes: '10 tubes', price: 1349 },
  { tubes: '25 tubes', price: 1289 },
  { tubes: '50 tubes or more', price: 1229 },
]

export const CLUB_VOLUMES = ['10', '25', '50', '100']

export const findProduct = (id) => PRODUCTS.find((p) => p.id === id) ?? null

export const rupees = (n) => '₹' + n.toLocaleString('en-IN')

// Speed from hall temperature (°C) and altitude, after the common
// temperature grades printed on feather tubes. Hill towns take one step slower.
export function speedFor(temp, high) {
  let s
  if (temp >= 33) s = 75
  else if (temp >= 27) s = 76
  else if (temp >= 22) s = 77
  else if (temp >= 17) s = 78
  else s = 79
  if (high) s -= 1
  return Math.max(75, s)
}

export const SPEED_WORDS = { 75: 'Slow', 76: 'Quite slow', 77: 'Medium', 78: 'Quite fast', 79: 'Fast' }
