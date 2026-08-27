import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, FolderKanban, Orbit, Search, Clock, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Talk', icon: MessageSquare },
  { to: '/projects', label: 'Project', icon: FolderKanban },
  { to: '/universe', label: '3D', icon: Orbit },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/timeline', label: 'Timeline', icon: Clock },
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        onClick={onClose}
      />

      <aside
        className={`fixed z-40 flex h-full w-[228px] flex-col border-r border-sidebar-border bg-sidebar-background transition-transform duration-300 md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand */}
        <div className="flex h-[60px] items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Orbit className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold tracking-tight text-foreground">
              ThoughtGraph
            </div>
            <div className="text-[11px] text-muted-foreground">Knowledge Universe</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Workspace
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : ''}`} strokeWidth={1.75} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-3">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <Settings className="h-4.5 w-4.5" strokeWidth={1.75} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}