import React from 'react';
import { X, PanelRightOpen } from 'lucide-react';

export default function ContextPanel({ open, onClose }) {
    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                onClick={onClose}
            />

            <aside
                className={`fixed right-0 top-0 z-50 flex h-full w-[340px] flex-col border-l border-border bg-card lg:static lg:z-auto lg:transition-[width,opacity] ${open ? 'lg:w-[340px] lg:opacity-100' : 'lg:w-0 lg:opacity-0 lg:pointer-events-none'
                    } ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Context
                    </span>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <PanelRightOpen className="h-7 w-7 text-muted-foreground/50" />
                    <p className="text-[13px] text-muted-foreground">
                        Select a node, source, or asset to inspect its details and evidence here.
                    </p>
                </div>
            </aside>
        </>
    );
}