import React from 'react';
import { InterventionLogItem } from '../types';
import { 
  X, 
  ShieldAlert, 
  CheckCircle, 
  ArrowUpRight, 
  Bot 
} from 'lucide-react';

interface InterventionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: InterventionLogItem[];
  onApproveLog: (id: string) => void;
}

export const InterventionLogModal: React.FC<InterventionLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onApproveLog
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agent Intervention Log & Human Decision Gates</h3>
              <p className="text-[11px] text-slate-500">
                {logs.filter(l => l.status === 'Pending Review').length} active decisions awaiting partner/manager approval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Log Items List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              All agent interventions have been resolved.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    log.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {log.riskLevel} Risk • {log.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{log.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {log.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Bot className="w-3.5 h-3.5 text-[#00338D]" />
                    <span>{log.agentName}</span>
                  </div>

                  {log.status === 'Pending Review' ? (
                    <button
                      onClick={() => onApproveLog(log.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-[#00338D] hover:bg-blue-900 text-white font-semibold rounded text-xs shadow-2xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Decision</span>
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-bold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approved</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>
  );
};
