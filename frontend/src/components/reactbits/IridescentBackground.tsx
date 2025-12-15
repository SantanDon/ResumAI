import React, { ReactNode } from 'react';

interface IridescentBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export const IridescentBackground: React.FC<IridescentBackgroundProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`relative min-h-screen w-full min-w-full overflow-hidden ${className}`}>
      {/* Iridescent Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-70 animate-gradient-x"></div>

      {/* Additional layers for iridescence effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-purple-500/10 to-transparent opacity-30"></div>

      {/* Animated particles/elements for iridescence */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              background: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.1)`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen w-full">
        {children}
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, 10px) rotate(5deg); }
          50% { transform: translate(10px, 20px) rotate(0deg); }
          75% { transform: translate(0px, 10px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        .animate-gradient-x {
          background-size: 300% 300%;
          animation: gradient-x 15s ease infinite;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};