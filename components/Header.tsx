
import React from 'react';
import { User, Globe, ChevronDown, Menu } from 'lucide-react';

interface HeaderProps {
  julyVariant?: 'A' | 'B';
  onJulyVariantChange?: (variant: 'A' | 'B') => void;
  julyMenuOpen?: boolean;
  onJulyMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ julyVariant, onJulyVariantChange, julyMenuOpen, onJulyMenuToggle }) => {
  return (
    <header className="bg-[#1e49e2] text-white px-6 h-[60px] flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-4">
        {julyVariant === 'A' && (
          <button
            id="wp-july-menu-button"
            type="button"
            onClick={onJulyMenuToggle}
            aria-label={julyMenuOpen ? '收起工作底稿导航' : '展开工作底稿导航'}
            aria-expanded={julyMenuOpen}
            aria-controls="wp-july-menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="text-2xl font-black tracking-tighter flex items-center">
          KPMG
        </div>
        <div className="h-6 w-px bg-white/20 mx-2"></div>
        <div className="text-sm font-semibold tracking-tight">毕马威打卡星</div>
      </div>

      <div className="flex items-center space-x-6 text-xs">
        {julyVariant && (
          <div className="flex rounded-md border border-white/25 p-0.5" role="group" aria-label="工作底稿设计版本">
            {(['A', 'B'] as const).map((variant) => (
              <button
                key={variant}
                type="button"
                aria-pressed={julyVariant === variant}
                title={variant === 'A' ? 'A 版 · 左侧磨砂导航' : 'B 版 · 原有设计'}
                onClick={() => onJulyVariantChange?.(variant)}
                className={`h-6 w-6 rounded text-[10px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${julyVariant === variant ? 'bg-white text-[#00338D] shadow-sm' : 'text-white/75 hover:bg-white/15'}`}
              >{variant}</button>
            ))}
          </div>
        )}
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
