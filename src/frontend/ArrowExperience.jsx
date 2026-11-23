'use client'

import dynamic from 'next/dynamic'

// The page is one WebGL canvas plus scroll-measured sections; its modules read
// window, document and matchMedia as they load. So it renders in the browser
// only — the server sends the shell (metadata, fonts, styles) and this mounts
// the experience on the client.
const ArrowApp = dynamic(() => import('./ArrowApp.jsx'), { ssr: false })

export default function ArrowExperience() {
  return <ArrowApp />
}
