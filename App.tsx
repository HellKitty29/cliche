
import React, { useState, useEffect } from 'react';
import { ModuleStep } from './types';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import TemplateModule from './components/TemplateModule';
import LocationModule from './components/LocationModule';
import TaskModule from './components/TaskModule';
import TaskDashboard from './components/TaskDashboard';
import PreWp from './components/PreWp';
import PreWpOnline from './components/PreWpOnline';
import PreWpJuly from './components/PreWpJuly';
import TaskDetailPage from './components/TaskDetailPage';
import ProjectTaskManagement from './components/ProjectTaskManagement';
import Sidebar from './components/Sidebar';
import IndieMatrixPage from './components/IndieMatrixPage';
import ShitUiWorkspace from './components/ShitUiWorkspace';
import { LOCATIONS, TASKS } from './constants';

export type TemplateStatus = 'draft' | 'submitted' | 'reviewed';
export type TemplateReviewInfo = {
  reviewer: string;
  reviewTime: string;
} | null;
export type AppView =
  | 'workflow'
  | 'taskDashboard'
  | 'preWp'
  | 'preWpOnline'
  | 'wpForJuly'
  | 'taskDetail'
  | 'projectTaskManagement'
  | 'indieMatrix'
  | 'shituiCurrent'
  | 'shituiNewVersion';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ModuleStep>(ModuleStep.TEMPLATE);
  const [templateStatus, setTemplateStatus] = useState<TemplateStatus>('draft');
  const [currentView, setCurrentView] = useState<AppView>('workflow');
  const [previousView, setPreviousView] = useState<AppView>('workflow');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasClickedLocationAction, setHasClickedLocationAction] = useState(false);
  const [showUploadHint, setShowUploadHint] = useState(false);
  const [templateReviewInfo, setTemplateReviewInfo] = useState<TemplateReviewInfo>(null);

  const locationCount = LOCATIONS.length;
  const taskCount = TASKS.length;

  // Header height is roughly 60px. Sidebar will start below it.
  const HEADER_HEIGHT = 60;
  const SIDEBAR_EXPANDED_WIDTH = 130; // Very narrow expanded width

  const setHashForView = (view: AppView) => {
    const next =
      view === 'workflow'
        ? '#/workflow'
        : view === 'projectTaskManagement'
          ? '#/project'
          : view === 'taskDashboard'
            ? '#/tasks'
            : view === 'preWp'
              ? '#/prewp'
              : view === 'preWpOnline'
                ? '#/prewp-online'
                : view === 'wpForJuly'
                  ? '#/wp-for-july'
                  : view === 'indieMatrix'
                    ? '#/indie-matrix'
                    : view === 'shituiCurrent'
                      ? '#/shitui-current'
                      : view === 'shituiNewVersion'
                        ? '#/shitui-new-version'
                    : '';

    if (next && window.location.hash !== next) {
      window.location.hash = next;
    }
  };

  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash || '';
      if (h.startsWith('#/indie-matrix')) {
        setCurrentView('indieMatrix');
        return;
      }
      if (h.startsWith('#/shitui-new-version')) {
        setCurrentView('shituiNewVersion');
        return;
      }
      if (h.startsWith('#/shitui-current')) {
        setCurrentView('shituiCurrent');
        return;
      }
      if (h.startsWith('#/project')) {
        setCurrentView('projectTaskManagement');
        return;
      }
      if (h.startsWith('#/tasks')) {
        setCurrentView('taskDashboard');
        return;
      }
      if (h.startsWith('#/prewp-online')) {
        setCurrentView('preWpOnline');
        return;
      }
      if (h.startsWith('#/wp-for-july')) {
        setCurrentView('wpForJuly');
        return;
      }
      if (h.startsWith('#/prewp')) {
        setCurrentView('preWp');
        return;
      }
      if (h.startsWith('#/workflow')) {
        setCurrentView('workflow');
        setCurrentStep(ModuleStep.TEMPLATE);
        return;
      }
    };

    window.addEventListener('hashchange', applyHash);
    applyHash();
    return () => {
      window.removeEventListener('hashchange', applyHash);
    };
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    // Open when mouse is at the very left edge
    if (e.clientX < 15 && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
    // Close when mouse moves past the expanded sidebar area
    if (isSidebarOpen && e.clientX > SIDEBAR_EXPANDED_WIDTH + 20) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isSidebarOpen]);

  const renderMainContent = () => {
    if (currentView === 'indieMatrix') {
      return <IndieMatrixPage />;
    }

    if (currentView === 'shituiCurrent') {
      return <ShitUiWorkspace page="current" />;
    }

    if (currentView === 'shituiNewVersion') {
      return <ShitUiWorkspace page="new-version" />;
    }

    if (currentView === 'preWp') {
      return (
        <PreWp 
          taskId={selectedTaskId || ''} 
          onBack={() => setCurrentView('projectTaskManagement')} 
        />
      );
    }

    if (currentView === 'preWpOnline') {
      return (
        <PreWpOnline
          taskId={selectedTaskId || ''}
          onBack={() => setCurrentView('projectTaskManagement')}
        />
      );
    }

    if (currentView === 'wpForJuly') {
      return (
        <PreWpJuly
          taskId={selectedTaskId || ''}
          onBack={() => setCurrentView('projectTaskManagement')}
        />
      );
    }

    if (currentView === 'taskDetail') {
      return <TaskDetailPage onBack={() => setCurrentView(previousView)} />;
    }

    if (currentView === 'projectTaskManagement') {
      return (
        <ProjectTaskManagement
          onOpenPreWp={() => {
            setSelectedTaskId('260211');
            setPreviousView('projectTaskManagement');
            setCurrentView('preWp');
          }}
        />
      );
    }

    if (currentView === 'taskDashboard') {
      return (
        <TaskDashboard
          onPrev={() => {
            setCurrentView('workflow');
            setCurrentStep(ModuleStep.LOCATION);
          }}
          tasks={TASKS}
          locations={LOCATIONS}
          onTaskClick={(taskId) => {
            setSelectedTaskId(taskId);
            setPreviousView('taskDashboard');
            setCurrentView('preWp');
          }}
        />
      );
    }

    switch (currentStep) {
      case ModuleStep.TEMPLATE:
        return (
          <TemplateModule
            onNext={() => setCurrentStep(ModuleStep.LOCATION)}
            status={templateStatus}
            setStatus={setTemplateStatus}
            setReviewInfo={setTemplateReviewInfo}
            setShowUploadHint={(show) => {
              setShowUploadHint(show);
              if (show) {
                setHasClickedLocationAction(false);
              }
            }}
          />
        );
      case ModuleStep.LOCATION:
        return <LocationModule onAction={() => setHasClickedLocationAction(true)} />;
      case ModuleStep.TASK:
        return (
          <TaskModule 
            tasks={TASKS} 
            onTaskClick={(taskId) => {
              setSelectedTaskId(taskId);
              setPreviousView('workflow');
              setCurrentView('taskDetail');
            }}
          />
        );
      default:
        return (
          <TemplateModule
            onNext={() => setCurrentStep(ModuleStep.LOCATION)}
            status={templateStatus}
            setStatus={setTemplateStatus}
            setReviewInfo={setTemplateReviewInfo}
            setShowUploadHint={(show) => {
              setShowUploadHint(show);
              if (show) {
                setHasClickedLocationAction(false);
              }
            }}
          />
        );
    }
  };

  const isShitUiView = currentView === 'shituiCurrent' || currentView === 'shituiNewVersion';
  const isStandaloneView =
    currentView === 'preWp' || currentView === 'wpForJuly' || currentView === 'taskDetail' || currentView === 'indieMatrix' || isShitUiView;
  const isFullWidthView = currentView === 'indieMatrix' || isShitUiView;
  const isWideContentView = currentView === 'preWpOnline' || currentView === 'wpForJuly';
  const showShellHeader = !isShitUiView;
  const showShellFooter = !isShitUiView;
  const sidebarTopOffset = showShellHeader ? HEADER_HEIGHT : 0;

  return (
    <div className="min-h-screen flex flex-col relative bg-[#f5f7fa]">
      {showShellHeader && (
        <div className="z-[60] relative">
          <Header />
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectModule={(module) => {
          if (module === 'workflow') {
            setCurrentView('workflow');
            setCurrentStep(ModuleStep.TEMPLATE);
            setHashForView('workflow');
          } else if (module === 'projectTaskManagement') {
            setCurrentView('projectTaskManagement');
            setHashForView('projectTaskManagement');
          } else if (module === 'tasks') {
            setCurrentView('taskDashboard');
            setHashForView('taskDashboard');
          } else if (module === 'preWp') {
            setCurrentView('preWp');
            setHashForView('preWp');
          } else if (module === 'preWpOnline') {
            setCurrentView('preWpOnline');
            setHashForView('preWpOnline');
          } else if (module === 'wpForJuly') {
            setCurrentView('wpForJuly');
            setHashForView('wpForJuly');
          } else if (module === 'indieMatrix') {
            setCurrentView('indieMatrix');
            setHashForView('indieMatrix');
          } else if (module === 'shituiCurrent') {
            setCurrentView('shituiCurrent');
            setHashForView('shituiCurrent');
          } else if (module === 'shituiNewVersion') {
            setCurrentView('shituiNewVersion');
            setHashForView('shituiNewVersion');
          }
          setIsSidebarOpen(false);
        }}
        activeView={currentView}
        activeWorkflowStep={currentStep}
        topOffset={sidebarTopOffset}
        expandedWidth={SIDEBAR_EXPANDED_WIDTH}
      />

      <main
        className={`flex-1 ${isShitUiView ? 'p-0' : 'p-6'} ${isFullWidthView ? 'max-w-none' : isWideContentView ? 'max-w-[1680px] mx-auto' : 'max-w-[1400px] mx-auto'} w-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'pl-[130px]' : isShitUiView ? 'pl-0' : 'pl-6'}`}
      >
        {!isStandaloneView && (
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">1325146-Tech Solutions Demo & Training (CN)</h1>
              </div>

              {currentView === 'workflow' && (
                <StepIndicator
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                  templateStatus={templateStatus}
                  templateReviewInfo={templateReviewInfo}
                  locationCount={locationCount}
                  taskCount={taskCount}
                  hasClickedLocationAction={hasClickedLocationAction}
                  showUploadHint={showUploadHint}
                />
              )}
            </div>
          </div>
        )}

        <div className={isStandaloneView ? '' : 'bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[600px]'}>
          {renderMainContent()}
        </div>
      </main>

      {showShellFooter && <footer className="p-4 text-[10px] text-gray-400 border-t bg-gray-50 mt-auto">
        <div className="max-w-[1400px] mx-auto">
          <p>KPMG On-site Information Collector (KOIC) v1.3.1, released in Nov 2025.</p>
          <p className="mt-1">© 2025 KPMG Huazhen LLP, a People's Republic of China partnership and a member firm of the KPMG network of independent member firms affiliated with KPMG International Limited ("KPMG International"), a UK entity. All rights reserved.</p>
        </div>
      </footer>}
    </div>
  );
};

export default App;
