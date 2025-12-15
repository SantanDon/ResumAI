import React, { useState } from 'react';

interface GooeyNavItem {
  id: string;
  name: string;
  icon: string;
  onClick: () => void;
}

interface GooeyNavProps {
  items: GooeyNavItem[];
  activeId: string;
  className?: string;
}

export const GooeyNav: React.FC<GooeyNavProps> = ({ 
  items, 
  activeId, 
  className = '' 
}) => {
  const activeIndex = items.findIndex(item => item.id === activeId);

  return (
    <nav className={`relative flex items-center justify-center p-4 ${className}`}>
      {/* Background for navigation */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-black/20 backdrop-blur-sm rounded-2xl"></div>
      
      {/* Gooey effect container */}
      <div className="relative flex w-full max-w-md justify-around">
        {/* SVG filter for gooey effect */}
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 12">
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
          
          {/* Animated path that follows the active item */}
          <path 
            id="curved-path" 
            fill="#a855f7" 
            filter="url(#goo)"
            d={`M0,12 C${20 + activeIndex * 20},12 ${20 + activeIndex * 20},0 40,0 C${60 + activeIndex * 20},0 ${60 + activeIndex * 20},12 100,12 L100,16 L0,16 Z`}
          />
        </svg>
        
        {/* Navigation items */}
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`relative z-10 flex flex-col items-center justify-center w-16 h-16 transition-all duration-300 ${
              activeIndex === index ? 'text-white' : 'text-gray-400'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d={item.icon}
              ></path>
            </svg>
            <span className="text-xs mt-1">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};