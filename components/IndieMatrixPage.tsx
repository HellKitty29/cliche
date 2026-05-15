import React from 'react';

export default function IndieMatrixPage() {
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <iframe
          title="Audit Inventory Matrix"
          src="/indie/index.html"
          className="w-full h-[calc(100vh-190px)] min-h-[720px] border-0"
        />
      </div>
    </div>
  );
}

