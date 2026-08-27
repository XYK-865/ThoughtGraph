import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useActiveProject } from '@/lib/ActiveProjectContext';

export default function ProjectCard({ project }) {
    const navigate = useNavigate();
    const { setActiveProjectId } = useActiveProject();

    const open = () => {
        setActiveProjectId(project.id);
        navigate(`/projects/${project.id}`);
    };

    return (
        <div
            onClick={open}
            className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
            <div className="mb-3 flex items-center justify-between">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg ring-1"
                    style={{
                        backgroundColor: `${project.color}1a`,
                        color: project.color,
                        boxShadow: `inset 0 0 0 1px ${project.color}33`,
                    }}
                >
                    <FolderKanban className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
                    {project.status}
                </span>
            </div>
            <h3 className="font-display text-[15px] font-semibold tracking-tight">{project.name}</h3>
            {project.description && (
                <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/80">
                <span>{project.coreThemes?.length || 0} themes</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span>Updated {formatDistanceToNow(new Date(project.updated_date), { addSuffix: true })}</span>
            </div>
        </div>
    );
}