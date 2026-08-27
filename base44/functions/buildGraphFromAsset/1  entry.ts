// @ts-ignore - Base44 runtime supports npm: package specifiers even when TS cannot resolve them here
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

type AssetLike = {
  projectIds?: string[];
  summary?: string;
  keyPoints?: string[];
  entities?: string[];
  sourceId?: string;
};

type NodeLike = {
  label?: string;
  kind?: string;
  entityType?: string;
};

type EdgeLike = {
  from?: string;
  to?: string;
  relation?: string;
};

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req as any);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const assetId = body?.assetId;
    if (!assetId || typeof assetId !== 'string') {
      return Response.json({ error: 'assetId is required' }, { status: 400 });
    }

    const asset = (await base44.entities.KnowledgeAsset.get(assetId)) as AssetLike | null;
    if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 });

    const projectIds = Array.isArray(asset.projectIds) ? asset.projectIds : [];
    if (projectIds.length === 0) {
      return Response.json({ error: 'Asset is not linked to any project' }, { status: 400 });
    }

    const keyPointsText = (asset.keyPoints || []).map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');
    const entitiesText = (asset.entities || []).join(', ');

    const prompt =
      'You are a knowledge graph builder. Given a knowledge asset, produce a graph of nodes and edges for a personal knowledge universe. ' +
      'Create nodes from the main entities (kind: "entity") and from the key points (kind: "keypoint", label = a short noun phrase capturing the point). ' +
      'Create edges that connect meaningfully related nodes; relation should be a short verb or phrase (e.g. "uses", "describes", "part_of", "related_to"). ' +
      'Every edge from/to MUST exactly match a node label. Return 5-15 nodes and a sensible set of edges. ' +
      'Write in the same language as the source.\n\n' +
      'ASSET SUMMARY:\n' + (asset.summary || '') + '\n\n' +
      'KEY POINTS:\n' + keyPointsText + '\n\n' +
      'ENTITIES: ' + entitiesText;

    const schema = {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              kind: { type: 'string', enum: ['entity', 'keypoint'] },
              entityType: { type: 'string' }
            },
            required: ['label', 'kind']
          }
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              relation: { type: 'string' }
            },
            required: ['from', 'to']
          }
        }
      },
      required: ['nodes', 'edges']
    };

    const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema
    });

    const data = (result || {}) as Record<string, unknown>;
    const llmNodes: NodeLike[] = Array.isArray(data.nodes) ? (data.nodes as NodeLike[]) : [];
    const llmEdges: EdgeLike[] = Array.isArray(data.edges) ? (data.edges as EdgeLike[]) : [];

    let nodesCreated = 0;
    let edgesCreated = 0;

    for (const projectId of projectIds) {
      try { await base44.entities.GraphEdge.deleteMany({ assetId, projectId }); } catch (_e) { }
      try { await base44.entities.GraphNode.deleteMany({ assetId, projectId }); } catch (_e) { }

      const existing = await base44.entities.GraphNode.filter({ projectId }, '-created_date', 200);
      const labelMap = new Map<string, any>();
      for (const n of existing) {
        if (!labelMap.has(String(n.label).toLowerCase())) labelMap.set(String(n.label).toLowerCase(), n);
      }

      const resolveOrCreate = async (ln: NodeLike) => {
        const key = (ln.label || '').trim().toLowerCase();
        if (!key) return null;
        const hit = labelMap.get(key);
        if (hit) return hit;
        const created = await base44.entities.GraphNode.create({
          projectId,
          label: ln.label!.trim(),
          kind: ln.kind === 'keypoint' ? 'keypoint' : 'entity',
          entityType: ln.entityType || 'concept',
          assetId,
          sourceId: asset.sourceId || '',
          weight: 1
        });
        labelMap.set(key, created);
        nodesCreated += 1;
        return created;
      };

      const nodeByLabel = new Map<string, any>();
      for (const ln of llmNodes) {
        const node = await resolveOrCreate(ln);
        if (node) nodeByLabel.set(String(node.label).toLowerCase(), node);
      }

      for (const ed of llmEdges) {
        const fromNode = nodeByLabel.get((ed.from || '').trim().toLowerCase());
        const toNode = nodeByLabel.get((ed.to || '').trim().toLowerCase());
        if (!fromNode || !toNode || fromNode.id === toNode.id) continue;
        await base44.entities.GraphEdge.create({
          projectId,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          fromLabel: fromNode.label,
          toLabel: toNode.label,
          relation: ed.relation || 'related_to',
          assetId,
          weight: 1
        });
        edgesCreated += 1;
      }
    }

    return Response.json({
      nodesCreated,
      edgesCreated,
      nodes: llmNodes,
      edges: llmEdges
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
