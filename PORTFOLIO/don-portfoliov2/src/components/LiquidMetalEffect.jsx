/** @paper-design/shaders-react@0.0.68 */
import { LiquidMetal } from '@paper-design/shaders-react';

/**
 * Code exported from Paper
 * https://app.paper.design/file/01KDJ1HYKTJE11XMETSJEW1468?node=01K4QGM09CMDP3AP5Z1TD38FKH
 * on Dec 28, 2025 at 2:05 PM.
 */
export default function LiquidMetalEffect({ position = 'top-left' }) {
  const positionStyle = position === 'top-left' 
    ? { top: '-100px', left: '-100px' } 
    : { bottom: '-100px', right: '-100px' };

  return (
    <div style={{ 
      position: 'fixed', 
      ...positionStyle, 
      zIndex: 10, 
      pointerEvents: 'none',
      opacity: 0.8,
      filter: 'blur(2px)' // Subtle blur for better integration
    }}>
      <LiquidMetal 
        speed={1} 
        softness={0.27} 
        repetition={4.15} 
        shiftRed={0.3} 
        shiftBlue={0.3} 
        distortion={0.29} 
        contour={0.42} 
        scale={0.6} 
        rotation={0} 
        shape="metaballs" 
        frame={118284.32800023475} 
        angle={0} 
        colorBack="#00000000" 
        colorTint="#FFFFFF" 
        style={{ 
          backgroundColor: 'transparent', 
          borderRadius: '50%', 
          height: '400px', 
          width: '400px' 
        }} 
      />
    </div>
  );
}
