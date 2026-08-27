import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AddSourceSheet({ open, onOpenChange, initialProjectIds = [] }) {
    const [tab, setTab] = useState('note');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        base44.entities.Project.list('-updated_date', 100).then(setProjects).catch(() => setProjects([]));
    }, [open]);

    useEffect(() => {
        setSelected(initialProjectIds || []);
    }, [initialProjectIds, open]);

    const reset = () => {
        setTab('note');
        setTitle('');
        setContent('');
        setFile(null);
        setError('');
    };

    const toggleProject = (pid) => {
        setSelected((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        setSaving(true);
        setError('');
        try {
            let contentText = '';
            let fileUrl = '';
            let type = tab;

            if (tab === 'file') {
                if (!file) {
                    setError('Choose a .md or .txt file');
                    setSaving(false);
                    return;
                }
                contentText = await file.text();
                const uploaded = await base44.integrations.Core.UploadFile({ file });
                fileUrl = uploaded.file_url;
                const lower = file.name.toLowerCase();
                type = lower.endsWith('.md') || lower.endsWith('.markdown') ? 'markdown' : 'file';
            } else {
                contentText = content;
                type = tab === 'note' ? 'note' : 'text';
                if (!contentText.trim()) {
                    setError('Content is required');
                    setSaving(false);
                    return;
                }
            }

            const wordCount = contentText.trim() ? contentText.trim().split(/\s+/).length : 0;

            await base44.entities.Source.create({
                title: title.trim(),
                type,
                content: contentText,
                fileUrl,
                status: 'raw',
                projectIds: selected,
                tags: [],
                wordCount,
            });

            window.dispatchEvent(new CustomEvent('tg:source-changed'));
            reset();
            onOpenChange(false);
        } catch (err) {
            setError(err?.message || 'Failed to save source');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 border-border bg-card p-0 sm:max-w-md">
                <SheetHeader className="border-b border-border px-5 py-4">
                    <SheetTitle className="font-display tracking-tight">Add Knowledge</SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin px-5 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="src-title" className="text-[13px]">Title</Label>
                            <Input
                                id="src-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Name this source"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[13px]">Import type</Label>
                            <Tabs value={tab} onValueChange={setTab}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="note">Note</TabsTrigger>
                                    <TabsTrigger value="paste">Paste</TabsTrigger>
                                    <TabsTrigger value="file">File</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {tab !== 'file' ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="src-content" className="text-[13px]">
                                    {tab === 'note' ? 'Note content' : 'Pasted text'}
                                </Label>
                                <Textarea
                                    id="src-content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={tab === 'note' ? 'Write a quick note…' : 'Paste any text here…'}
                                    rows={8}
                                    className="resize-none font-body"
                                />
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-[13px]">File (.md / .txt)</Label>
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 text-center transition-colors hover:border-primary/40">
                                    <FileText className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.4} />
                                    <span className="text-[13px] text-muted-foreground">
                                        {file ? file.name : 'Click to choose a file'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".md,.markdown,.txt,text/plain,text/markdown"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[13px]">Associate with projects</Label>
                            {projects.length === 0 ? (
                                <p className="text-[12px] text-muted-foreground">No projects yet.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {projects.map((p) => {
                                        const on = selected.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => toggleProject(p.id)}
                                                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors ${on
                                                    ? 'border-primary/50 bg-primary/10 text-foreground'
                                                    : 'border-border text-muted-foreground hover:text-foreground'
                                                    }`}
                                            >
                                                <span
                                                    className="h-1.5 w-1.5 rounded-full"
                                                    style={{ backgroundColor: p.color }}
                                                />
                                                {p.name}
                                                {on && <Check className="h-3 w-3" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="px-5 text-[12.5px] text-destructive">{error}</p>}

                    <SheetFooter className="border-t border-border px-5 py-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
                                </>
                            ) : (
                                'Save Source'
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}