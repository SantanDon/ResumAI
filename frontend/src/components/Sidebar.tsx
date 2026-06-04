import { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, FileText, Eye, Search, Zap, Settings } from 'lucide-react';
import { designSystem } from '../styles/tokens';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: 'upload', label: 'Upload & Parse', icon: Upload },
  { id: 'editor', label: 'MasterCV Editor', icon: FileText },
  { id: 'preview', label: 'CV Preview', icon: Eye },
  { id: 'analysis', label: 'Skills Analysis', icon: Search },
  { id: 'enhancer', label: 'AI Enhancer', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div 
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{
        background: designSystem.colors.abyss,
        backdropFilter: 'blur(40px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      <div className="h-full p-4 flex flex-col">
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-8 p-2 rounded-lg hover:bg-white/10 transition-colors self-end"
        >
          {collapsed ? <ChevronRight size={20} className="text-[#FFFFFF66]" /> : <ChevronLeft size={20} className="text-[#FFFFFF66]" />}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                activeSection === id
                  ? 'shadow-lg'
                  : 'hover:bg-white/10'
              }`}
              style={{
                background: activeSection === id 
                  ? 'linear-gradient(135deg, rgba(199,21,133,0.2), rgba(255,0,110,0.2))'
                  : 'transparent',
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="flex-shrink-0 text-[#FFFFFF66]" />
              {!collapsed && <span className="ml-3 text-sm font-medium text-[#F0F0F5]">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="mt-8 text-xs text-[#FFFFFF66] text-center">
            ResumAI v1.0
          </div>
        )}
      </div>
    </div>
  );
}