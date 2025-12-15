import React from 'react';
import { ShinyButton } from './reactbits/ShinyButton';
import { AsciiText } from './reactbits/AsciiText';
import { BlurText } from './reactbits/BlurText';
import { Icons } from './ui/Icons';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'cvChat' | 'massMail' | 'masterCV' | 'editor' | 'enhancedChat' | 'massApply') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center py-20">
      {/* Hero Section */}
      <div className="text-center mb-20 space-y-6">
        <div className="flex justify-center mb-4">
          <AsciiText 
            text="RESUMAI" 
            className="text-white text-center"
            fps={10}
          />
        </div>
        <BlurText
          text="Swarm-Powered Career Tools"
          className="text-2xl text-gray-300"
          delay={0.5}
        />
        <p className="text-gray-400 max-w-2xl mx-auto mt-4">
          Using Maximal Agentic Decomposition and Ensemble Voting for zero-error CV creation and career management
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full px-6">
        {/* Create CV Card */}
        <div className="glass rounded-3xl p-10 hover:scale-105 transition-all duration-300 cursor-pointer group border border-white/10 bg-black/40 backdrop-blur-md flex flex-col items-center min-h-[400px] justify-between">
          <div className="text-center space-y-6 w-full flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
              <Icons.FileText className="text-blue-400" size={40} />
            </div>
            <h3 className="text-2xl font-semibold text-white">
              Create CV
            </h3>
            <p className="text-gray-400 h-16 flex items-center justify-center px-4">
              Build your CV from scratch using our intelligent wizard
            </p>
          </div>
          <div className="w-full flex justify-center pb-2">
              <ShinyButton
                onClick={() => onNavigate('editor')}
                className="!bg-blue-500/10 !border-blue-500/20 hover:!border-blue-500/50"
              >
                Launch Editor
              </ShinyButton>
          </div>
        </div>

        {/* CV Chat Card */}
        <div className="glass rounded-3xl p-10 hover:scale-105 transition-all duration-300 cursor-pointer group border border-white/10 bg-black/40 backdrop-blur-md flex flex-col items-center min-h-[400px] justify-between">
          <div className="text-center space-y-6 w-full flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
              <Icons.MessageSquare className="text-purple-400" size={40} />
            </div>
            <h3 className="text-2xl font-semibold text-white">
              CV Chat
            </h3>
            <p className="text-gray-400 h-16 flex items-center justify-center px-4">
              AI-powered CV analysis, enhancement, and job tailoring
            </p>
          </div>
          <div className="w-full flex justify-center pb-2">
              <ShinyButton
                onClick={() => onNavigate('cvChat')}
                className="!bg-purple-500/10 !border-purple-500/20 hover:!border-purple-500/50"
              >
                Launch CV Chat
              </ShinyButton>
          </div>
        </div>

        {/* Mass Mail Card */}
        <div className="glass rounded-3xl p-10 hover:scale-105 transition-all duration-300 cursor-pointer group border border-white/10 bg-black/40 backdrop-blur-md flex flex-col items-center min-h-[400px] justify-between">
          <div className="text-center space-y-6 w-full flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/30 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
              <Icons.Send className="text-orange-400" size={40} />
            </div>
            <h3 className="text-2xl font-semibold text-white">
              Mass Mail
            </h3>
            <p className="text-gray-400 h-16 flex items-center justify-center px-4">
              Smart bulk email outreach with cooldown management
            </p>
          </div>
          <div className="w-full flex justify-center pb-2">
              <ShinyButton
                onClick={() => onNavigate('massMail')}
                className="!bg-orange-500/10 !border-orange-500/20 hover:!border-orange-500/50"
              >
                Launch Mass Mail
              </ShinyButton>
          </div>
        </div>
      </div>

      {/* Mass Apply Section */}
      <div className="mt-12 max-w-6xl w-full px-6">
        <div className="glass rounded-3xl p-8 hover:scale-[1.02] transition-all duration-300 cursor-pointer group border border-white/10 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icons.Rocket className="text-indigo-400" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Mass Apply
                </h3>
                <p className="text-gray-400">
                  Batch job applications with AI-tailored CVs and cover letters
                </p>
              </div>
            </div>
            <ShinyButton
              onClick={() => onNavigate('massApply')}
              className="!bg-indigo-500/10 !border-indigo-500/20 hover:!border-indigo-500/50"
            >
              Launch Mass Apply
            </ShinyButton>
          </div>
        </div>
      </div>


      {/* Feature Highlights */}
      <div className="mt-24 grid md:grid-cols-3 gap-12 text-center max-w-4xl w-full px-6">
        <div>
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/30 flex items-center justify-center mb-3">
            <Icons.Grid className="text-yellow-400" size={28} />
          </div>
          <h4 className="text-white font-medium mb-2">Swarm Intelligence</h4>
          <p className="text-gray-500 text-sm">5 parallel LLMs voting on every decision</p>
        </div>
        <div>
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/30 flex items-center justify-center mb-3">
            <Icons.Zap className="text-green-400" size={28} />
          </div>
          <h4 className="text-white font-medium mb-2">Zero Errors</h4>
          <p className="text-gray-500 text-sm">Fault-tolerant through redundancy</p>
        </div>
        <div>
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/30 flex items-center justify-center mb-3">
            <Icons.Star className="text-pink-400" size={28} />
          </div>
          <h4 className="text-white font-medium mb-2">Premium Quality</h4>
          <p className="text-gray-500 text-sm">Industrial-grade reliability</p>
        </div>
      </div>
    </div>
  );
};
