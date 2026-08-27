import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const colors = [
    { name: 'Gold', value: '#eab308' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Slate', value: '#64748b' },
];

export default function CreateProjectDialog({ open, onOpenChange, onCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(colors[0].value);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const reset = () => {
        setName('');
        setDescription('');
        setColor(colors[0].value);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Project name is required');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const { base44 } = await import('@/api/base44Client');
            const project = await base44.entities.Project.create({
                name: name.trim(),
                description: description.trim(),
                color,
                icon: 'FolderKanban',
                coreThemes: [],
                lastActivityAt: new Date().toISOString(),
            });
            reset();
            onOpenChange(false);
            onCreated?.(project);
        } catch (err) {
            setError(err?.message || 'Failed to create project');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-border bg-card sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display tracking-tight">New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="proj-name" className="text-[13px]">Name</Label>
                        <Input
                            id="proj-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. AI 学习"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="proj-desc" className="text-[13px]">Description</Label>
                        <Textarea
                            id="proj-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this knowledge universe about?"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px]">Accent color</Label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`h-7 w-7 rounded-full ring-2 transition-all ${color === c.value ? 'ring-foreground ring-offset-2 ring-offset-card' : 'ring-transparent'
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-[12.5px] text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Creating…' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}