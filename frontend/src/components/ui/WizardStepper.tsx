import React from 'react';

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-800 rounded-full -z-10" />
        
        {/* Active Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full -z-10 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                  ${isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' 
                    : 'bg-gray-800 text-gray-500 border border-gray-700'}
                  ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''}
                `}
              >
                {isActive ? '✓' : index + 1}
              </div>
              <span 
                className={`
                  text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 absolute -bottom-6
                  ${isActive ? 'text-blue-400' : 'text-gray-600'}
                `}
                style={{ 
                    transform: 'translateX(-50%)', 
                    left: `${(index / (steps.length - 1)) * 100}%`,
                    position: 'absolute',
                    bottom: '-24px',
                    width: 'max-content'
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
