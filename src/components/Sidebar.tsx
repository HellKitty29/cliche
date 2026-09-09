import React from 'react';
import { NavTab } from '../types';
import { 
  LayoutGrid, 
  Files, 
  GitCommit, 
  Sliders, 
  Cpu, 
  Bot, 
  ShieldAlert 
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openInterventionModal: () => void;
  interventionCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openInterventionModal,
  interventionCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Cockpit Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'collaboration', label: 'Collaboration Hub', icon: <Files className="w-4 h-4" /> },
    { id: 'lifecycle', label: 'Audit Lifecycle', icon: <GitCommit className="w-4 h-4" /> },
    { id: 'objectives', label: 'Audit Objectives', icon: <Sliders className="w-4 h-4" /> },
    { id: 'orchestra', label: 'AI Agent Orchestra', icon: <Cpu className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-64 bg-slate-50/80 border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen select-none">
      {/* Top Section */}
      <div>
        {/* KPMG & User Greeting Header */}
        <div className="p-4 border-b border-slate-200/60 flex items-center space-x-3">
          {/* KPMG Logo Badge */}
          <div className="w-9 h-9 rounded bg-[#00338D] text-white flex items-center justify-center font-extrabold tracking-tighter text-xs shadow-xs">
            KPMG
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Welcome,</div>
            <div className="text-base font-bold text-[#00338D]">Eric!</div>
          </div>
        </div>

        {/* Navigation Heading */}
        <div className="px-4 pt-5 pb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            NAVIGATION
          </span>
        </div>

        {/* Nav Links */}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50/90 text-[#00338D] border-l-4 border-l-[#00338D] border border-blue-200/80 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-[#00338D]' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Assistant & Intervention Log Button */}
      <div className="p-4 border-t border-slate-200/60 flex flex-col items-center justify-center space-y-4">
        {/* Floating Futuristic AI Assistant Graphic */}
        <div className="relative group cursor-pointer" onClick={openInterventionModal}>
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-slate-100 to-blue-50 border border-blue-200 shadow-md flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00338D] to-indigo-600 flex items-center justify-center text-white shadow-inner">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            {/* Online Indicator */}
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
        </div>

        {/* Intervention Log Button */}
        <button
          onClick={openInterventionModal}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-[#00338D] text-xs font-semibold rounded-lg shadow-2xs transition-all duration-150"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Intervention Log ({interventionCount})</span>
        </button>
      </div>
    </aside>
  );
};
