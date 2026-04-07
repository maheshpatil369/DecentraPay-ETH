import React, { useEffect } from 'react';

export default function Modal({ open, title, children, onClose, footer, maxWidthClass = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className={`relative w-full ${maxWidthClass} card p-0 overflow-hidden shadow-glow fade-up`}>
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-[1.05rem] truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="btn-secondary px-3 py-2 text-sm">
            ✕
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-white/[0.07] bg-dp-bg2/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

