import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AsciiText } from './reactbits/AsciiText';
import { AuroraBackground } from './reactbits/AuroraBackground';
import { Particles } from './reactbits/Particles';
import { BorderBeam } from './reactbits/BorderBeam';

const AURORA_COLORS = ["#00FFB2", "#7B2FFF", "#FF2D7B", "#00E5FF"];
const PARTICLE_COLORS = ["#C71585", "#00E5FF", "#FF006E"];

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handleDemoMode = () => {
    localStorage.setItem('resumai_demo', 'true');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <motion.div
          className="w-12 h-12 border-4 border-[#C71585]/30 border-t-[#C71585] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <AuroraBackground
      colors={AURORA_COLORS}
      className="bg-[#0A0A0F]"
    >
      {/* Particle layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Particles
          quantity={200}
          colors={PARTICLE_COLORS}
          size={0.8}
          staticity={30}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <div className="flex justify-center mb-8">
            <div className="relative">
              <AsciiText
                text="RESUMAI"
                className="text-white text-center"
                fps={10}
              />
              <div
                className="absolute inset-0 blur-3xl opacity-40 -z-10"
                style={{
                  background: 'radial-gradient(ellipse at center, #7B2FFF44 0%, #C7158522 40%, transparent 70%)'
                }}
              />
            </div>
          </div>

          <motion.p
            className="text-[#FFFFFF66] text-lg tracking-[0.3em] uppercase font-['Space_Grotesk']"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            AI-Powered Career Intelligence
          </motion.p>
        </motion.div>

        {/* Premium Continue Button */}
        <motion.div
          className="relative group"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.6, type: "spring", stiffness: 200 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {/* Glass card foundation */}
          <button
            onClick={handleDemoMode}
            className="relative px-20 py-5 font-['Space_Grotesk'] text-[1.1rem] font-semibold tracking-[0.05em] text-white rounded-full overflow-hidden transition-all duration-500"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isHovered
                ? '0 0 80px rgba(199, 21, 133, 0.3), 0 0 160px rgba(0, 229, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 0 40px rgba(199, 21, 133, 0.2), 0 0 80px rgba(255, 0, 110, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            {/* Iridescent gradient overlay */}
            <div
              className="absolute inset-0 opacity-60 mix-blend-overlay"
              style={{
                background: isHovered
                  ? 'linear-gradient(135deg, #C71585, #FF006E, #C71585)'
                  : 'linear-gradient(135deg, #C71585, #FF006E)',
              }}
            />

            {/* Shimmer sweep - fires once on mount */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
              initial={{ backgroundPosition: '200% 0' }}
              animate={{ backgroundPosition: '-200% 0' }}
              transition={{ duration: 2, delay: 1.5, ease: "easeInOut" }}
            />

            {/* Continuous subtle pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  'inset 0 0 20px rgba(199, 21, 133, 0.0)',
                  'inset 0 0 20px rgba(199, 21, 133, 0.3)',
                  'inset 0 0 20px rgba(199, 21, 133, 0.0)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Button text */}
            <span className="relative z-10">Continue</span>
          </button>

          {/* Border Beam - activates on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <BorderBeam
                  colorFrom="#C71585"
                  colorTo="#00E5FF"
                  duration={6}
                  size={400}
                  borderWidth={1.5}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Subtle footer */}
        <motion.p
          className="absolute bottom-8 text-[#FFFFFF33] text-xs font-['Inter']"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          No account required · Your data stays local
        </motion.p>
      </div>
    </AuroraBackground>
  );
}
