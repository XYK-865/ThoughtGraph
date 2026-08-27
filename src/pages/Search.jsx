import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ResultItem from '@/components/search/ResultItem';

const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'source', label: 'Sources' },
    { key: 'asset', label: 'Assets' },
    { key: 'node', label: 'Nodes' },
    { key: 'project', label: 'Projects' },
];

const has = (text, q) => (text || '').toLowerCase().includes(q);

export default function Search() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [data, setData] = useState({ source: [], asset: [], node: [], project: [] });
    const [loading, setLoading] = useState(true);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        (async () => {
            try {
                const [sources, assets, nodes, projects] = await Promise.all([
                    base44.entities.Source.list('-created_date', 200),
                    base44.entities.KnowledgeAsset.list('-created_date', 200),
                    base44.entities.GraphNode.list('-created_date', 200),
                    base44.entities.Project.list('-updated_date', 200),
                ]);
                setData({ source: sources, asset: assets, node: nodes, project: projects });
            } catch {
                setData({ source: [], asset: [], node: [], project: [] });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        const sourceMatches = data.source
            .filter((s) => has(s.title, q) || has(s.content, q) || (s.tags || []).some((t) => has(t, q)))
            .map((s) => ({ ...s, _type: 'source', _title: s.title, _subtitle: s.tags?.join(' · ') || `${s.wordCount} words` }));

        const assetMatches = data.asset
            .filter(
                (a) =>
                    has(a.summary, q) ||
                    (a.keyPoints || []).some((p) => has(p, q)) ||
                    (a.tags || []).some((t) => has(t, q)) ||
                    (a.entities || []).some((e) => has(e, q))
            )
            .map((a) => ({ ...a, _type: 'asset', _title: a.entities?.[0] || 'Asset', _subtitle: a.summary?.slice(0, 90) }));

        const nodeMatches = data.node
            .filter((n) => has(n.label, q) || has(n.entityType, q))
            .map((n) => ({ ...n, _type: 'node', _title: n.label, _subtitle: n.entityType }));

        const projectMatches = data.project
            .filter((p) => has(p.name, q) || has(p.description, q) || (p.coreThemes || []).some((t) => has(t, q)))
            .map((p) => ({ ...p, _type: 'project', _title: p.name, _subtitle: p.description || p.coreThemes?.join(' · ') }));

        let all = [...sourceMatches, ...assetMatches, ...nodeMatches, ...projectMatches];
        if (category !== 'all') all = all.filter((r) => r._type === category);
        return all.slice(0, 60);
    }, [query, category, data]);

    const counts = useMemo(() => {
        const c = { all: 0, source: 0, asset: 0, node: 0, project: 0 };
        if (!query.trim()) return c;
        const q = query.trim().toLowerCase();
        c.source = data.source.filter((s) => has(s.title, q) || has(s.content, q) || (s.tags || []).some((t) => has(t, q))).length;
        c.asset = data.asset.filter((a) => has(a.summary, q) || (a.keyPoints || []).some((p) => has(p, q)) || (a.tags || []).some((t) => has(t, q)) || (a.entities || []).some((e) => has(e, q))).length;
        c.node = data.node.filter((n) => has(n.label, q) || has(n.entityType, q)).length;
        c.project = data.project.filter((p) => has(p.name, q) || has(p.description, q) || (p.coreThemes || []).some((t) => has(t, q))).length;
        c.all = c.source + c.asset + c.node + c.project;
        return c;
    }, [query, data]);

    return (
        <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-3xl px-6 py-8">
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 focus-within:border-primary/40">
                    <SearchIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search across sources, assets, nodes, projects…"
                        className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                    <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                        ⌘K
                    </kbd>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setCategory(cat.key)}
                            disabled={!query.trim()}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors disabled:opacity-40 ${category === cat.key ? 'bg-accent text-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {cat.label}
                            {query.trim() && <span className="text-[10px] text-muted-foreground/70">{counts[cat.key]}</span>}
                        </button>
                    ))}
                </div>

                {!query.trim() ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <SearchIcon className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.25} />
                        <p className="max-w-xs text-[13.5px] text-muted-foreground">
                            Search unifies titles, full text, summaries, entities, and graph nodes across your knowledge universe.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[13px]">Indexing your knowledge…</span>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <SearchIcon className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.25} />
                        <p className="text-[13.5px] text-muted-foreground">No results for “{query}”.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {results.map((r) => (
                            <ResultItem key={r._type + r.id} item={r} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}