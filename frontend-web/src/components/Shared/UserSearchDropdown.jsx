import React from 'react';
import { Check, AtSign } from 'lucide-react';
import { shortAddr } from '../../utils/format';
import UserAvatar from './UserAvatar';

export default function UserSearchDropdown({ open, loading, items, selectedUsername, onSelect }) {
  if (!open) return null;

  return (
    <div className="absolute left-0 right-0 mt-2 rounded-[14px] border border-white/[0.09] bg-dp-bg2/95 backdrop-blur-xl overflow-hidden shadow-glow">
      {loading && (
        <div className="px-4 py-3 text-dp-text2 text-sm flex items-center gap-2">
          <span className="spinner-accent w-3.5 h-3.5" /> Searching…
        </div>
      )}

      {!loading && (!items || items.length === 0) && (
        <div className="px-4 py-3 text-dp-text3 text-sm">No users found</div>
      )}

      {!loading && items?.length > 0 && (
        <div className="max-h-[260px] overflow-auto">
          {items.map((u) => {
            const selected = (u.username || '').toLowerCase() === (selectedUsername || '').toLowerCase();
            return (
              <button
                key={u.id || u._id || u.username}
                type="button"
                onClick={() => onSelect?.(u)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-dp-surface ${
                  selected ? 'bg-dp-accent/10' : ''
                }`}
              >
                <UserAvatar user={u} size={36} />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[0.9rem] flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-dp-accent">
                      <AtSign size={16} />
                      {u.username}
                    </span>
                    {selected && <span className="text-dp-success text-xs font-bold">Selected</span>}
                  </p>
                  <p className="text-dp-text3 text-[0.75rem] font-mono truncate">
                    {shortAddr(u.walletAddress)}
                  </p>
                </div>

                <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  selected ? 'border-dp-success bg-dp-success/10 text-dp-success' : 'border-white/[0.09] text-dp-text3'
                }`}>
                  {selected ? <Check size={18} /> : '○'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

