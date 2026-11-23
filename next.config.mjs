// FRONTEND_ONLY=1 builds the storefront as a static site (out/) with no API
// routes: route handlers are .js files, so limiting pageExtensions to .jsx
// drops src/app/api from the build. Used for the Vercel deployment.
const frontendOnly = process.env.FRONTEND_ONLY === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(frontendOnly && {
    output: 'export',
    pageExtensions: ['jsx'],
    images: { unoptimized: true },
  }),
  env: {
    // Read by src/frontend/services/api.js.
    ARROW_FRONTEND_ONLY: frontendOnly ? '1' : '',
  },
  turbopack: {
    rules: {
      // GLSL sources are imported as plain strings (was Vite's `?raw`).
      '*.{frag,vert,glsl}': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
