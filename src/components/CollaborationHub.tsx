import React, { useState } from 'react';
import { 
  pipelineAgents as initialAgents, 
  pbcOperationRows as initialPbcRows 
} from '../data/mockData';
import { PBCOperationRow, AgentInfo } from '../types';
import { 
  Bot, 
  Pause, 
  Play, 
  RotateCw, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface CollaborationHubProps {
  onReviewPbc: (row: PBCOperationRow) => void;
}

export const CollaborationHub: React.FC<CollaborationHubProps> = ({ onReviewPbc }) => {
  const [agents, setAgents] = useState<AgentInfo[]>(initialAgents);
  const [pbcRows, setPbcRows] = useState<PBCOperationRow[]>(initialPbcRows);

  const toggleAgentStatus = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'paused' ? 'active' : 'paused' };
      }
      return a;
    }));
  };

  const handleAction = (id: string, action: 'accept' | 'reject') => {
    setPbcRows(prev => prev.map(r => {
      if (r.id === id) {
        if (action === 'accept') {
          return {
            ...r,
            accepted: 'check',
            secondRequestComment: 'Accepted & Verified • ready for archive',
            humanActionNeeded: false
          };
        } else {
          return {
            ...r,
            secondRequestComment: 'Rejected by auditor • revision requested',
            humanActionNeeded: true
          };
        }
      }
      return r;
    }));
  };

  return (
    <div className="space-y-6">
      {/* AI execution pipeline Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          AI execution pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                    <Bot className="w-4 h-4 text-[#00338D]" />
                    <span>{agent.code} {agent.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      title="Pause/Play Agent"
                    >
                      {agent.status === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      title="Reload Agent"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {agent.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Status: {agent.status}</span>
                <span>{agent.updateTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PBC operation checklist Matrix Table Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          PBC operation checklist
        </h3>

        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 min-w-[130px]">Phase (Life cycle)</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Business Process</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Audit Procedure</th>
                  <th className="py-2.5 px-3 min-w-[180px]">PBC description</th>
                  <th className="py-2.5 px-2 text-center border-l border-slate-200">Request</th>
                  <th className="py-2.5 px-2 text-center border-l border-slate-200">Submitted</th>
                  <th className="py-2.5 px-2 text-center border-l border-slate-200">Validating</th>
                  <th className="py-2.5 px-2 text-center border-l border-slate-200">Second-request</th>
                  <th className="py-2.5 px-2 text-center border-l border-slate-200">Accepted</th>
                  <th className="py-2.5 px-2 text-center border-l border-slate-200">Cleansing</th>
                  <th className="py-2.5 px-2 text-center border-l border-slate-200">Archived</th>
                  <th className="py-2.5 px-3 min-w-[220px] border-l border-slate-200">Second-request with comments</th>
                  <th className="py-2.5 px-3 min-w-[160px] border-l border-slate-200">Human Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-[11px]">
                {pbcRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Phase */}
                    <td className="py-3 px-3 font-bold text-[#00338D] align-middle">
                      {row.phase}
                    </td>

                    {/* Business Process */}
                    <td className="py-3 px-3 font-medium text-slate-800 align-middle">
                      {row.businessProcess}
                    </td>

                    {/* Audit Procedure */}
                    <td className="py-3 px-3 text-slate-600 align-middle">
                      {row.auditProcedure}
                    </td>

                    {/* PBC Description */}
                    <td className="py-3 px-3 align-middle">
                      <span className="font-bold text-[#00338D] mr-1">{row.pbcCode}</span>
                      <span className="text-slate-700 font-medium">{row.pbcDescription}</span>
                    </td>

                    {/* Request */}
                    <td className="py-3 px-2 text-center align-middle border-l border-slate-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </td>

                    {/* Submitted */}
                    <td className="py-3 px-2 text-center align-middle border-l border-slate-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </td>

                    {/* Validating */}
                    <td className="py-3 px-2 text-center align-middle border-l border-slate-200">
                      {row.validating === 'check' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {row.validating === 'dot' && (
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        </div>
                      )}
                    </td>

                    {/* Second Request */}
                    <td className="py-3 px-2 text-center align-middle border-l border-slate-200">
                      {row.secondRequest === 'alert' && (
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {row.secondRequest === 'dash' && <span className="text-slate-300">-</span>}
                    </td>

                    {/* Accepted */}
                    <td className="py-3 px-2 text-center align-middle border-l border-slate-200">
                      {row.accepted === 'check' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {row.accepted === 'dash' && <span className="text-slate-300">-</span>}
                    </td>

                    {/* Cleansing */}
                    <td className="py-3 px-2 text-center align-middle border-l border-slate-200">
                      {row.cleansing === 'check' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {row.cleansing === 'dash' && <span className="text-slate-300">-</span>}
                    </td>

                    {/* Archived */}
                    <td className="py-3 px-2 text-center align-middle border-l border-slate-200">
                      {row.archived === 'check' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {row.archived === 'dash' && <span className="text-slate-300">-</span>}
                    </td>

                    {/* Second request comment */}
                    <td className="py-3 px-3 text-slate-600 text-[10px] leading-snug align-middle border-l border-slate-200">
                      {row.secondRequestComment}
                    </td>

                    {/* Human Action */}
                    <td className="py-3 px-3 align-middle border-l border-slate-200">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onReviewPbc(row)}
                          className="px-2 py-0.5 bg-white border border-blue-300 hover:border-[#00338D] text-[#00338D] text-[11px] font-semibold rounded shadow-2xs"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleAction(row.id, 'accept')}
                          className="px-2 py-0.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded shadow-2xs"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(row.id, 'reject')}
                          className="px-2 py-0.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-[11px] font-semibold rounded shadow-2xs"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
