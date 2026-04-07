import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
// import AuthContext from "../context/AuthContext";
import UserAvatar from "../components/Shared/UserAvatar";

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/send',      icon: '↑', label: 'Send'      },
  { to: '/split',     icon: '⊗', label: 'Split'     },
  { to: '/qr',        icon: '▣', label: 'QR Pay'    },
  { to: '/history',   icon: '◷', label: 'History'   },
  { to: '/profile',   icon: '◎', label: 'Profile'   },
];

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-dp-bg">
      {/* ── Sidebar ── */}
      <aside
        className={`
          sticky top-0 h-screen flex flex-col flex-shrink-0
          bg-dp-bg2 border-r border-white/[0.07]
          transition-all duration-300 overflow-hidden
          ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        `}
      >
        {/* Brand */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-3 px-[18px] py-6 border-b border-white/[0.07] hover:bg-dp-bg3 transition-colors"
        >
          <span className="text-[1.7rem] font-display font-black text-dp-accent leading-none flex-shrink-0">Ð</span>
          {!collapsed && (
            <span className="font-display font-black text-[1.05rem] bg-gradient-to-r from-dp-accent to-dp-accent2 bg-clip-text text-transparent whitespace-nowrap">
              DecentraPay
            </span>
          )}
        </button>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 p-2.5 pt-4">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-[11px] rounded-[12px]
                text-sm font-medium transition-all duration-200 overflow-hidden whitespace-nowrap
                ${isActive
                  ? 'bg-dp-accent/15 text-dp-accent'
                  : 'text-dp-text2 hover:bg-dp-bg3 hover:text-dp-text'}
              `}
            >
              <span className="text-[1.1rem] w-5 text-center flex-shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2.5 border-t border-white/[0.07] flex flex-col gap-2">
          {!collapsed && user && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-[12px] bg-dp-bg3 overflow-hidden">
              <UserAvatar user={user} size={32} />
              <div className="overflow-hidden flex-1">
                <p className="text-[0.82rem] font-semibold truncate">{user.fullName}</p>
                <p className="text-[0.72rem] text-dp-text2 truncate">@{user.username}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-[12px] text-dp-text2 text-sm hover:bg-dp-danger/10 hover:text-dp-danger transition-colors whitespace-nowrap"
          >
            <span className="flex-shrink-0">⏻</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
