import '@/frontend/styles/globals.css'

const title = 'Arrow | Feather shuttlecocks for club and tournament play'
const description =
  'Feather and nylon badminton shuttlecocks sold by the tube: goose-feather tournament shuttles, duck-feather club shuttles and nylon training shuttles in speeds 76 to 78.'

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description: 'Goose, duck and nylon shuttlecocks by the tube, with a speed guide for your hall.',
    type: 'website',
  },
}

export const viewport = {
  themeColor: '#070908',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-type="product">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
