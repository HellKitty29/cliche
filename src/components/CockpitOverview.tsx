import React, { useState } from 'react';
import { 
  riskFocusRows as initialRiskRows, 
  metricVariances 
} from '../data/mockData';
import { RiskFocusRow } from '../types';
import { 
  Bot, 
  MoreHorizontal, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight 
} from 'lucide-react';

interface CockpitOverviewProps {
  onReviewRisk: (row: RiskFocusRow) => void;
}

export const CockpitOverview: React.FC<CockpitOverviewProps> = ({ onReviewRisk }) => {
  const [riskRows] = useState<RiskFocusRow[]>(initialRiskRows);

  return (
    <div className="space-y-6">
      {/* Industry Risk Analysis Header & Agent Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-lg shadow-2xs">
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-slate-900">Industry Risk Analysis</h2>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-[#00338D] rounded">
            AGENT STATUS
          </span>
        </div>

        {/* Agent Cards */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1.1 Risk Intelligence Agent */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md text-xs">
            <Bot className="w-3.5 h-3.5 text-[#00338D]" />
            <div>
              <div className="font-semibold text-slate-800 text-[11px]">1.1 Risk Intelligence Agent</div>
              <div className="text-[9px] text-slate-400">Update: 2026-06-05 09:20 CST</div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 pl-1">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1.2 Independence Check Agent */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md text-xs">
            <Bot className="w-3.5 h-3.5 text-[#00338D]" />
            <div>
              <div className="font-semibold text-slate-800 text-[11px]">1.2 Independence Check Agent</div>
              <div className="text-[9px] text-slate-400">Update: 2026-06-05 09:18 CST</div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 pl-1">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1.3 Audit Collaboration Hub */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md text-xs">
            <Bot className="w-3.5 h-3.5 text-[#00338D]" />
            <div>
              <div className="font-semibold text-slate-800 text-[11px]">1.3 Audit Collaboration Hub</div>
              <div className="text-[9px] text-slate-400">Update: 2026-06-05 09:16 CST</div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 pl-1">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh Button */}
          <button className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Part A - Entity & Industry Understanding */}
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Part A - Entity & Industry Understanding
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Revenue */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Revenue (Audit Year)</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">CNY 4.28bn</div>
            </div>
            <div className="text-xs font-semibold text-red-600 flex items-center space-x-1 mt-4">
              <TrendingUp className="w-3.5 h-3.5 text-red-500" />
              <span>↑ 16.9%</span>
              <span className="text-slate-400 font-normal">vs prior year</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Net Profit</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">CNY 290m</div>
            </div>
            <div className="text-xs font-semibold text-red-600 flex items-center space-x-1 mt-4">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span>↓ 4.8%</span>
              <span className="text-slate-400 font-normal">vs prior year</span>
            </div>
          </div>

          {/* Total Assets */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Assets</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">CNY 7.35bn</div>
            </div>
            <div className="text-xs font-semibold text-red-600 flex items-center space-x-1 mt-4">
              <TrendingUp className="w-3.5 h-3.5 text-red-500" />
              <span>↑ 12.6%</span>
              <span className="text-slate-400 font-normal">vs prior year</span>
            </div>
          </div>

          {/* 2024 VS INDUSTRY AVERAGE */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                2024 VS INDUSTRY AVERAGE
              </span>
              <span className="text-[10px] font-bold text-slate-800">Key Metric Variance</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {metricVariances.map((mv, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center gap-1">
                  <span className="col-span-3 text-slate-700 font-medium truncate">{mv.metric}</span>
                  <div className="col-span-6 space-y-0.5">
                    {/* Aurora Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#00338D] h-1.5 rounded-full" 
                        style={{ width: `${mv.auroraBarPct}%` }}
                      ></div>
                    </div>
                    {/* Industry Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-slate-300 h-1.5 rounded-full" 
                        style={{ width: `${mv.industryBarPct}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="col-span-3 text-right text-slate-500 text-[10px] font-mono">{mv.valDisplay}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-[10px] text-slate-500 pt-2 border-t border-slate-100 mt-2">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-[#00338D] rounded-xs inline-block"></span>
                <span>Aurora Robotics</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-slate-300 rounded-xs inline-block"></span>
                <span>Industry Average</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part B - Industry Risk Focus */}
      <div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Part B - Industry Risk Focus
        </h3>

        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <th className="py-2.5 px-3 min-w-[130px]">Risk</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Risk Focus</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Original risk level</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Risk Drift</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Audit Impact</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Human Action</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Related Objective</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {riskRows.map((row) => {
                  let driftColor = 'text-amber-600';
                  let driftBadgeBg = 'bg-amber-500';
                  if (row.driftStatus === 'Escalating' || row.driftStatus === 'Critical') {
                    driftColor = 'text-red-600';
                    driftBadgeBg = 'bg-red-500';
                  } else if (row.driftStatus === 'Stable') {
                    driftColor = 'text-emerald-600';
                    driftBadgeBg = 'bg-emerald-500';
                  }

                  let origMarkerBg = 'bg-amber-500';
                  if (row.originalRiskLevel === 'High') origMarkerBg = 'bg-red-500';
                  if (row.originalRiskLevel === 'Low') origMarkerBg = 'bg-slate-400';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Risk Category */}
                      <td className="py-3 px-3 font-semibold text-slate-900 align-top">
                        {row.riskCategory}
                      </td>

                      {/* Risk Focus */}
                      <td className="py-3 px-3 text-slate-600 leading-snug align-top">
                        {row.riskFocus}
                      </td>

                      {/* Original Risk Level */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center space-x-2">
                          <span className={`w-1.5 h-4 rounded-xs ${origMarkerBg}`}></span>
                          <span className="font-semibold text-slate-800">{row.originalRiskLevel}</span>
                        </div>
                      </td>

                      {/* Risk Drift */}
                      <td className="py-3 px-3 align-top space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center space-x-1">
                            <span>{row.riskDriftFrom}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span>{row.riskDriftTo}</span>
                          </div>
                          <span className={`text-[11px] font-bold ${driftColor}`}>
                            • {row.driftStatus}
                          </span>
                        </div>
                        {/* Track visualization */}
                        <div className="w-full bg-slate-100 h-1 rounded-full relative">
                          <div className={`h-1 rounded-full ${driftBadgeBg} w-3/4`}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                          {row.driftDescription}
                        </p>
                      </td>

                      {/* Audit Impact */}
                      <td className="py-3 px-3 align-top">
                        <ul className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                          {row.auditImpact.map((item, idx) => (
                            <li key={idx} className="flex items-start space-x-1">
                              <span className="text-[#00338D] font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* Human Action */}
                      <td className="py-3 px-3 align-top space-y-1">
                        <div className="text-[11px] font-bold text-slate-900">
                          {row.humanActionRole} <span className="font-normal text-slate-500">{row.humanActionStatus}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {row.humanActionNote}
                        </p>
                        <button
                          onClick={() => onReviewRisk(row)}
                          className="mt-1 px-3 py-0.5 bg-white border border-blue-300 hover:border-[#00338D] text-[#00338D] text-[11px] font-semibold rounded hover:bg-blue-50 transition-colors shadow-2xs"
                        >
                          Review
                        </button>
                      </td>

                      {/* Related Objective */}
                      <td className="py-3 px-3 align-top">
                        <a href="#objective" className="text-[#00338D] font-semibold hover:underline text-[11px] block">
                          {row.relatedObjective}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
