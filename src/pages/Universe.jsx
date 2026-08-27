import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Orbit, Boxes, X, MousePointerClick } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useActiveProject } from '@/lib/ActiveProjectContext';
import UniverseGraph from '@/components/universe/UniverseGraph';

export default function Universe() {
  const { activeProject, activeProjectId } = useActiveProject();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    if (!activeProjectId) {
      setNodes([]);
      setEdges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSelected(null);
    try {
      const [n, e] = await Promise.all([
        base44.entities.GraphNode.filter({ projectId: activeProjectId }, '-created_date', 200),
        base44.entities.GraphEdge.filter({ projectId: activeProjectId }, '-created_date', 200),
      ]);
      setNodes(n);
      setEdges(e);
    } catch {
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const related = selected
    ? edges
      .filter((e) => e.fromNodeId === selected.id || e.toNodeId === selected.id)
      .map((e) => {
        const otherId = e.fromNodeId === selected.id ? e.toNodeId : e.fromNodeId;
        const node = nodes.find((x) => x.id === otherId);
        if (!node) return null;
        return {
          node,
          relation: e.relation,
          dir: e.fromNodeId === selected.id ? 'out' : 'in',
        };
      })
      .filter(Boolean)
    : [];

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-chart-4/10 blur-[100px]" />
      </div>

      {/* header */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/40 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Orbit className="h-4.5 w-4.5 text-primary" />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            {activeProject ? activeProject.name : 'Personal Knowledge Universe'}
          </span>
          {activeProject && !loading && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {nodes.length} nodes · {edges.length} relations
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!activeProject && (
            <Link to="/projects" className="text-[12px] text-primary hover:underline">
              Choose a project →
            </Link>
          )}
          <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
            <MousePointerClick className="h-3.5 w-3.5" /> Drag to orbit · click a node
          </span>
        </div>
      </div>

      {/* canvas */}
      <div className="absolute inset-0">
        {!activeProject ? (
          <EmptyState
            icon={<Boxes className="h-9 w-9 text-primary" strokeWidth={1.4} />}
            title="No active project"
            text="Select a project from the library to visualize its knowledge graph here."
            cta
          />
        ) : loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-[13px]">Rendering universe…</span>
          </div>
        ) : nodes.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-9 w-9 text-muted-foreground/60" strokeWidth={1.4} />}
            title="Graph is empty"
            text="Build a graph first — open a source, extract an asset, then run Build Graph from Asset."
          />
        ) : (
          <UniverseGraph nodes={nodes} edges={edges} onSelect={setSelected} selectedId={selected?.id} />
        )}
      </div>

      {/* selected node overlay */}
      {selected && (
        <div className="absolute right-4 top-16 z-20 w-72 rounded-xl border border-border bg-card/95 p-4 backdrop-blur-md">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${selected.kind === 'keypoint' ? 'bg-chart-4/15 text-chart-4' : 'bg-primary/15 text-primary'
                  }`}
              >
                {selected.kind}
              </span>
              <h3 className="mt-1.5 font-display text-[15px] font-semibold leading-tight">{selected.label}</h3>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {selected.entityType && selected.entityType !== 'concept' && (
            <p className="mb-2 text-[11px] text-muted-foreground">{selected.entityType}</p>
          )}
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Relations</p>
            {related.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No relations recorded.</p>
            ) : (
              <ul className="space-y-1.5">
                {related.map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[12px]">
                    <span className="shrink-0 text-muted-foreground">
                      {r.dir === 'out' ? '→' : '←'} {r.relation}
                    </span>
                    <span className="truncate text-foreground/90">{r.node.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* legend */}
      {activeProject && !loading && nodes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-lg border border-border bg-card/80 px-3 py-2 backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" /> Entity
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-chart-4" /> Key point
          </span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, text, cta }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">{text}</p>
      </div>
      {cta && (
        <Link
          to="/projects"
          className="mt-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to projects
        </Link>
      )}
    </div>
  );
}