import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Boxes, Network, Sparkles, Plus, FileText as NoteIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useActiveProject } from '@/lib/ActiveProjectContext';
import { useSourceImport } from '@/lib/SourceImportContext';

const metrics = [
  { key: 'sources', label: 'Sources', icon: FileText },
  { key: 'assets', label: 'Assets', icon: Sparkles },
  { key: 'nodes', label: 'Nodes', icon: Boxes },
  { key: 'relations', label: 'Relations', icon: Network },
];

const typeLabel = { note: 'Note', text: 'Text', file: 'File', markdown: 'MD', url: 'URL' };

export default function ProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveProjectId } = useActiveProject();
  const { openImport } = useSourceImport();
  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [assets, setAssets] = useState([]);
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) setActiveProjectId(id);
  }, [id, setActiveProjectId]);

  const loadProject = useCallback(() => {
    setLoading(true);
    base44.entities.Project
      .get(id)
      .then((p) => (p ? setProject(p) : setNotFound(true)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const loadSources = useCallback(async () => {
    try {
      const list = await base44.entities.Source.filter({ projectIds: id }, '-created_date', 20);
      setSources(list);
    } catch {
      setSources([]);
    }
  }, [id]);

  const loadAssets = useCallback(async () => {
    try {
      const list = await base44.entities.KnowledgeAsset.filter({ projectIds: id }, '-created_date', 50);
      setAssets(list);
    } catch {
      setAssets([]);
    }
  }, [id]);

  const loadGraph = useCallback(async () => {
    try {
      const [nodes, edges] = await Promise.all([
        base44.entities.GraphNode.filter({ projectId: id }, '-created_date', 200),
        base44.entities.GraphEdge.filter({ projectId: id }, '-created_date', 200)
      ]);
      setGraphNodes(nodes);
      setGraphEdges(edges);
    } catch {
      setGraphNodes([]);
      setGraphEdges([]);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
    loadSources();
    loadAssets();
    loadGraph();
  }, [loadProject, loadSources, loadAssets, loadGraph]);

  useEffect(() => {
    const handler = () => loadSources();
    window.addEventListener('tg:source-changed', handler);
    return () => window.removeEventListener('tg:source-changed', handler);
  }, [loadSources]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[13px]">Loading project…</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-[14px] text-muted-foreground">Project not found.</p>
        <button onClick={() => navigate('/projects')} className="text-[13px] text-primary hover:underline">
          Back to library
        </button>
      </div>
    );
  }

  const counts = { sources: sources.length, assets: assets.length, nodes: graphNodes.length, relations: graphEdges.length };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <button
          onClick={() => navigate('/projects')}
          className="mb-5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to library
        </button>

        <div className="mb-7 flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1"
            style={{
              backgroundColor: `${project.color}1a`,
              color: project.color,
              boxShadow: `inset 0 0 0 1px ${project.color}33`,
            }}
          >
            <Boxes className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-[14px] text-muted-foreground">{project.description}</p>
            )}
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
            {project.status}
          </span>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.key} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <m.icon className="h-4 w-4" strokeWidth={1.6} />
                <span className="text-[12px]">{m.label}</span>
              </div>
              <div className="font-display text-2xl font-semibold tracking-tight">{counts[m.key]}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
            <h3 className="mb-3 font-display text-[14px] font-semibold tracking-tight">Core Topics</h3>
            {project.coreThemes?.length ? (
              <div className="flex flex-wrap gap-2">
                {project.coreThemes.map((t, i) => (
                  <span key={i} className="rounded-full bg-accent px-3 py-1 text-[12px] text-foreground">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Core topics will emerge as you add sources and the system analyzes them.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[14px] font-semibold tracking-tight">Recent Sources</h3>
            </div>
            {sources.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <FileText className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.25} />
                <p className="text-[12.5px] text-muted-foreground">No sources imported yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {sources.map((s) => (
                  <Link
                    key={s.id}
                    to={`/sources/${s.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
                  >
                    <NoteIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.6} />
                    <span className="flex-1 truncate text-[12.5px]">{s.title}</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(s.created_date), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <button
              onClick={() => openImport([project.id])}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-[12.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Knowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}