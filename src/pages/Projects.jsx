import React, { useEffect, useState } from 'react';
import { Plus, FolderKanban, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProjectCard from '@/components/projects/ProjectCard';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';

export default function Projects() {
    const [projects, setProjects] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const load = async () => {
        try {
            const list = await base44.entities.Project.list('-updated_date', 100);
            setProjects(list);
        } catch (err) {
            setProjects([]);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-5xl px-6 py-8">
                <div className="mb-7 flex items-end justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight">Project Library</h1>
                        <p className="mt-1 text-[14px] text-muted-foreground">
                            Each project is an independent knowledge universe.
                        </p>
                    </div>
                    <button
                        onClick={() => setDialogOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.25} />
                        New Project
                    </button>
                </div>

                {projects === null ? (
                    <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[13px]">Loading projects…</span>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                            <FolderKanban className="h-7 w-7 text-primary" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="font-display text-[16px] font-semibold">No projects yet</h3>
                            <p className="max-w-xs text-[13px] text-muted-foreground">
                                Create your first project to start building a knowledge universe around a topic.
                            </p>
                        </div>
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.25} />
                            New Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((p) => (
                            <ProjectCard key={p.id} project={p} />
                        ))}
                    </div>
                )}
            </div>

            <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={load} />
        </div>
    );
}