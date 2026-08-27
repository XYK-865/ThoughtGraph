// @ts-ignore - Base44 runtime supports npm: specifiers, but the editor may not resolve them in TS
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

type SourceRecord = {
    id?: string;
    title?: string;
    type?: string;
    content?: string;
    projectIds?: string[];
    status?: string;
};

type EntityInput = string | { name?: string; type?: string } | null | undefined;

type ExtractedAssetResult = {
    summary?: string;
    keyPoints?: string[];
    tags?: string[];
    entities?: EntityInput[];
};

export default async function (req: Request) {
    try {
        const base44 = createClientFromRequest(req as any);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const sourceId = body?.sourceId;
        if (!sourceId || typeof sourceId !== 'string') {
            return Response.json({ error: 'sourceId is required' }, { status: 400 });
        }

        const source = (await base44.entities.Source.get(sourceId)) as SourceRecord | null;
        if (!source) return Response.json({ error: 'Source not found' }, { status: 404 });

        const text = (source.content || '').slice(0, 12000);

        const prompt =
            'You are a knowledge extraction engine. Given the following source material, produce a structured knowledge asset. ' +
            'Return a concise summary (2-4 sentences), 3-7 key points (each a single clear sentence), 3-8 short tag keywords, ' +
            'and the main entities (concepts, people, tools, places) mentioned. ' +
            'Write in the same language as the source.\n\n' +
            'SOURCE TITLE: ' + (source.title || '') + '\n' +
            'SOURCE TYPE: ' + (source.type || '') + '\n\n' +
            'SOURCE CONTENT:\n' + text;

        const schema = {
            type: 'object',
            properties: {
                summary: { type: 'string' },
                keyPoints: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' } },
                entities: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: { name: { type: 'string' }, type: { type: 'string' } },
                        required: ['name']
                    }
                }
            },
            required: ['summary', 'keyPoints', 'tags', 'entities']
        };

        const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: schema
        });

        const data = (result || {}) as ExtractedAssetResult;
        const entities = Array.isArray(data.entities)
            ? data.entities
                .map((e: EntityInput) => (typeof e === 'string' ? e : e && e.name))
                .filter((value): value is string => Boolean(value))
            : [];

        const asset = await base44.entities.KnowledgeAsset.create({
            sourceId: source.id,
            projectIds: source.projectIds || [],
            summary: data.summary || '',
            keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
            tags: Array.isArray(data.tags) ? data.tags : [],
            entities,
            status: 'draft'
        });

        await base44.entities.Source.update(source.id, { status: 'processed' });

        return Response.json({ asset });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return Response.json({ error: message }, { status: 500 });
    }
}