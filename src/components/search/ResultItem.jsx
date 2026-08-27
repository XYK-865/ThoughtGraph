import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Boxes, FolderKanban } from 'lucide-react';

const TYPE_META = {
    source: { icon: FileText, color: 'text-foreground', to: (r) => `/sources/${r.id}` },
    asset: { icon: Sparkles, color: 'text-primary', to: (r) => `/sources/${r.sourceId}` },
    node: { icon: Boxes, color: 'text-chart-4', to: () => `/universe` },
    project: { icon: FolderKanban, color: 'text-chart-3', to: (r) => `/projects/${r.id}` },
};

export default function ResultItem({ item }) {
    const meta = TYPE_META[item._type];
    const Icon = meta.icon;

    return (
        <Link
            to={meta.to(item)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
        >
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent ${meta.color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-foreground">{item._title}</span>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {item._type}
                    </span>
                </div>
                {item._subtitle && (
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">{item._subtitle}</p>
                )}
            </div>
        </Link>
    );
}