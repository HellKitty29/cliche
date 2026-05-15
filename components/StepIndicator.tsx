import React from 'react';
import type { TemplateReviewInfo } from '../App';
import { ModuleStep } from '../types';
import { ChevronRight, FileText, MapPin, ClipboardList } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: ModuleStep;
  onStepClick: (step: ModuleStep) => void;
  templateStatus: 'draft' | 'submitted' | 'reviewed';
  templateReviewInfo: TemplateReviewInfo;
  locationCount: number;
  taskCount: number;
  hasClickedLocationAction?: boolean;
  showUploadHint: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  templateStatus,
  locationCount,
  taskCount,
  hasClickedLocationAction,
  showUploadHint,
}) => {
  const shouldShowUploadHint =
    showUploadHint && templateStatus === 'reviewed' && !hasClickedLocationAction;

  const getTemplateStatusLabel = () => {
    switch (templateStatus) {
      case 'draft':
        return '\u672A\u63D0\u4EA4';
      case 'submitted':
        return '\u5F85\u590D\u6838';
      case 'reviewed':
        return '\u5DF2\u590D\u6838';
      default:
        return '\u672A\u63D0\u4EA4';
    }
  };

  const steps = [
    {
      key: ModuleStep.TEMPLATE,
      label: '\u6A21\u677F\u7BA1\u7406',
      summary: (
        <div>
          <div>{'\u72B6\u6001\uFF1A'}{getTemplateStatusLabel()}</div>
        </div>
      ),
      icon: <FileText size={18} />,
    },
    {
      key: ModuleStep.LOCATION,
      label: '\u5730\u70B9\u7BA1\u7406',
      summary: (
        <div>
          <div className="text-[9px]">{'\u5730\u70B9\u603B\u6570: '}{locationCount}</div>
          {shouldShowUploadHint && (
            <div
              className={`mt-1 max-w-[92px] truncate text-[9px] font-semibold whitespace-nowrap ${
                currentStep === ModuleStep.LOCATION ? 'text-white' : 'text-blue-700'
              }`}
              title={'\u4E0B\u4E00\u6B65\uFF1A\u4E0A\u4F20\u5730\u70B9'}
            >
              {'\u4E0B\u4E00\u6B65\uFF1A\u4E0A\u4F20\u5730\u70B9'}
            </div>
          )}
        </div>
      ),
      icon: <MapPin size={18} />,
    },
    {
      key: ModuleStep.TASK,
      label: '\u4EFB\u52A1\u7BA1\u7406',
      summary: `\u4EFB\u52A1\u603B\u6570: ${taskCount}`,
      icon: <ClipboardList size={18} />,
    },
  ];

  return (
    <nav className="flex items-center bg-white border border-gray-200 rounded-full px-2 py-1.5 shadow-sm">
      {steps.map((step, index) => {
        const isActive = currentStep === step.key;
        const isDone = steps.findIndex((s) => s.key === currentStep) > index;

        return (
          <React.Fragment key={step.key}>
            <button
              onClick={() => onStepClick(step.key)}
              className={`flex w-[150px] items-center space-x-3 rounded-full px-4 py-2 transition-all duration-300 ${
                isActive
                  ? 'bg-blue-primary text-white shadow-md transform scale-105'
                  : isDone
                    ? 'text-blue-primary hover:bg-blue-50'
                    : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border shrink-0 ${
                  isActive ? 'border-white bg-white/20' : 'border-current'
                }`}
              >
                {index + 1}
              </div>
              <div className="text-left leading-tight">
                <div className="text-sm font-bold whitespace-nowrap">{step.label}</div>
                <div
                  className={`mt-0.5 text-[10px] font-medium opacity-80 ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {step.summary}
                </div>
              </div>
            </button>
            {index < steps.length - 1 && (
              <div className="mx-1 text-gray-500">
                <ChevronRight size={18} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default StepIndicator;
