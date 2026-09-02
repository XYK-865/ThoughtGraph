import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  FileText,
  Github,
  Lightbulb,
  Link2,
  LoaderCircle,
  Menu,
  Network,
  Orbit,
  Play,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

const REPOSITORY_URL = 'https://github.com/XYK-865/ThoughtGraph';

const steps = [
  { id: 'sources', label: '资料输入', eyebrow: '01', icon: FileText },
  { id: 'extract', label: 'AI 提炼', eyebrow: '02', icon: Sparkles },
  { id: 'graph', label: '关系图谱', eyebrow: '03', icon: Network },
  { id: 'answer', label: '溯源问答', eyebrow: '04', icon: Bot },
];

const sources = [
  {
    id: 'interview',
    type: '用户访谈',
    title: '访谈记录：知识型产品经理',
    meta: '12 分钟 · 1,836 字',
    excerpt: '“资料不是找不到，而是每次都要重新理解一遍；过两周再看，我已经忘了当时为什么觉得它重要。”',
    color: '#80e8c5',
  },
  {
    id: 'research',
    type: '竞品研究',
    title: 'AI 知识工具体验笔记',
    meta: '8 个产品 · 24 条观察',
    excerpt: '主流产品擅长保存和检索，但引用与结论分离，用户难以判断回答依据，也无法看到观点如何演进。',
    color: '#8fb7ff',
  },
  {
    id: 'prd',
    type: '需求草案',
    title: '个人知识工作台 MVP',
    meta: 'v0.3 · 昨天更新',
    excerpt: '核心任务：让用户在需要决策时，快速找回“资料、理解和关系”，而不是再读一遍所有原文。',
    color: '#e9bd76',
  },
];

const insights = [
  {
    id: 'pain',
    kind: '核心痛点',
    title: '真正的成本不是搜索，而是重复理解',
    summary: '资料被保存后缺少“当时的判断”和上下文，导致每次使用都要重新建立认知。',
    confidence: 94,
    source: '访谈记录',
    sourceId: 'interview',
    quote: '每次都要重新理解一遍。',
    icon: Target,
  },
  {
    id: 'trust',
    kind: '设计原则',
    title: 'AI 结论必须能回到原始证据',
    summary: '引用不只是展示出处，更是让用户校验、修正和继续探索的入口。',
    confidence: 91,
    source: '竞品研究',
    sourceId: 'research',
    quote: '用户难以判断回答依据。',
    icon: ShieldCheck,
  },
  {
    id: 'opportunity',
    kind: '产品机会',
    title: '用关系图谱保存“理解的结构”',
    summary: '把资料、洞察、假设和决策连接起来，帮助用户发现跨项目的隐性关系。',
    confidence: 87,
    source: '需求草案',
    sourceId: 'prd',
    quote: '找回资料、理解和关系。',
    icon: Lightbulb,
  },
];

const graphNodes = [
  { id: 'center', label: '知识工作台', type: '主题', x: 50, y: 47, size: 19 },
  { id: 'understand', label: '重复理解成本', type: '用户痛点', x: 23, y: 25, size: 13 },
  { id: 'context', label: '上下文流失', type: '根因', x: 18, y: 66, size: 11 },
  { id: 'trace', label: '证据可追溯', type: '设计原则', x: 75, y: 22, size: 14 },
  { id: 'graph', label: '关系图谱', type: '产品能力', x: 80, y: 62, size: 15 },
  { id: 'decision', label: '辅助决策', type: '用户价值', x: 52, y: 82, size: 12 },
];

const graphEdges = [
  ['center', 'understand', '解决'],
  ['center', 'context', '聚合'],
  ['center', 'trace', '遵循'],
  ['center', 'graph', '构建'],
  ['center', 'decision', '最终支持'],
  ['understand', 'context', '源于'],
  ['trace', 'graph', '增强可信度'],
  ['graph', 'decision', '服务于'],
];

const answers = {
  mvp: {
    question: '如果只做一个 MVP，最应该先验证什么？',
    lead: '先验证“带证据的知识召回”能否显著降低用户的重复理解成本。',
    bullets: [
      '目标用户：需要反复调用研究资料的知识型产品经理。',
      '最小闭环：导入材料 → 提炼洞察 → 提问 → 点击引用回到原文。',
      '核心指标：完成一次信息复用所需时间，以及答案引用的点击 / 修正率。',
    ],
    citations: ['interview', 'research', 'prd'],
  },
  risk: {
    question: '这个方向最大的产品风险是什么？',
    lead: '最大风险不是模型答错一次，而是用户无法判断它为什么这样回答，最终失去信任。',
    bullets: [
      '默认展示证据片段，并把引用作为继续探索的入口。',
      '区分“原文事实、AI 归纳、用户判断”，避免认知混写。',
      '用修正行为持续评估抽取质量，而不是只看生成速度。',
    ],
    citations: ['research', 'interview'],
  },
  metric: {
    question: '上线后应该关注哪些指标？',
    lead: '北极星指标可以定义为：每周被成功复用、且证据被确认的知识单元数。',
    bullets: [
      '效率：从提问到确认答案的中位时长。',
      '质量：引用打开率、答案修正率、二次追问率。',
      '留存：跨周复用历史知识的活跃用户占比。',
    ],
    citations: ['prd', 'interview'],
  },
};

