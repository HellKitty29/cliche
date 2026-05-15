/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import InventoryMatrix from './components/InventoryMatrix.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Title Section matching Image 1 */}
        <header className="flex items-center gap-4 border-l-4 border-[#003399] pl-4 py-1">
          <h1 className="text-2xl font-bold tracking-tight">矩阵</h1>
        </header>

        {/* Matrix Component Wrapper */}
        <main className="space-y-4">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <InventoryMatrix />
          </div>
          
          <footer className="pt-8 text-xs text-slate-400 flex justify-between items-center px-2">
            <p>© 2026 Audit Inventory Matrix System</p>
            <div className="flex gap-4">
              <span>Page 1</span>
              <span className="font-mono">VER. 1.0.4</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
