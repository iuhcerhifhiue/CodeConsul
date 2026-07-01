import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ToolCall from './ToolCall';

const phaseConfig = {
  PLAN: { symbol: '◇', color: 'text-blue-400', label: 'Planning' },
  EXECUTE: { symbol: '◆', color: 'text-amber-400', label: 'Executing' },
  REVIEW: { symbol: '◇', color: 'text-purple-400', label: 'Reviewing' },
  DONE: { symbol: '✓', color: 'text-green-400', label: 'Complete' },
};

const mdComponents = {
  h2: ({ children }) => {
    const text = String(children);
    const phase = phaseConfig[text];
    if (phase) {
      return (
        <div className="flex items-center gap-2 mt-5 mb-2">
          <span className={`font-mono text-sm ${phase.color}`}>{phase.symbol}</span>
          <span className={`font-mono text-[11px] uppercase tracking-[0.15em] ${phase.color}`}>{phase.label}</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      );
    }
    return <h2 className="font-mono text-sm text-white/80 mt-4 mb-2 font-semibold">{text}</h2>;
  },
  h3: ({ children }) => {
    const text = String(children);
    if (text.startsWith('→') || text.startsWith('—')) {
      return <h3 className="font-mono text-xs text-amber-400/80 mt-3 mb-1">{text}</h3>;
    }
    return <h3 className="font-mono text-xs text-white/60 mt-3 mb-1 font-semibold">{text}</h3>;
  },
  code: ({ inline, className, children }) => {
    if (inline) {
      return <code className="font-mono text-[11px] text-amber-300/90 bg-white/[0.06] px-1.5 py-0.5 rounded">{children}</code>;
    }
    const match = /language-(\w+)/.exec(className || '');
    return <CodeBlock code={String(children).replace(/\n$/, '')} language={match ? match[1] : ''} />;
  },
  p: ({ children }) => <p className="font-mono text-xs text-white/55 leading-[1.7] my-1.5">{children}</p>,
  li: ({ children }) => <li className="font-mono text-xs text-white/55 leading-[1.7] ml-4 list-disc">{children}</li>,
  ul: ({ children }) => <ul className="my-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 space-y-0.5 list-decimal ml-4">{children}</ol>,
  strong: ({ children }) => <strong className="text-white/80 font-semibold">{children}</strong>,
};

function extractTask(content) {
  const match = content.match(/\[TASK\]\s*([\s\S]*)/);
  return match ? match[1].trim() : content.replace(/\[PROJECT CONTEXT\][\s\S]*?(?=\[TASK\]|$)/, '').trim();
}

export default function TerminalOutput({ messages, isStreaming }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="relative mb-6">
          <div className="w-14 h-14 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] flex items-center justify-center">
            <span className="font-mono text-lg text-amber-400/60">◈</span>
          </div>
          <div className="absolute inset-0 rounded-xl border border-amber-400/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        <p className="font-mono text-sm text-white/50">Oikos is ready</p>
        <p className="font-mono text-xs text-white/25 mt-1.5">Describe what you want to build</p>
        <div className="mt-8 grid gap-1.5 max-w-md">
          <p className="font-mono text-[10px] text-white/15 uppercase tracking-wider mb-1">Try</p>
          {[
            'Add JWT authentication with refresh tokens',
            'Create a pagination utility for the API',
            'Add input validation to all routes',
          ].map((s) => (
            <p key={s} className="font-mono text-[11px] text-white/20 hover:text-amber-400/50 transition-colors cursor-default">
              <span className="text-amber-400/30 mr-1.5">›</span>{s}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-5 space-y-5 min-h-full max-w-4xl mx-auto">
      {messages.map((msg, i) => {
        if (msg.role === 'user') {
          const displayText = extractTask(msg.content);
          return (
            <div key={i} className="flex items-start gap-2.5 group">
              <span className="font-mono text-xs text-amber-400/60 mt-0.5 shrink-0 select-none">›</span>
              <p className="font-mono text-sm text-white/85 leading-relaxed">{displayText}</p>
            </div>
          );
        }

        const isLast = i === messages.length - 1;
        const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
        const hasContent = msg.content && msg.content.trim();

        return (
          <div key={i} className="space-y-1">
            {hasContent && (
              <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
            )}
            {hasToolCalls && (
              <div className="space-y-0">
                {msg.tool_calls.map((tc, ti) => (
                  <ToolCall key={ti} toolCall={tc} />
                ))}
              </div>
            )}
            {isStreaming && isLast && !hasToolCalls && (
              <span className="inline-block w-2 h-4 bg-amber-400/70 animate-pulse align-middle ml-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}