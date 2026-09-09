import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle, 
  Activity, 
  Sliders 
} from 'lucide-react';

export const AgentOrchestra: React.FC = () => {
  const [agents, setAgents] = useState([
    { id: '1.0', name: 'Orchestrator Swarm Agent', category: 'Master Controller', status: 'Active', latency: '42ms', accuracy: '99.8%', executionCount: 1420 },
    { id: '1.1', name: 'Risk Intelligence Agent', category: 'Risk & Strategy', status: 'Active', latency: '120ms', accuracy: '98.5%', executionCount: 890 },
    { id: '1.2', name: 'Independence Check Agent', category: 'Ethics & Compliance', status: 'Active', latency: '65ms', accuracy: '100%', executionCount: 450 },
    { id: '2.1', name: 'PBC Request Agent', category: 'Collaboration Hub', status: 'Active', latency: '85ms', accuracy: '97.2%', executionCount: 2100 },
    { id: '2.2', name: 'PBC Validation Agent', category: 'Collaboration Hub', status: 'Active', latency: '140ms', accuracy: '96.8%', executionCount: 1850 },
    { id: '2.3', name: 'Data Cleansing Agent', category: 'Data Processing', status: 'Active', latency: '210ms', accuracy: '99.1%', executionCount: 3400 },
    { id: '2.4', name: 'Evidence Mapping Agent', category: 'Data Processing', status: 'Active', latency: '110ms', accuracy: '98.0%', executionCount: 1290 },
    { id: '3.3', name: 'Revenue Agent', category: 'Domain Specialist', status: 'Active', latency: '95ms', accuracy: '99.4%', executionCount: 2780 },
    { id: '3.10', name: 'Estimate & Valuation Agent', category: 'Domain Specialist', status: 'Active', latency: '180ms', accuracy: '95.9%', executionCount: 640 },
    { id: '4.1', name: 'Control Reliance Agent', category: 'Testing & Control', status: 'Paused', latency: '0ms', accuracy: '98.2%', executionCount: 510 }
  ]);

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'Active' ? 'Paused' : 'Active' };
      }
      return a;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-[#00338D] flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">AI Agent Orchestra & Swarm Control</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous multi-agent architecture powered by Gemini AI with deterministic audit guardrails.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-[#00338D] text-white text-xs font-semibold rounded shadow-2xs hover:bg-blue-900 transition-colors flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Run Swarm Verification</span>
          </button>
        </div>
      </div>

      {/* Agents Topology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((ag) => (
          <div key={ag.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-[#00338D] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  Agent {ag.id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  ag.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {ag.status}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Bot className="w-4 h-4 text-[#00338D]" />
                <span>{ag.name}</span>
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{ag.category}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div>
                <div className="text-slate-400">Latency</div>
                <div className="font-bold text-slate-800">{ag.latency}</div>
              </div>
              <div>
                <div className="text-slate-400">Accuracy</div>
                <div className="font-bold text-emerald-600">{ag.accuracy}</div>
              </div>
              <div>
                <div className="text-slate-400">Traces</div>
                <div className="font-bold text-slate-800">{ag.executionCount}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => toggleAgent(ag.id)}
                className="w-full py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center justify-center space-x-1"
              >
                {ag.status === 'Active' ? <Pause className="w-3 h-3 text-amber-600" /> : <Play className="w-3 h-3 text-emerald-600" />}
                <span>{ag.status === 'Active' ? 'Pause Agent' : 'Resume Agent'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
