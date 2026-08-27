import React, { useEffect, useState } from 'react';
import { Loader2, User, Boxes, Sparkles, Network, FileText, FolderKanban, Cpu, Palette, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SettingsSection from '@/components/settings/SettingsSection';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [counts, setCounts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState('account');
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const me = await base44.auth.me();
                setUser(me);
            } catch {
                setUser(null);
            }
            try {
                const [sources, assets, nodes, edges, projects] = await Promise.all([
                    base44.entities.Source.list('-created_date', 1),
                    base44.entities.KnowledgeAsset.list('-created_date', 1),
                    base44.entities.GraphNode.list('-created_date', 1),
                    base44.entities.GraphEdge.list('-created_date', 1),
                    base44.entities.Project.list('-updated_date', 1),
                ]);
                setCounts({
                    sources: sources.length,
                    assets: assets.length,
                    nodes: nodes.length,
                    edges: edges.length,
                    projects: projects.length,
                });
            } catch {
                setCounts(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleLogout = async () => {
        setSigningOut(true);
        try {
            await base44.auth.logout('/');
        } catch {
            window.location.href = '/login';
        }
    };

    const toggle = (key) => setOpen((cur) => (cur === key ? '' : key));

    return (
        <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-2xl px-6 py-8">
                <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="mb-7 text-[14px] text-muted-foreground">Manage your workspace and preferences.</p>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[13px]">Loading…</span>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <SettingsSection title="Account" icon={User} desc={user?.email || 'Signed in user'} open={open === 'account'} onToggle={() => toggle('account')}>
                            <dl className="space-y-2.5 text-[13px]">
                                <Row label="Name" value={user?.full_name || '—'} />
                                <Row label="Email" value={user?.email || '—'} />
                                <Row label="Role" value={user?.role || 'user'} />
                                <Row label="Member since" value={user?.created_date ? new Date(user.created_date).toLocaleDateString() : '—'} />
                            </dl>
                            <button
                                onClick={handleLogout}
                                disabled={signingOut}
                                className="mt-4 flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3.5 py-2 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                            >
                                {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                                Sign out
                            </button>
                        </SettingsSection>

                        <SettingsSection title="Workspace" icon={Boxes} desc="Knowledge universe overview" open={open === 'workspace'} onToggle={() => toggle('workspace')}>
                            {counts ? (
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                    <Stat icon={FolderKanban} label="Projects" value={counts.projects} />
                                    <Stat icon={FileText} label="Sources" value={counts.sources} />
                                    <Stat icon={Sparkles} label="Assets" value={counts.assets} />
                                    <Stat icon={Network} label="Nodes" value={counts.nodes} />
                                    <Stat icon={Network} label="Relations" value={counts.edges} />
                                </div>
                            ) : (
                                <p className="text-[13px] text-muted-foreground">Could not load workspace data.</p>
                            )}
                        </SettingsSection>

                        <SettingsSection title="AI Provider" icon={Cpu} desc="Model configuration" open={open === 'ai'} onToggle={() => toggle('ai')}>
                            <div className="space-y-2 text-[13px]">
                                <Row label="Provider" value="Base44 AI (managed)" />
                                <Row label="Default model" value="automatic" />
                                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                                    Extraction, graph building and Talk use the managed LLM layer. No API keys required — credits are
                                    consumed per invocation and billed through your Base44 plan.
                                </p>
                            </div>
                        </SettingsSection>

                        <SettingsSection title="Appearance" icon={Palette} desc="Theme and density" open={open === 'appearance'} onToggle={() => toggle('appearance')}>
                            <div className="space-y-2 text-[13px]">
                                <Row label="Theme" value="Dark (default)" />
                                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                                    ThoughtGraph uses a single dark theme tuned for long reading sessions. Light mode is not yet available.
                                </p>
                            </div>
                        </SettingsSection>

                        <SettingsSection title="Data & Privacy" icon={Network} desc="Storage and ownership" open={open === 'data'} onToggle={() => toggle('data')}>
                            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                                All sources, assets and graph nodes belong to your account and are stored securely on Base44. They are
                                only visible to you unless you invite collaborators to a project. Deleting a source removes its linked
                                assets; graph nodes and relations persist until rebuilt.
                            </p>
                        </SettingsSection>
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="truncate text-foreground/90">{value}</span>
        </div>
    );
}

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="rounded-lg border border-border bg-background/50 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                <span className="text-[11px]">{label}</span>
            </div>
            <div className="font-display text-xl font-semibold tracking-tight">{value}</div>
        </div>
    );
}