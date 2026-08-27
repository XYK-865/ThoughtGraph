import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Download, Sparkles, Tag, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';

const typeLabel = { note: 'Note', text: 'Pasted Text', file: 'File', markdown: 'Markdown', url: 'URL' };

export default function SourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState(null);
  const [projects, setProjects] = useState([]);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [graphBuilding, setGraphBuilding] = useState(false);
  const [graphResult, setGraphResult] = useState(null);
  const [graphError, setGraphError] = useState('');

  const loadAsset = useCallback(async () => {
    try {
      const list = await base44.entities.KnowledgeAsset.filter({ sourceId: id }, '-created_date', 5);
      setAsset(list[0] || null);
    } catch {
      setAsset(null);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Source
      .get(id)
      .then((s) => {
        if (cancelled) return;
        if (!s) setNotFound(true);
        else {
          setSource(s);
          if (s.projectIds?.length) {
            base44.entities.Project.list('-updated_date', 100).then((all) => {
              if (cancelled) return;
              setProjects(all.filter((p) => s.projectIds.includes(p.id)));
            });
          }
        }
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    loadAsset();
    return () => {
      cancelled = true;
    };
  }, [id, loadAsset]);

  const handleExtract = async () => {
    setExtracting(true);
    setExtractError('');
    try {
      const res = await base44.functions.invoke('extractAsset', { sourceId: id });
      if (res?.data?.asset) {
        setAsset(res.data.asset);
      } else if (res?.data?.error) {
        setExtractError(res.data.error);
      }
    } catch (err) {
      setExtractError(err?.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleBuildGraph = async () => {
    setGraphBuilding(true);
    setGraphError('');
    try {
      const res = await base44.functions.invoke('buildGraphFromAsset', { assetId: asset.id });
      if (res?.data?.nodesCreated !== undefined) {
        setGraphResult(res.data);
      } else if (res?.data?.error) {
        setGraphError(res.data.error);
      }
    } catch (err) {
      setGraphError(err?.message || 'Graph build failed');
    } finally {
      setGraphBuilding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[13px]">Loading source…</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-[14px] text-muted-foreground">Source not found.</p>
        <button onClick={() => navigate('/projects')} className="text-[13px] text-primary hover:underline">
          Back to projects
        </button>
      </div>
    );
  }

  const isMarkdown = source.type === 'markdown';

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {typeLabel[source.type] || source.type}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {source.wordCount} words · {source.status}
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{source.title}</h1>
        </div>

        {/* Knowledge Asset section */}
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.6} />
              <h3 className="font-display text-[14px] font-semibold tracking-tight">Knowledge Asset</h3>
            </div>
            {asset && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">{asset.status}</span>
            )}
          </div>

          {asset ? (
            <div className="space-y-4">
              {asset.summary && (
                <div>
                  <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Summary</h4>
                  <p className="text-[14px] leading-relaxed text-foreground/90">{asset.summary}</p>
                </div>
              )}
              {asset.keyPoints?.length > 0 && (
                <div>
                  <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Key Points</h4>
                  <ul className="space-y-1.5">
                    {asset.keyPoints.map((p, i) => (
                      <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-foreground/85">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(asset.tags?.length > 0 || asset.entities?.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags?.map((t, i) => (
                    <span key={'t' + i} className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] text-foreground/80">
                      <Tag className="h-2.5 w-2.5" /> {t}
                    </span>
                  ))}
                  {asset.entities?.map((e, i) => (
                    <span key={'e' + i} className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary/90">
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <p className="max-w-sm text-[13px] text-muted-foreground">
                No asset extracted yet. Run AI extraction to turn this source into a structured knowledge asset
                (summary, key points, tags, entities).
              </p>
              {extractError && <p className="text-[12px] text-destructive">{extractError}</p>}
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {extracting ? 'Extracting…' : 'Extract with AI'}
              </button>
            </div>
          )}
        </div>

        {/* Knowledge Graph (this source) */}
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" strokeWidth={1.6} />
            <h3 className="font-display text-[14px] font-semibold tracking-tight">Knowledge Graph</h3>
          </div>
          {!asset ? (
            <p className="text-[13px] text-muted-foreground">
              Extract a knowledge asset first to build a graph from it.
            </p>
          ) : graphResult ? (
            <div className="space-y-3">
              <p className="text-[12.5px] text-muted-foreground">
                {graphResult.nodesCreated} nodes · {graphResult.edgesCreated} relations added to the project graph.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {graphResult.nodes?.map((n, i) => (
                  <span
                    key={i}
                    className={
                      n.kind === 'keypoint'
                        ? 'rounded-full border border-chart-4/40 bg-chart-4/5 px-2.5 py-0.5 text-[11px] text-foreground/85'
                        : 'rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary/90'
                    }
                  >
                    {n.label}
                  </span>
                ))}
              </div>
              <button
                onClick={handleBuildGraph}
                disabled={graphBuilding}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
              >
                {graphBuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Network className="h-3.5 w-3.5" />}
                Rebuild
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              {graphError && <p className="text-[12px] text-destructive">{graphError}</p>}
              <button
                onClick={handleBuildGraph}
                disabled={graphBuilding}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {graphBuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                {graphBuilding ? 'Building…' : 'Build Graph from Asset'}
              </button>
            </div>
          )}
        </div>

        {projects.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Linked projects</h3>
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] transition-colors hover:border-primary/40"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5">
          {source.content ? (
            isMarkdown ? (
              <div className="prose-invert max-w-none text-[14px] leading-relaxed text-foreground/90 [&>*:first-child]:mt-0">
                <ReactMarkdown>{source.content}</ReactMarkdown>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-body text-[14px] leading-relaxed text-foreground/90">
                {source.content}
              </pre>
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <FileText className="h-6 w-6" strokeWidth={1.3} />
              <p className="text-[13px]">No inline content stored for this source.</p>
            </div>
          )}
        </div>

        {source.fileUrl && (
          <a
            href={source.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Download original file
          </a>
        )}
      </div>
    </div>
  );
}