
import React from 'react';
import { User, Globe, ChevronDown } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-[#1e49e2] text-white px-6 h-[60px] flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-black tracking-tighter flex items-center">
          KPMG
        </div>
        <div className="h-6 w-px bg-white/20 mx-2"></div>
        <div className="text-sm font-semibold tracking-tight">毕马威打卡星</div>
      </div>

      <div className="flex items-center space-x-6 text-xs">
        <div className="flex items-center cursor-pointer hover:bg-white/10 px-3 py-1.5 rounded-full transition-all border border-white/10">
          <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center mr-2 ring-1 ring-white/30">
            <User size={18} />
          </div>
          <span className="font-bold">Huang, Ian (SH/AQPP)</span>
          <ChevronDown size={14} className="ml-1 opacity-60" />
        </div>
        
        <div className="flex items-center cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition opacity-80">
          <Globe size={18} className="mr-1.5" />
          <span className="font-medium">简体中文</span>
          <ChevronDown size={14} className="ml-1" />
        </div>
      </div>
    </header>
  );
};

export default Header;
