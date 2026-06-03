/** @paper-design/shaders-react@0.0.68 */
import { GrainGradient } from '@paper-design/shaders-react';
import { useMemo, useState, useEffect } from 'react';

/**
 * Performance-optimized Background Shader
 * - Smooth CSS gradient + tactile SVG noise on mobile
 * - WebGL grain gradient shader on desktop with a readability contrast overlay
 */
export default function BackgroundShader() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const useWebGL = useMemo(() => {
    if (isMobile) return false;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }, [isMobile]);

  // Mobile Background: Smooth hardware-accelerated animated gradient + grain noise overlay
  if (isMobile) {
    return (
      <>
        {/* Animated Color Shift */}
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            zIndex: -3,
            background: 'linear-gradient(135deg, #0a0a0a, #1a0a2e, #0a1a2e, #0a0a1a)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 10s ease infinite',
          }} 
        />
        {/* Tactile SVG noise overlay for premium texture */}
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            zIndex: -2,
            opacity: 0.05,
            pointerEvents: 'none',
            background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }} 
        />
        {/* Readability backing contrast layer */}
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            zIndex: -1,
            background: 'rgba(0, 0, 0, 0.35)',
            pointerEvents: 'none'
          }} 
        />
      </>
    );
  }

  // CSS animated gradient as fallback for desktop
  const cssBackground = (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: -2,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 25%, #0a1a2e 50%, #0a0a1a 75%, #0a0a0a 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }} 
    />
  );

  // If WebGL not available, just show CSS
  if (!useWebGL) {
    return cssBackground;
  }

  // WebGL shader on desktop with contrast/legibility overlay
  return (
    <>
      {cssBackground}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
        <GrainGradient 
          speed={0.8} 
          scale={1} 
          rotation={0} 
          offsetX={0} 
          offsetY={0} 
          softness={0.5} 
          intensity={0.4} 
          noise={0.2} 
          shape="corners" 
          colors={['#a32461ff', '#EBA8FF', '#14586eff', '#2A00FF']} 
          colorBack="#00000000" 
          style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} 
        />
        {/* Semi-transparent dark overlay to keep WebGL colors beautiful but make text highly legible */}
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            background: 'rgba(0, 0, 0, 0.45)', 
            pointerEvents: 'none' 
          }} 
        />
      </div>
    </>
  );
}
