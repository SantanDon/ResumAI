import React from 'react';
import { motion } from 'framer-motion';
import { Button, Card, Badge } from './ui';
import { Icons } from './ui/Icons';
import { cn } from '../lib/utils';

// SlideIn animation component
const SlideIn: React.FC<{
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}> = ({ children, direction = 'up', delay = 0, className }) => {
  const offset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const features = [
    {
      icon: Icons.FileText,
      title: 'Create CV',
      description: 'Build your CV from scratch using our intelligent wizard',
      color: 'blue',
      action: 'editor' as const,
    },
    {
      icon: Icons.MessageSquare,
      title: 'CV Chat',
      description: 'AI-powered CV analysis, enhancement, and job tailoring',
      color: 'purple',
      action: 'cvChat' as const,
    },
    {
      icon: Icons.Target,
      title: 'Job Hunter',
      description: 'Auto-scout remote jobs, match your CV, apply automatically',
      color: 'orange',
      action: 'jobHunter' as const,
    },
  ];

  const featureColors = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20 hover:border-blue-500/40', icon: 'text-blue-400', glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]' },
    purple: { bg: 'bg-primary-500/10', border: 'border-primary-500/20 hover:border-primary-500/40', icon: 'text-primary-400', glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20 hover:border-orange-500/40', icon: 'text-orange-400', glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'text-yellow-400', glow: '' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', glow: '' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: 'text-pink-400', glow: '' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20 hover:border-indigo-500/40', icon: 'text-indigo-400', glow: 'group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]' },
  };

  const highlights = [
    {
      icon: Icons.Zap,
      title: 'Lightning Fast',
      description: 'Process and enhance your CV in seconds',
      color: 'yellow',
    },
    {
      icon: Icons.Star,
      title: 'Professional Quality',
      description: 'Industry-standard CVs tailored to your goals',
      color: 'pink',
    },
    {
      icon: Icons.Globe,
      title: 'Secure & Private',
      description: 'Your data stays on your device',
      color: 'green',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      icon: 'text-blue-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
    },
    purple: {
      bg: 'bg-primary-500/10',
      border: 'border-primary-500/20 hover:border-primary-500/40',
      icon: 'text-primary-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20 hover:border-orange-500/40',
      icon: 'text-orange-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: 'text-yellow-400',
      glow: '',
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: 'text-green-400',
      glow: '',
    },
    pink: {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      icon: 'text-pink-400',
      glow: '',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      icon: 'text-indigo-400',
      glow: 'group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]',
    },
  };

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center py-20 px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

      {/* Hero Section */}
      <SlideIn direction="up" className="text-center mb-16 relative z-10 max-w-4xl">
        <Badge variant="primary" size="lg" className="mb-6" dot>
          Powered by AI
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight text-balance">
          Build Your Career with{' '}
          <span className="gradient-text">AI Intelligence</span>
        </h1>
        
        <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
          Using Maximal Agentic Decomposition and Ensemble Voting for zero-error 
          CV creation and career management
        </p>
      </SlideIn>

      {/* Main Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full relative z-10 mb-8">
        {features.map((feature, index) => {
          const colors = featureColors[feature.color as keyof typeof featureColors];
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
            >
              <Card
                variant="glass"
                padding="lg"
                className={cn(
                  'group cursor-pointer h-full flex flex-col transition-all duration-300',
                  colors.border,
                  colors.glow
                )}
                onClick={() => onNavigate(feature.action)}
              >
                <div className="flex flex-col items-center text-center flex-1">
                  <div className={cn(
                    'w-16 h-16 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110',
                    colors.bg
                  )}>
                    <feature.icon className={colors.icon} size={32} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-white/70 text-sm leading-relaxed mb-6 flex-1">
                    {feature.description}
                  </p>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group/btn"
                    rightIcon={
                      <Icons.ArrowRight 
                        size={16} 
                        className="transition-transform group-hover/btn:translate-x-1" 
                      />
                    }
                  >
                    Get Started
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Auto Remote Job Hunter Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="max-w-5xl w-full relative z-10 mb-16"
      >
        <Card
          variant="glass"
          padding="lg"
          className={cn(
            'group cursor-pointer transition-all duration-300',
            colorClasses.indigo.border,
            colorClasses.indigo.glow
          )}
          onClick={() => onNavigate('jobHunter')}
        >
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-5">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                colorClasses.indigo.bg
              )}>
                <Icons.Rocket className={colorClasses.indigo.icon} size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Auto Remote Job Hunter
                </h3>
                <p className="text-white/70 text-sm">
                  Scout remote jobs → Match your CV → Auto-tailor → Apply → Self-evolve
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="success" size="sm" dot>
                Self-Learning
              </Badge>
              <Button
                variant="secondary"
                size="md"
                rightIcon={
                  <Icons.ArrowRight 
                    size={16} 
                    className="transition-transform group-hover:translate-x-1" 
                  />
                }
              >
                Launch
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Highlights Section */}
      <SlideIn direction="up" delay={0.6} className="w-full max-w-4xl relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => {
            const colors = colorClasses[highlight.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                className={cn(
                  'p-5 rounded-xl bg-white/5 border transition-all duration-300 hover:bg-white/[0.07]',
                  colors.border
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                  colors.bg
                )}>
                  <highlight.icon className={colors.icon} size={20} />
                </div>
                <h4 className="text-white font-medium mb-1">{highlight.title}</h4>
                <p className="text-white/60 text-sm">{highlight.description}</p>
              </motion.div>
            );
          })}
        </div>
      </SlideIn>

      {/* Footer Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="mt-16 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
          <span className="text-white/70 text-sm">Powered by Advanced AI Agents</span>
        </div>
      </motion.div>
    </div>
  );
};
