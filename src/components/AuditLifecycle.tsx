import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

export const AuditLifecycle: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(2);

  const stages = [
    {
      id: 1,
      code: '01',
      title: 'Preliminary Activities',
      status: 'Completed',
      progress: 100,
      tasksCount: '6/6 Passed',
      leadAgent: '1.2 Independence Check Agent',
      deliverables: ['UBO Schedule', 'Independence Declaration', 'Engagement Letter']
    },
    {
      id: 2,
      code: '02',
      title: 'Planning & Risk Assessment',
      status: 'In Progress',
      progress: 85,
      tasksCount: '12/14 Completed',
      leadAgent: '1.1 Risk Intelligence Agent',
      deliverables: ['Materiality Allocation', 'Risk Matrix', 'Contract Register']
    },
    {
      id: 3,
      code: '03',
      title: 'Business Processes & Controls',
      status: 'In Progress',
      progress: 68,
      tasksCount: '18/28 Active',
      leadAgent: '3.3 Revenue Agent',
      deliverables: ['Walkthrough Testing', 'Control Reliance Memo', 'FAT/SAT Samples']
    },
    {
      id: 4,
      code: '04',
      title: 'Substantive Testing & Fieldwork',
      status: 'Pending',
      progress: 35,
      tasksCount: '5/18 Started',
      leadAgent: '2.4 Evidence Mapping Agent',
      deliverables: ['Subsequent Receipts', 'Stocktake Reconciliation', 'ECL Calculation']
    },
    {
      id: 5,
      code: '05',
      title: 'Completion & Audit Opinion',
      status: 'Scheduled',
      progress: 0,
      tasksCount: '0/8 Open',
      leadAgent: '1.0 Orchestrator Agent',
      deliverables: ['Management Representation', 'Audit Report Draft', 'Partner Sign-off']
    }
  ];

  const currentStageObj = stages.find(s => s.id === selectedStage) || stages[1];

  return (
    <div className="space-y-6">
      {/* Title & Pipeline Overview Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Audit Lifecycle Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stage progression across 5 core engagement phases monitored by AI agent swarm.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded">
            Stage 02 & 03 Active
          </span>
          <span className="px-2.5 py-1 bg-blue-100 text-[#00338D] font-bold rounded">
            27 Human Decision Gates Open
          </span>
        </div>
      </div>

      {/* Interactive 5 Stage Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((st) => {
          const isSelected = st.id === selectedStage;
          let statusBadge = 'bg-slate-100 text-slate-600';
          if (st.status === 'Completed') statusBadge = 'bg-emerald-100 text-emerald-800';
          if (st.status === 'In Progress') statusBadge = 'bg-blue-100 text-[#00338D]';

          return (
            <div
              key={st.id}
              onClick={() => setSelectedStage(st.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isSelected 
                  ? 'bg-blue-50/90 border-l-4 border-l-[#00338D] border border-blue-300 shadow-2xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#00338D]">Stage {st.code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadge}`}>
                    {st.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{st.title}</h4>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{st.tasksCount}</span>
                  <span className="font-bold text-slate-700">{st.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00338D] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${st.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-[#00338D]">Stage {currentStageObj.code} Deep Dive</span>
            <h3 className="text-base font-extrabold text-slate-900">{currentStageObj.title}</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span>Lead Agent:</span>
            <span className="font-bold text-[#00338D] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
              🤖 {currentStageObj.leadAgent}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Deliverables */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
              <FileText className="w-4 h-4 text-[#00338D]" />
              <span>Key Audit Deliverables</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc">
              {currentStageObj.deliverables.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Active Controls & Decision Gates */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Quality & Independence Gates</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Rule Consistency Check</span>
                <span className="text-emerald-600 font-bold">Passed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Partner Risk Review</span>
                <span className="text-amber-600 font-bold">Pending Approval</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Data Completeness Score</span>
                <span className="text-slate-900 font-bold">92.4%</span>
              </div>
            </div>
          </div>

          {/* Agent Activity Trace */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Agent Execution Activity</span>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <p>• 09:20 CST: Risk Intelligence Agent recalculated variance margins.</p>
              <p>• 09:18 CST: Independence Check Agent verified UBO ownership tree.</p>
              <p>• 09:15 CST: Evidence Mapping Agent tied 14 contract assets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
