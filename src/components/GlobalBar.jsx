import React from 'react';
import { Menu, Plus, Search, PanelRight, Sparkles } from 'lucide-react';
import { useActiveProject } from '@/lib/ActiveProjectContext';
import { useSourceImport } from '@/lib/SourceImportContext';

export default function GlobalBar({ title, onOpenNav, panelOpen, onTogglePanel }) {
  const { activeProject } = useActiveProject();
  const { openImport } = useSourceImport();
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <button
        onClick={onOpenNav}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Current context / project */}
      <div className="flex items-center gap-2.5">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">{title}</span>
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground sm:inline-flex">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: activeProject ? activeProject.color : 'hsl(var(--muted-foreground))' }}
          />
          {activeProject ? activeProject.name : 'No active project'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Quick search */}
      <button className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex">
        <Search className="h-4 w-4" strokeWidth={1.75} />
        <span>Quick search</span>
        <kbd className="ml-6 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Global add */}
      <button
        onClick={() => openImport(activeProject ? [activeProject.id] : [])}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        <span className="hidden sm:inline">Add Knowledge</span>
      </button>

      {/* AI status */}
      <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground md:flex">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>AI ready</span>
      </div>

      {/* Context panel toggle */}
      <button
        onClick={onTogglePanel}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${panelOpen ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
      >
        <PanelRight className="h-5 w-5" />
      </button>
    </header>
  );
}