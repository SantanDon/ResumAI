import { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, FileText, Eye, Search, Zap, Settings } from 'lucide-react';

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
    <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="glass-dark h-full p-4 flex flex-col">
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-8 p-2 rounded-lg hover:bg-white/10 transition-colors self-end"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                activeSection === id
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg'
                  : 'hover:bg-white/10'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="ml-3 text-sm font-medium">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="mt-8 text-xs text-gray-400 text-center">
            ResumAI v1.0
          </div>
        )}
      </div>
    </div>
  );
}