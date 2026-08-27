import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Sparkles, Loader2, ArrowUp, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useActiveProject } from '@/lib/ActiveProjectContext';

const MODES = [
  { key: 'general', label: 'General Talk', desc: 'Free-form assistant, no project context.' },
  { key: 'project', label: 'Project Talk', desc: 'Answers grounded in the active project knowledge.' },
  { key: 'past_self', label: 'Ask My Past Self', desc: 'Recall across everything you have ever stored.' },
];

const SUGGESTIONS = {
  general: ['Summarize what I should focus on today', 'Explain a concept simply', 'Brainstorm three ideas'],
  project: ['What are the core themes here?', 'How do these concepts connect?', 'What is missing in my knowledge?'],
  past_self: ['What did I think about last month?', 'Find connections across my projects', 'What have I changed my mind about?'],
};

export default function Talk() {
  const { activeProject } = useActiveProject();
  const [mode, setMode] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    if (mode === 'project' && !activeProject) {
      setError('Choose a project first to use Project Talk.');
      return;
    }
    setError('');
    const userMsg = { role: 'user', content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const res = await base44.functions.invoke('talkWithContext', {
        question: content,
        mode,
        projectId: mode === 'project' ? activeProject?.id : '',
        history: nextMessages.slice(-7).map((m) => ({ role: m.role, content: m.content })),
      });
      if (res?.data?.error) {
        setError(res.data.error);
        setMessages((m) => [...m, { role: 'assistant', content: '', error: res.data.error }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: res?.data?.answer || '', citations: res?.data?.citations || [] },
        ]);
      }
    } catch (err) {
      const msg = err?.message || 'Request failed';
      setError(msg);
      setMessages((m) => [...m, { role: 'assistant', content: '', error: msg }]);
    } finally {
      setSending(false);
    }
  };

  const activeMode = MODES.find((m) => m.key === mode);

  return (
    <div className="flex h-full flex-col">
      {/* Mode tabs */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              setError('');
            }}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${mode === m.key ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {m.label}
          </button>
        ))}
        {mode === 'project' && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: activeProject ? activeProject.color : 'hsl(var(--muted-foreground))' }}
            />
            {activeProject ? activeProject.name : 'No active project'}
          </span>
        )}
      </div>

      {/* Conversation area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl px-5 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
                <MessageSquare className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>
              <div className="max-w-md space-y-1.5">
                <h2 className="font-display text-xl font-semibold tracking-tight">{activeMode.label}</h2>
                <p className="text-[14px] leading-relaxed text-muted-foreground">{activeMode.desc}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS[mode].map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[12.5px] text-foreground/85 transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((m, i) => (
                <MessageBubble key={i} msg={m} />
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Thinking…</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border p-4">
        <div className="mx-auto max-w-2xl">
          {error && <p className="mb-2 text-[12px] text-destructive">{error}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 focus-within:border-primary/40"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'project' && !activeProject ? 'Select a project to ask grounded questions…' : 'Ask, explore, or recall…'
              }
              className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-[14px] leading-relaxed text-primary-foreground">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/25">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-[14px] leading-relaxed text-foreground/90">
            {msg.error ? <span className="text-destructive">{msg.error}</span> : <span className="whitespace-pre-wrap">{msg.content}</span>}
          </div>
        </div>
        {msg.citations?.length > 0 && (
          <div className="ml-9 space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Grounded in</p>
            <div className="flex flex-wrap gap-1.5">
              {msg.citations.map((c) => (
                <CitationChip key={c.id} c={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CitationChip({ c }) {
  const inner = (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
      <Link2 className="h-3 w-3" />
      <span className="truncate max-w-[180px]">{c.sourceTitle || c.projectName || c.snippet || 'asset'}</span>
    </span>
  );
  return c.sourceId ? (
    <Link to={`/sources/${c.sourceId}`} className="inline-flex">
      {inner}
    </Link>
  ) : (
    inner
  );
}