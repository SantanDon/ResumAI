import React from 'react';

interface GradientInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const GradientInput: React.FC<GradientInputProps> = ({ label, icon, className = "", ...props }) => {
  return (
    <div className="group relative">
      <label className="block text-xs font-medium text-white/70 mb-1 ml-1 group-focus-within:text-blue-400 transition-colors">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-white/60 group-focus-within:text-blue-400 transition-colors z-10">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2.5 
            ${icon ? 'pl-10' : 'pl-3'} pr-3 text-sm text-white placeholder-gray-600
            focus:outline-none focus:border-transparent focus:ring-0
            transition-all duration-300
            peer
            ${className}
          `}
        />
        {/* Gradient Border Effect */}
        <div className="absolute inset-0 rounded-lg -z-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 peer-focus:opacity-100 blur-[1px] transition-opacity duration-300" />
        <div className="absolute inset-[1px] rounded-[7px] -z-10 bg-gray-900 peer-focus:bg-gray-900/90 transition-colors duration-300" />
      </div>
    </div>
  );
};
