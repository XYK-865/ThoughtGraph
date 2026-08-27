import React, { useEffect, useMemo, useState } from 'react';
import { Clock, FileText, Sparkles, Network, Boxes, FolderKanban, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format, subDays, isAfter } from 'date-fns';
import { base44 } from '@/api/base44Client';

const RANGES = [
  { key: 'day', label: 'Day', days: 1 },
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'year', label: 'Year', days: 365 },
  { key: 'all', label: 'All', days: null },
];

const TYPE_META = {
  source: { icon: FileText, color: 'text-foreground', to: (e) => `/sources/${e.id}` },
  asset: { icon: Sparkles, color: 'text-primary', to: (e) => (e.sourceId ? `/sources/${e.sourceId}` : null) },
  node: { icon: Boxes, color: 'text-chart-4', to: () => '/universe' },
  edge: { icon: Network, color: 'text-chart-3', to: () => '/universe' },
  project: { icon: FolderKanban, color: 'text-chart-2', to: (e) => `/projects/${e.id}` },
};

function describe(e) {
  switch (e._type) {
    case 'source':
      return `Source imported — ${e.title}`;
    case 'asset':
      return `Knowledge asset extracted${e.entities?.length ? ` — ${e.entities[0]}` : ''}`;
    case 'node':
      return `New graph node — ${e.label}`;
    case 'edge':
      return `New relation — ${e.fromLabel || '?'} ${e.relation || '→'} ${e.toLabel || '?'}`;
    case 'project':
      return `Project created — ${e.name}`;
    default:
      return 'Activity';
  }
}

export default function Timeline() {
  const [range, setRange] = useState('week');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sources, assets, nodes, edges, projects] = await Promise.all([
          base44.entities.Source.list('-created_date', 100),
          base44.entities.KnowledgeAsset.list('-created_date', 100),
          base44.entities.GraphNode.list('-created_date', 100),
          base44.entities.GraphEdge.list('-created_date', 100),
          base44.entities.Project.list('-created_date', 100),
        ]);
        const all = [
          ...sources.map((s) => ({ ...s, _type: 'source' })),
          ...assets.map((a) => ({ ...a, _type: 'asset' })),
          ...nodes.map((n) => ({ ...n, _type: 'node' })),
          ...edges.map((e) => ({ ...e, _type: 'edge' })),
          ...projects.map((p) => ({ ...p, _type: 'project' })),
        ];
        setEvents(all);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range);
    if (!cfg.days) return events.slice().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const cutoff = subDays(new Date(), cfg.days);
    return events
      .filter((e) => isAfter(new Date(e.created_date), cutoff))
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [events, range]);

  // group by day
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((e) => {
      const key = format(new Date(e.created_date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-7 flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Timeline</h1>
            <p className="text-[14px] text-muted-foreground">How your knowledge has formed over time.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${range === r.key ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">Loading activity…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.25} />
            <p className="text-[13.5px] text-muted-foreground">No activity in this range yet.</p>
          </div>
        ) : (
          <div className="mt-7 space-y-6">
            {groups.map(([day, items]) => (
              <div key={day}>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {format(new Date(day), 'MMM d, yyyy')}
                </p>
                <div className="space-y-1">
                  {items.map((e, i) => {
                    const meta = TYPE_META[e._type];
                    const Icon = meta.icon;
                    const to = meta.to(e);
                    const body = (
                      <div className="flex flex-1 gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card ${meta.color}`}>
                            <Icon className="h-4 w-4" strokeWidth={1.6} />
                          </div>
                          {i < items.length - 1 && <div className="w-px flex-1 bg-border" />}
                        </div>
                        <div className="flex-1 pb-5">
                          <p className="text-[14px] leading-snug text-foreground">{describe(e)}</p>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {formatDistanceToNow(new Date(e.created_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                    return to ? (
                      <Link key={e.id} to={to} className="flex items-stretch rounded-lg transition-colors hover:bg-accent/40">
                        {body}
                      </Link>
                    ) : (
                      <div key={e.id}>{body}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
