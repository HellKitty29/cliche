
import React from 'react';
import { FileText, ClipboardList, FileSearch, FolderKanban, LayoutGrid, Rows3, TableProperties } from 'lucide-react';
import { ModuleStep } from '../types';
import { AppView } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (
    module: 'workflow' | 'projectTaskManagement' | 'tasks' | 'preWp' | 'preWpOnline' | 'indieMatrix' | 'shituiCurrent' | 'shituiNewVersion'
  ) => void;
  activeView: AppView;
  activeWorkflowStep: ModuleStep;
  topOffset: number;
  expandedWidth: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onSelectModule, 
  activeView, 
  topOffset,
  expandedWidth 
}) => {
  return (
    <nav
      className={`fixed left-0 bg-[#00338d] text-white z-50 shadow-2xl overflow-hidden
                  transition-all duration-300 ease-in-out flex flex-col`}
      style={{ 
        width: isOpen ? `${expandedWidth}px` : '0px',
        top: `${topOffset}px`,
        height: `calc(100vh - ${topOffset}px)`,
        opacity: isOpen ? 1 : 0
      }}
      onMouseLeave={onClose}
    >
      <div className="flex flex-col pt-6 space-y-3 px-2 w-[130px]">
        {/* Project Workflow Button */}
        <button
          onClick={() => onSelectModule('workflow')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'workflow' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <FileText size={16} className={activeView === 'workflow' ? 'text-[#00338d]' : 'text-white'} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'workflow' ? 'text-[#00338d]' : 'text-white'}`}>
            项目流程
          </span>
        </button>

        <button
          onClick={() => onSelectModule('projectTaskManagement')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'projectTaskManagement' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <FolderKanban
              size={16}
              className={activeView === 'projectTaskManagement' ? 'text-[#00338d]' : 'text-white'}
            />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'projectTaskManagement' ? 'text-[#00338d]' : 'text-white'}`}>
            项目任务管理
          </span>
        </button>

        {/* Task Button */}
        <button
          onClick={() => onSelectModule('tasks')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'taskDashboard' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <ClipboardList size={16} className={activeView === 'taskDashboard' ? 'text-[#00338d]' : 'text-white'} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'taskDashboard' ? 'text-[#00338d]' : 'text-white'}`}>
            任务
          </span>
        </button>

        {/* PreWp Button */}
        <button
          onClick={() => onSelectModule('preWp')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'preWp' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <FileSearch size={16} className={activeView === 'preWp' ? 'text-[#00338d]' : 'text-white'} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'preWp' ? 'text-[#00338d]' : 'text-white'}`}>
            存货盘点底稿
          </span>
        </button>

        <button
          onClick={() => onSelectModule('preWpOnline')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'preWpOnline' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <FileSearch size={16} className={activeView === 'preWpOnline' ? 'text-[#00338d]' : 'text-white'} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'preWpOnline' ? 'text-[#00338d]' : 'text-white'}`}>
            working paper online vesion
          </span>
        </button>

        <button
          onClick={() => onSelectModule('indieMatrix')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'indieMatrix' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <LayoutGrid size={16} className={activeView === 'indieMatrix' ? 'text-[#00338d]' : 'text-white'} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'indieMatrix' ? 'text-[#00338d]' : 'text-white'}`}>
            资产矩阵
          </span>
        </button>
        <button
          onClick={() => onSelectModule('shituiCurrent')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'shituiCurrent' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <TableProperties size={16} className={activeView === 'shituiCurrent' ? 'text-[#00338d]' : 'text-white'} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'shituiCurrent' ? 'text-[#00338d]' : 'text-white'}`}>
            SHITUI current
          </span>
        </button>

        <button
          onClick={() => onSelectModule('shituiNewVersion')}
          className={`flex items-center h-10 px-2 rounded-md transition-all duration-200 group
                      ${activeView === 'shituiNewVersion' ? 'bg-white text-[#00338d] shadow-md' : 'hover:bg-blue-800 text-white'}`}
        >
          <div className="flex items-center justify-center w-7 shrink-0">
            <Rows3 size={16} className={activeView === 'shituiNewVersion' ? 'text-[#00338d]' : 'text-white'} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ml-2 ${activeView === 'shituiNewVersion' ? 'text-[#00338d]' : 'text-white'}`}>
            SHITUI new
          </span>
        </button>
      </div>
      
      <div className="mt-auto mb-8 px-2 opacity-30">
        <div className="h-px bg-white/20 w-full mb-4"></div>
        <div className="text-[8px] uppercase tracking-tighter text-center">Audit Intelligence</div>
      </div>
    </nav>
  );
};

export default Sidebar;
