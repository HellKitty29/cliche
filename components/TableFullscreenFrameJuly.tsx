/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useState } from 'react';
import { Minimize2 } from 'lucide-react';

type TableFullscreenFrameProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  fullscreenClassName?: string;
  showFullscreenButton?: boolean;
  headerActions?: ReactNode;
};

export default function TableFullscreenFrame({
  title = 'Table',
  children,
  className,
  fullscreenClassName,
  showFullscreenButton = true,
  headerActions,
}: TableFullscreenFrameProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div className={`group/table-fullscreen relative ${className ?? ''}`}>
        <div className="absolute right-0 top-[-28px] z-20 flex items-center gap-2">
          {showFullscreenButton && (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="rounded border border-gray-200 bg-gray-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gray-500 opacity-0 shadow-sm transition hover:border-gray-300 hover:bg-gray-200 hover:text-gray-700 group-hover/table-fullscreen:opacity-100"
              aria-label={`${title} full page`}
            >
              full page
            </button>
          )}
          {headerActions}
        </div>
        {children}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm">
          <div className="flex h-full w-full flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500">Full page view</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-500 hover:text-blue-600"
                title="Exit full page"
                aria-label="Exit full page"
              >
                <Minimize2 size={16} />
              </button>
            </div>
            <div className={`min-h-0 flex-1 overflow-auto px-4 py-4 ${fullscreenClassName ?? ''}`}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
