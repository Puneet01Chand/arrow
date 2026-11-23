import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { animate } from 'animejs'
import LiquidLogo from '../fx/LiquidLogo.jsx'
import { flags } from '../lib/scroll.js'

// The Arrow mark in liquid metal, then the curtain lifts and the shuttle drops in.
export default function Loader({ onLift }) {
  const [phase, setPhase] = useState('in')

  useEffect(() => {
    document.documentElement.classList.add('is-loading')
    const t = setTimeout(() => setPhase('out'), flags.reduced ? 150 : 1900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'out') return
    document.documentElement.classList.remove('is-loading')
    onLift && onLift()
    animate(flags, { intro: [0, 1], duration: flags.reduced ? 1 : 1500, delay: 250, ease: 'outCubic' })
  }, [phase])

  if (phase === 'gone') return null
  return (
    <motion.div
      className="loader"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={phase === 'out' ? { clipPath: 'inset(0% 0% 100% 0%)' } : { clipPath: 'inset(0% 0% 0% 0%)' }}
      transition={{ duration: flags.reduced ? 0.01 : 0.95, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => phase === 'out' && setPhase('gone')}
    >
      <LiquidLogo className="loader__logo" running={phase === 'in'} />
      <p className="loader__line mono">Feather shuttlecocks · tubes of 12</p>
      <button type="button" className="loader__skip link" onClick={() => setPhase('out')}>
        Skip intro
      </button>
    </motion.div>
  )
}
