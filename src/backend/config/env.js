import 'server-only'
import path from 'node:path'

// Every backend setting is read here, once, so the rest of the backend never
// touches process.env directly. All values are server-only.
export const env = {
  dataDir: path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.ARROW_DATA_DIR || '.data'),
  isProduction: process.env.NODE_ENV === 'production',
}
