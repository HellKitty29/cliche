/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuditObjectives } from './components/AuditObjectives';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-blue-200">
      <main className="w-full min-h-screen p-3 md:p-5 max-w-[1800px] mx-auto">
        <AuditObjectives />
      </main>
    </div>
  );
}

