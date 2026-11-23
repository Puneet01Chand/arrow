'use client'

import React, { useState } from 'react'
import { CartProvider, useCart } from './lib/cart.jsx'
import Scene, { TravelerView } from './three/Scene.jsx'
import Nav from './ui/Nav.jsx'
import CartDrawer from './ui/CartDrawer.jsx'
import Loader from './sections/Loader.jsx'
import Hero from './sections/Hero.jsx'
import Anatomy from './sections/Anatomy.jsx'
import Flight from './sections/Flight.jsx'
import Speed from './sections/Speed.jsx'
import Shop from './sections/Shop.jsx'
import Craft from './sections/Craft.jsx'
import Clubs from './sections/Clubs.jsx'
import Close from './sections/Close.jsx'
import Footer from './sections/Footer.jsx'

/*
  Arrow storefront (client). Mounted by ArrowExperience with ssr: false.
  Kind: product (a physical product brand that sells online). Look: "Night Court".
  Effects by request: React Three Fiber shuttle (one canvas, drei Views),
  ShaderGradient grounds (hero, close), liquid glass (nav, chips, panels, cart),
  liquid-logo shader (loader, close), anime.js decode and line drawing,
  Motion for UI transitions, Kokonut UI cart stepper.
*/

function FlyLayer() {
  const cart = useCart()
  return <div ref={cart.flyLayer} className="fly-layer" aria-hidden="true" />
}

export default function App() {
  const [lifted, setLifted] = useState(false)
  return (
    <CartProvider>
      <Scene />
      <TravelerView />
      <Loader onLift={() => setLifted(true)} />
      <Nav />
      <main id="main">
        <Hero lifted={lifted} />
        <Anatomy />
        <Flight />
        <Speed />
        <Shop />
        <Craft />
        <Clubs />
        <Close />
      </main>
      <Footer />
      <CartDrawer />
      <FlyLayer />
    </CartProvider>
  )
}
