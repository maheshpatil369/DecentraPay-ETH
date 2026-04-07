import React from 'react';

export default function SuccessPulse({ title = 'Success', subtitle }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-dp-success/20 blur-xl animate-pulse" />
        <div className="w-16 h-16 rounded-full border-2 border-dp-success bg-dp-success/10 flex items-center justify-center text-2xl text-dp-success relative">
          ✓
        </div>
      </div>
      <div>
        <p className="text-[1.35rem] font-display font-bold">{title}</p>
        {subtitle && <p className="text-dp-text2 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

