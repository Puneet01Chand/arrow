import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  {
    // The React Compiler rules flag patterns the animation code relies on
    // (refs carried in the cart context, refs read while rendering motion).
    // Kept as warnings until those components are refactored.
    files: ['src/frontend/**'],
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', '.data/**', 'skywarriors-main/**']),
])
