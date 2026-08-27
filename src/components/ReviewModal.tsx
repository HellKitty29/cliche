import React, { useState } from 'react';
import { RiskFocusRow, AuditProcedureRow, PBCOperationRow } from '../types';
import { X, CheckCircle, ShieldCheck, FileText, Bot } from 'lucide-react';

interface ReviewModalProps {
  item: RiskFocusRow | AuditProcedureRow | PBCOperationRow | null;
  onClose: () => void;
  onConfirmAction: (item: any, comment: string) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  item,
  onClose,
  onConfirmAction
}) => {
  const [comment, setComment] = useState<string>('');

  if (!item) return null;

  const isRisk = 'riskCategory' in item;
  const isProcedure = 'procedureCode' in item;
  const isPbc = 'pbcDescription' in item;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-[#00338D] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-200" />
            <h3 className="font-bold text-sm">
              {isRisk ? 'Risk Drift & Decision Review' : isProcedure ? 'Audit Procedure Review' : 'PBC Evidence Review'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-md text-blue-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {isRisk && (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#00338D] uppercase tracking-wider">Category</span>
                <div className="text-sm font-bold text-slate-900">{(item as RiskFocusRow).riskCategory}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Focus Description</span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium mt-0.5">
                  {(item as RiskFocusRow).riskFocus}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400">Drift Assessment</div>
                  <div className="font-bold text-red-600">{(item as RiskFocusRow).driftStatus}</div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400">Human Action Gate</div>
                  <div className="font-bold text-[#00338D]">{(item as RiskFocusRow).humanActionRole}</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Impact Reasoning</span>
                <p className="text-slate-600 mt-0.5">
                  {(item as RiskFocusRow).driftDescription}
                </p>
              </div>
            </div>
          )}

          {isProcedure && (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#00338D] uppercase tracking-wider">
                  {(item as AuditProcedureRow).procedureCode}
                </span>
                <div className="text-sm font-bold text-slate-900">{(item as AuditProcedureRow).procedureTitle}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400">Assertion</div>
                  <div className="font-semibold text-slate-800">{(item as AuditProcedureRow).assertion}</div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-400">Responsible Agent</div>
                  <div className="font-semibold text-[#00338D]">{(item as AuditProcedureRow).agentName}</div>
                </div>
              </div>
            </div>
          )}

          {isPbc && (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#00338D] uppercase tracking-wider">
                  {(item as PBCOperationRow).pbcCode}
                </span>
                <div className="text-sm font-bold text-slate-900">{(item as PBCOperationRow).pbcDescription}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments & Status</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                  {(item as PBCOperationRow).secondRequestComment}
                </p>
              </div>
            </div>
          )}

          {/* Partner Approval Note Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Partner / Manager Review Notes
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter review decision notes or sign-off instructions..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#00338D] focus:border-[#00338D] outline-none"
              rows={3}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmAction(item, comment);
              onClose();
            }}
            className="px-4 py-1.5 bg-[#00338D] hover:bg-blue-900 text-white font-semibold rounded text-xs flex items-center space-x-1"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve & Sign-Off</span>
          </button>
        </div>
      </div>
    </div>
  );
};