const initialStep = () => {
  const requested = new URLSearchParams(window.location.search).get('step');
  return steps.some((step) => step.id === requested) ? requested : 'sources';
};

function DemoApp() {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [runState, setRunState] = useState('idle');
  const [activeSource, setActiveSource] = useState(sources[0]);
  const [activeInsight, setActiveInsight] = useState(insights[0]);
  const [activeNode, setActiveNode] = useState(graphNodes[0]);
  const [activeAnswer, setActiveAnswer] = useState('mvp');
  const [answering, setAnswering] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const goTo = (id) => {
    setActiveStep(id);
    setMobileNavOpen(false);
  };

  const runWorkflow = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunState('running');
    setActiveStep('sources');
    const sequence = [
      [800, 'extract'],
      [1650, 'graph'],
      [2500, 'answer'],
    ];
    sequence.forEach(([delay, step]) => {
      timers.current.push(setTimeout(() => setActiveStep(step), delay));
    });
    timers.current.push(setTimeout(() => setRunState('done'), 3200));
  };

  const ask = (key) => {
    if (answering || key === activeAnswer) return;
    setAnswering(true);
    timers.current.push(setTimeout(() => {
      setActiveAnswer(key);
      setAnswering(false);
    }, 520));
  };

  const renderStage = () => {
    if (activeStep === 'sources') {
      return <SourcesStage active={activeSource} onSelect={setActiveSource} onNext={() => goTo('extract')} />;
    }
    if (activeStep === 'extract') {
      return <ExtractStage active={activeInsight} onSelect={setActiveInsight} onNext={() => goTo('graph')} />;
    }
    if (activeStep === 'graph') {
      return <GraphStage active={activeNode} onSelect={setActiveNode} onNext={() => goTo('answer')} />;
    }
    return <AnswerStage answerKey={activeAnswer} answering={answering} onAsk={ask} />;
  };

  return (
    <div className="demo-shell">
      <div className="demo-noise" aria-hidden="true" />
      <header className="demo-topbar">
        <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="打开演示导航">
          <Menu size={18} />
        </button>
        <a className="brand" href="./demo.html" aria-label="ThoughtGraph Demo 首页">
          <span className="brand-mark"><Orbit size={18} /></span>
          <span>
            <strong>ThoughtGraph</strong>
            <small>AI KNOWLEDGE OS</small>
          </span>
        </a>
        <div className="topbar-center">
          <span className="status-dot" />
          <span>交互演示 · 无需登录</span>
        </div>
        <a className="github-link" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
          <Github size={16} />
          <span>查看源码</span>
        </a>
      </header>

      <div className="demo-body">
        <aside className={`demo-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="关闭演示导航">
            <X size={18} />
          </button>
          <div className="sidebar-intro">
            <span className="eyebrow">AI 产品 Demo</span>
            <h1>让零散资料<br />变成可复用的理解</h1>
            <p>一条从原始材料到可信答案的完整 AI 工作流。</p>
          </div>

          <nav className="step-nav" aria-label="演示步骤">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const current = step.id === activeStep;
              const activeIndex = steps.findIndex((item) => item.id === activeStep);
              const complete = index < activeIndex || runState === 'done';
              return (
                <button
                  key={step.id}
                  className={`${current ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
                  onClick={() => goTo(step.id)}
                >
                  <span className="step-icon">{complete && !current ? <Check size={14} /> : <Icon size={15} />}</span>
                  <span className="step-copy">
                    <small>{step.eyebrow}</small>
                    <strong>{step.label}</strong>
                  </span>
                  {current && <ChevronRight size={15} />}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-run">
            <div className="run-caption">
              <Sparkles size={14} />
              <span>{runState === 'done' ? '工作流已完成' : '约 3 秒体验完整流程'}</span>
            </div>
            <button className="run-button" onClick={runWorkflow} disabled={runState === 'running'}>
              {runState === 'running' ? <LoaderCircle className="spin" size={16} /> : <Play size={15} fill="currentColor" />}
              {runState === 'running' ? 'AI 正在处理…' : runState === 'done' ? '重新运行' : '运行 AI 工作流'}
            </button>
          </div>
        </aside>

        {mobileNavOpen && <button className="mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="关闭导航" />}

        <main className="demo-main">
          <div className="context-bar">
            <div>
              <span className="context-label">当前项目</span>
              <strong>个人知识工作台 · MVP 研究</strong>
            </div>
            <div className="context-meta">
              <span><BookOpen size={13} /> 3 份材料</span>
              <span><Network size={13} /> 6 个知识节点</span>
            </div>
          </div>
          <div className="stage-wrap" key={activeStep}>
            {renderStage()}
          </div>
        </main>
      </div>
    </div>
  );
}

function StageHeader({ kicker, title, description, badge }) {
  return (
    <div className="stage-header">
      <div>
        <span className="eyebrow">{kicker}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {badge && <span className="stage-badge"><Sparkles size={13} /> {badge}</span>}
    </div>
  );
}

function NextButton({ onClick, children }) {
  return (
    <button className="next-button" onClick={onClick}>
      {children}<ArrowRight size={15} />
    </button>
  );
}

function SourcesStage({ active, onSelect, onNext }) {
  return (
    <section className="stage">
      <StageHeader
        kicker="STEP 01 · CONTEXT"
        title="先让 AI 看见完整语境"
        description="把访谈、竞品研究和需求草案放进同一个项目，保留每条信息的原始出处。"
        badge="多源输入已就绪"
      />
      <div className="source-layout">
        <div className="source-list">
          {sources.map((source) => (
            <button
              key={source.id}
              className={`source-card ${active.id === source.id ? 'is-active' : ''}`}
              onClick={() => onSelect(source)}
            >
              <span className="source-accent" style={{ background: source.color }} />
              <span className="source-icon"><FileText size={17} /></span>
              <span className="source-copy">
                <small>{source.type}</small>
                <strong>{source.title}</strong>
                <span>{source.meta}</span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
        <article className="source-preview">
          <div className="preview-toolbar">
            <span>{active.type}</span>
            <span className="saved-state"><Check size={12} /> 已纳入上下文</span>
          </div>
          <h3>{active.title}</h3>
          <div className="quote-block">
            <Quote size={18} />
            <p>{active.excerpt}</p>
          </div>
          <div className="preview-analysis">
            <span><Search size={14} /> AI 将识别</span>
            <div>
              <em>用户痛点</em><em>关键事实</em><em>产品机会</em><em>因果关系</em>
            </div>
          </div>
        </article>
      </div>
      <div className="stage-footer">
        <p><ShieldCheck size={14} /> 演示使用虚构材料，不上传或存储任何数据</p>
        <NextButton onClick={onNext}>开始 AI 提炼</NextButton>
      </div>
    </section>
  );
}

function ExtractStage({ active, onSelect, onNext }) {
  return (
    <section className="stage">
      <StageHeader
        kicker="STEP 02 · SYNTHESIS"
        title="从摘要，进一步走到“可验证的洞察”"
        description="AI 将跨材料的共性模式结构化，同时保留置信度和对应证据。"
        badge="3 条关键洞察"
      />
      <div className="insight-layout">
        <div className="insight-stack">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <button
                key={insight.id}
                className={`insight-row ${active.id === insight.id ? 'is-active' : ''}`}
                onClick={() => onSelect(insight)}
              >
                <span className="insight-icon"><Icon size={18} /></span>
                <span className="insight-row-copy">
                  <small>{insight.kind}</small>
                  <strong>{insight.title}</strong>
                </span>
                <span className="confidence">{insight.confidence}%</span>
              </button>
            );
          })}
        </div>
        <article className="insight-detail">
          <div className="detail-topline">
            <span>{active.kind}</span>
            <span className="confidence-pill">置信度 {active.confidence}%</span>
          </div>
          <h3>{active.title}</h3>
          <p>{active.summary}</p>
          <div className="evidence-card">
            <div><Link2 size={14} /> 支持证据 · {active.source}</div>
            <blockquote>“{active.quote}”</blockquote>
            <span>点击后可回到原文上下文</span>
          </div>
          <div className="human-loop">
            <span className="human-avatar">人</span>
            <div><strong>Human-in-the-loop</strong><p>用户可以确认、修改或删除 AI 洞察。</p></div>
            <button aria-label="确认洞察"><Check size={15} /></button>
          </div>
        </article>
      </div>
      <div className="stage-footer">
        <p><Sparkles size={14} /> AI 负责归纳，人负责判断</p>
        <NextButton onClick={onNext}>查看知识关系</NextButton>
      </div>
    </section>
  );
}

function GraphStage({ active, onSelect, onNext }) {
  const nodeMap = useMemo(() => new Map(graphNodes.map((node) => [node.id, node])), []);
  const related = graphEdges.filter(([from, to]) => from === active.id || to === active.id);
  return (
    <section className="stage">
      <StageHeader
        kicker="STEP 03 · CONNECTIONS"
        title="把“保存过”变成“连接起来”"
        description="知识节点之间的因果、支撑与目标关系被显式保存，帮助用户形成全局理解。"
        badge="可交互图谱"
      />
      <div className="graph-layout">
        <div className="graph-canvas" role="group" aria-label="交互式知识关系图">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#65d9b3" stopOpacity="0.55" />
                <stop offset="1" stopColor="#8fb7ff" stopOpacity="0.16" />
              </linearGradient>
            </defs>
            {graphEdges.map(([from, to]) => {
              const start = nodeMap.get(from);
              const end = nodeMap.get(to);
              const highlighted = from === active.id || to === active.id;
              return <line key={`${from}-${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={highlighted ? 'is-highlighted' : ''} />;
            })}
          </svg>
          {graphNodes.map((node) => (
            <button
              key={node.id}
              className={`graph-node node-${node.id} ${active.id === node.id ? 'is-active' : ''}`}
              style={{ left: `${node.x}%`, top: `${node.y}%`, '--node-size': `${node.size}px` }}
              onClick={() => onSelect(node)}
            >
              <span className="node-orb" />
              <span className="node-label">{node.label}</span>
            </button>
          ))}
          <div className="graph-hint">点击节点探索关系</div>
        </div>
        <aside className="node-detail">
          <span className="detail-label">当前节点</span>
          <div className="node-title"><span className="mini-orb" /><h3>{active.label}</h3></div>
          <span className="node-type">{active.type}</span>
          <div className="relation-list">
            <small>关联关系 · {related.length}</small>
            {related.map(([from, to, relation]) => {
              const other = nodeMap.get(from === active.id ? to : from);
              return (
                <div key={`${from}-${to}`}>
                  <span>{relation}</span>
                  <strong>{other.label}</strong>
                </div>
              );
            })}
          </div>
          <div className="graph-value">
            <Lightbulb size={15} />
            <p>图谱不是装饰：它让 AI 能沿着关系召回上下文，并解释答案是如何形成的。</p>
          </div>
        </aside>
      </div>
      <div className="stage-footer">
        <p><Network size={14} /> 6 个节点 · 8 条语义关系</p>
        <NextButton onClick={onNext}>用这些知识提问</NextButton>
      </div>
    </section>
  );
}

function AnswerStage({ answerKey, answering, onAsk }) {
  const answer = answers[answerKey];
  return (
    <section className="stage">
      <StageHeader
        kicker="STEP 04 · GROUNDED ANSWER"
        title="答案不是终点，证据才是信任的起点"
        description="从项目知识中生成回答，并让每个关键判断都可以回到原始材料。"
        badge="RAG + 引用"
      />
      <div className="answer-layout">
        <div className="question-panel">
          <span className="panel-label">试着问一个问题</span>
          {Object.entries(answers).map(([key, item]) => (
            <button key={key} className={answerKey === key ? 'is-active' : ''} onClick={() => onAsk(key)}>
              <span>{item.question}</span><ArrowRight size={14} />
            </button>
          ))}
          <div className="demo-note">
            <Bot size={15} />
            <p>这是预设数据驱动的交互原型，用于展示产品逻辑；生产版本通过 Base44 后端函数调用模型。</p>
          </div>
        </div>
        <article className={`answer-card ${answering ? 'is-loading' : ''}`} aria-live="polite">
          {answering ? (
            <div className="answer-loading"><LoaderCircle className="spin" size={20} /><span>正在沿知识关系检索证据…</span></div>
          ) : (
            <>
              <div className="answer-author">
                <span><Sparkles size={16} /></span>
                <div><strong>ThoughtGraph AI</strong><small>基于 3 份项目资料回答</small></div>
              </div>
              <h3>{answer.lead}</h3>
              <ol>
                {answer.bullets.map((bullet, index) => <li key={bullet}><span>{index + 1}</span><p>{bullet}</p></li>)}
              </ol>
              <div className="citation-area">
                <span>引用来源</span>
                <div>
                  {answer.citations.map((id, index) => {
                    const source = sources.find((item) => item.id === id);
                    return <button key={id}><FileText size={12} /><span>[{index + 1}] {source.type}</span><ChevronRight size={12} /></button>;
                  })}
                </div>
              </div>
            </>
          )}
        </article>
      </div>
      <div className="stage-footer final-footer">
        <p><Check size={14} /> Demo 完成：从原始材料到可追溯决策建议</p>
        <a className="next-button" href={REPOSITORY_URL} target="_blank" rel="noreferrer">查看实现细节<Github size={15} /></a>
      </div>
    </section>
  );
}

export default DemoApp;
