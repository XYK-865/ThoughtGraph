import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import GlobalBar from '@/components/GlobalBar';
import ContextPanel from '@/components/ContextPanel';
import { ActiveProjectProvider } from '@/lib/ActiveProjectContext';
import { SourceImportProvider } from '@/lib/SourceImportContext';

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const location = useLocation();

  const pageTitles = {
    '/': 'Talk',
    '/projects': 'Project',
    '/universe': 'Universe',
    '/search': 'Search',
    '/timeline': 'Timeline',
    '/settings': 'Settings',
  };
  const activeTitle = pageTitles[location.pathname] || 'ThoughtGraph';

  return (
    <ActiveProjectProvider>
      <SourceImportProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
          <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

          <div className="flex flex-1 flex-col min-w-0">
            <GlobalBar
              title={activeTitle}
              onOpenNav={() => setMobileNavOpen(true)}
              panelOpen={panelOpen}
              onTogglePanel={() => setPanelOpen((v) => !v)}
            />
            <main className="flex-1 min-h-0 overflow-hidden">
              <Outlet />
            </main>
          </div>

          <ContextPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </div>
      </SourceImportProvider>
    </ActiveProjectProvider>
  );
}