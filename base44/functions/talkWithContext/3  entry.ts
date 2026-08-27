// @ts-ignore - Base44 runtime supports npm: package specifiers, but the editor may not resolve them in TS
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MODES = ['general', 'project', 'past_self'] as const;

type Mode = (typeof MODES)[number];

type SourceLike = {
    id?: string;
    title?: string;
};

type ProjectLike = {
    id?: string;
    name?: string;
    description?: string;
    coreThemes?: string[];
};

type AssetLike = {
    id?: string;
    sourceId?: string;
    projectIds?: string[];
    summary?: string;
    keyPoints?: string[];
    entities?: string[];
};

type GraphNodeLike = {
    id?: string;
    label?: string;
    kind?: string;
};

type GraphEdgeLike = {
    id?: string;
    fromLabel?: string;
    toLabel?: string;
    relation?: string;
};

type HistoryItem = {
    role?: 'user' | 'assistant' | string;
    content?: string;
};

type ContextBlockArgs = {
    mode: Mode | string;
    project: ProjectLike | null;
    assets: AssetLike[];
    sources: SourceLike[];
    projects: ProjectLike[];
    nodes: GraphNodeLike[];
    edges: GraphEdgeLike[];
};

function buildContextBlock({ mode, project, assets, sources, projects, nodes, edges }: ContextBlockArgs) {
    const sourceMap = new Map((sources || []).map((s: SourceLike) => [s.id, s]));
    const projectMap = new Map((projects || []).map((p: ProjectLike) => [p.id, p]));
    const lines: string[] = [];

    if (mode === 'general') return '';

    if (mode === 'project') {
        lines.push(`PROJECT: ${project?.name || '(unknown)'}`);
        if (project?.description) lines.push(`Description: ${project.description}`);
        if (project?.coreThemes?.length) lines.push(`Core themes: ${project.coreThemes.join(', ')}`);
    } else if (mode === 'past_self') {
        lines.push('SCOPE: across all the user projects.');
    }

    if (assets?.length) {
        lines.push('\nKNOWLEDGE ASSETS:');
        assets.forEach((a: AssetLike, i: number) => {
            const src = a.sourceId ? sourceMap.get(a.sourceId) : null;
            const projName = (a.projectIds || [])
                .map((pid: string) => projectMap.get(pid)?.name)
                .filter((value): value is string => Boolean(value))
                .join(' / ');
            lines.push(
                `#${i + 1} [project: ${projName || '—'}] [source: ${src?.title || '—'}]`,
            );
            if (a.summary) lines.push(`  summary: ${a.summary}`);
            if (a.keyPoints?.length) lines.push(`  key points: ${a.keyPoints.map((p: string) => '• ' + p).join(' ')}`);
            if (a.entities?.length) lines.push(`  entities: ${a.entities.join(', ')}`);
        });
    }

    if (mode === 'project' && nodes?.length) {
        lines.push('\nGRAPH ENTITIES (nodes):');
        lines.push(nodes.map((n: GraphNodeLike) => n.label + (n.kind === 'keypoint' ? ' (key point)' : '')).join(', '));
        if (edges?.length) {
            lines.push('\nGRAPH RELATIONS:');
            edges.slice(0, 40).forEach((e: GraphEdgeLike) => {
                lines.push(`  ${e.fromLabel || '?'} --${e.relation}--> ${e.toLabel || '?'}`);
            });
        }
    }

    if (!assets?.length && !(mode === 'project' && nodes?.length)) {
        lines.push('\n(no knowledge has been recorded in this scope yet)');
    }

    return lines.join('\n');
}

export default async function (req: Request) {
    try {
        const base44 = createClientFromRequest(req as any);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const question = (body?.question || '').toString().trim();
        const mode = MODES.includes((body?.mode as Mode) || 'general') ? (body?.mode as Mode) : 'general';
        const projectId = (body?.projectId || '').toString().trim();
        const history = Array.isArray(body?.history) ? (body.history as HistoryItem[]).slice(-6) : [];

        if (!question) return Response.json({ error: 'question is required' }, { status: 400 });

        let project: ProjectLike | null = null;
        let assets: AssetLike[] = [];
        let sources: SourceLike[] = [];
        let projects: ProjectLike[] = [];
        let nodes: GraphNodeLike[] = [];
        let edges: GraphEdgeLike[] = [];

        if (mode === 'project') {
            if (!projectId) return Response.json({ error: 'No active project for Project Talk' }, { status: 400 });
            project = await base44.entities.Project.get(projectId);
            [assets, nodes, edges] = await Promise.all([
                base44.entities.KnowledgeAsset.filter({ projectIds: projectId }, '-created_date', 20),
                base44.entities.GraphNode.filter({ projectId }, '-created_date', 120),
                base44.entities.GraphEdge.filter({ projectId }, '-created_date', 120),
            ]);
        } else if (mode === 'past_self') {
            projects = await base44.entities.Project.list('-updated_date', 100);
            assets = await base44.entities.KnowledgeAsset.list('-created_date', 25);
        }

        const sourceIds = [...new Set((assets.map((a: AssetLike) => a.sourceId).filter((id): id is string => Boolean(id))))];
        if (sourceIds.length) {
            const fetched = await Promise.all(
                sourceIds.map((id: string) => base44.entities.Source.get(id).catch(() => null)),
            );
            sources = fetched.filter(Boolean);
        }

        const context = buildContextBlock({ mode, project, assets, sources, projects, nodes, edges });

        const historyText = history.length
            ? '\nCONVERSATION SO FAR:\n' +
            history.map((m: HistoryItem) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || ''}`).join('\n')
            : '';

        const prompt =
            'You are the assistant inside a personal knowledge universe called ThoughtGraph. ' +
            'Answer the user grounded in the provided knowledge context. ' +
            'When you use something from the context, hint which asset or source it came from (e.g. "according to <source title>"). ' +
            'If the context does not cover the question, say briefly that there is not enough recorded knowledge, then answer generally if you can. ' +
            'Be concise, clear, and reply in the same language as the question.\n\n' +
            'CONTEXT:\n' + (context || '(no context — general mode)') +
            historyText +
            '\n\nQUESTION:\n' + question;

        const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
        const answer = typeof result === 'string' ? result : result?.text || result?.answer || JSON.stringify(result);

        const citations = (assets || []).slice(0, 6).map((a: AssetLike) => {
            const src = a.sourceId ? sources.find((s: SourceLike) => s.id === a.sourceId) : null;
            const projName = (a.projectIds || [])
                .map((pid: string) => (projects.find((p: ProjectLike) => p.id === pid) || project)?.name)
                .filter((value): value is string => Boolean(value))
                .join(' / ');
            return {
                id: a.id,
                sourceId: a.sourceId || '',
                sourceTitle: src?.title || '',
                projectName: projName || project?.name || '',
                snippet: (a.summary || '').slice(0, 120),
            };
        });

        return Response.json({ answer, citations, mode });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return Response.json({ error: message }, { status: 500 });
    }
}