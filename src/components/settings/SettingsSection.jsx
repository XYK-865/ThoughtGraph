import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function SettingsSection({ title, icon: Icon, desc, open, onToggle, children }) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/40"
            >
                {Icon && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                        <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[15px] font-semibold tracking-tight">{title}</h3>
                    {desc && <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{desc}</p>}
                </div>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && <div className="border-t border-border px-4 py-4">{children}</div>}
        </div>
    );
}