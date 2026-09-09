import React from 'react';
import { NavTab } from '../types';
import { ArrowUpRight, RefreshCw } from 'lucide-react';

interface HeaderMetricsProps {
  activeTab: NavTab;
  onRefresh?: () => void;
}

export const HeaderMetrics: React.FC<HeaderMetricsProps> = ({ activeTab, onRefresh }) => {
  if (activeTab === 'overview') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Planning Materiality */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Planning Materiality</div>
            <div className="text-xl font-bold text-slate-900 mt-1">CNY 12.6m</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">5.8% of profit before tax</div>
        </div>

        {/* Overall Audit Progress */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Progress</div>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span>68.5%</span>
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                68%
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Overall audit lifecycle completion</div>
        </div>

        {/* Alert Closure */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between relative">
          <div className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Alert Closure</div>
            <div className="text-xl font-bold text-slate-900 mt-1">20/28</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">8 significant alerts linked to Lifecycle 02 Fraud & JE</div>
        </div>

        {/* Human Gate Queue */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between relative">
          <div className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Human Gate Queue</div>
            <div className="text-xl font-bold text-slate-900 mt-1">5/32</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">27 human decision gates open</div>
        </div>
      </div>
    );
  }

  if (activeTab === 'objectives') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Total Substantive Procedures */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Substantive Procedures</div>
            <div className="text-xl font-bold text-slate-900 mt-1">156 Procedures</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">across 10 business processes</div>
        </div>

        {/* WP Upload Rate */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">WP Upload Rate</div>
            <div className="text-xl font-bold text-slate-900 mt-1">82.1%</div>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">128 / 156 uploaded to KCW</div>
        </div>

        {/* Inspection Pass Rate */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Inspection Pass Rate</div>
            <div className="text-xl font-bold text-slate-900 mt-1">91.5%</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">117 passed / 11 failed verification</div>
        </div>

        {/* Planning Materiality */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Planning Materiality</div>
            <div className="text-xl font-bold text-[#00338D] mt-1">CNY 12.6M</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">5.8% of profit before tax</div>
        </div>
      </div>
    );
  }

  if (activeTab === 'collaboration') {
    return (
      <div className="mb-4">
        {/* Top Readiness Bar Container */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs mb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">PBC Evidence Readiness</div>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">82%</span>
                <span className="text-xs text-slate-500">41 / 50 requested items received</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span>Last update: 2026-06-12 09:20 CST</span>
              <button 
                onClick={onRefresh}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 via-sky-500 via-blue-600 to-[#00338D] h-2 rounded-full w-[82%] transition-all duration-500 shadow-xs"></div>
          </div>
        </div>

        {/* 7 Metric Count Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] text-slate-500 font-medium">Request</div>
            <div className="text-lg font-bold text-slate-900">50</div>
            <div className="text-[9px] text-slate-400 truncate">PBC items requested</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] text-slate-500 font-medium">Submitted</div>
            <div className="text-lg font-bold text-slate-900">41</div>
            <div className="text-[9px] text-slate-400 truncate">Client files uploaded</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] text-slate-500 font-medium">Validating</div>
            <div className="text-lg font-bold text-slate-900">12</div>
            <div className="text-[9px] text-slate-400 truncate">AI validation queue</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] text-slate-500 font-medium">Second-request</div>
            <div className="text-lg font-bold text-slate-900">9</div>
            <div className="text-[9px] text-slate-400 truncate">Comments sent</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] text-slate-500 font-medium">Accepted</div>
            <div className="text-lg font-bold text-slate-900">20</div>
            <div className="text-[9px] text-slate-400 truncate">Reviewer accepted</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] text-slate-500 font-medium">Cleansing</div>
            <div className="text-lg font-bold text-slate-900">17</div>
            <div className="text-[9px] text-slate-400 truncate">Data rules running</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] text-slate-500 font-medium">Archived</div>
            <div className="text-lg font-bold text-slate-900">20</div>
            <div className="text-[9px] text-slate-400 truncate">Ready for tie-out</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Overall Health</div>
        <div className="text-xl font-bold text-slate-900 mt-1">94.2%</div>
        <div className="text-[11px] text-slate-500 mt-1">All audit agents online</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active Procedures</div>
        <div className="text-xl font-bold text-slate-900 mt-1">28 / 28</div>
        <div className="text-[11px] text-slate-500 mt-1">Coverage across 10 processes</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active Agents</div>
        <div className="text-xl font-bold text-slate-900 mt-1">12 Swarm</div>
        <div className="text-[11px] text-slate-500 mt-1">Autonomous verification active</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Next Sync</div>
        <div className="text-xl font-bold text-slate-900 mt-1">09:30 CST</div>
        <div className="text-[11px] text-slate-500 mt-1">Real-time ledger pipeline</div>
      </div>
    </div>
  );
};
