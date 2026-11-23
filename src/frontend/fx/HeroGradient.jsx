import React, { useEffect, useRef, useState } from 'react'
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'
import { flags } from '../lib/scroll.js'

// ShaderGradient behind the hero and the close: deep court greens moving
// slowly under the grid. Mounted only while its section is on screen.
export default function HeroGradient({ className, tone = 'hero' }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '200px 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const colours =
    tone === 'hero'
      ? { color1: '#1d6a47', color2: '#0a1610', color3: '#040605' }
      : { color1: '#28623f', color2: '#0b140f', color3: '#4d6a12' }
  return (
    <div ref={ref} className={className} aria-hidden="true">
      {on && (
        <ShaderGradientCanvas style={{ position: 'absolute', inset: 0 }} pixelDensity={1} fov={45} pointerEvents="none" lazyLoad={false}>
          <ShaderGradient
            control="props"
            type="waterPlane"
            animate={flags.reduced ? 'off' : 'on'}
            uTime={8}
            uSpeed={0.14}
            uStrength={1.5}
            uDensity={1.5}
            uFrequency={0}
            uAmplitude={0}
            positionX={0}
            positionY={0}
            positionZ={0}
            rotationX={50}
            rotationY={0}
            rotationZ={-60}
            cAzimuthAngle={180}
            cPolarAngle={80}
            cDistance={2.8}
            cameraZoom={9.1}
            {...colours}
            reflection={0.1}
            brightness={1.1}
            lightType="3d"
            grain="on"
            envPreset="city"
          />
        </ShaderGradientCanvas>
      )}
    </div>
  )
}
