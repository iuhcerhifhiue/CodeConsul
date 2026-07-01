import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

const phaseConfig = {
  PLAN: { color: 'text-cyan-400/50', label: '// PLAN' },
  EXECUTE: { color: 'text-white/80', label: '// EXECUTE' },
  REVIEW: { color: 'text-orange-400', label: '// REVIEW' },
  DONE: { color: 'text-green-400', label: '// DONE' },
};

const markdownComponents = {
  h2: ({ children }) => {
    const text = String(children);
    const phase = phaseConfig[text];
    if (phase) {
      return <h2 className={`font-mono text-xs uppercase tracking-widest mt-4 mb-2 ${phase.color}`}>{phase.label}</h2>;
    }
    return <h2 className="font-mono text-sm text-white/80 mt-4 mb-2">{text}</h2>;
  },
  h3: ({ children }) => {
    const text = String(children);
    if (text.startsWith('→')) {
      return <h3 className="font-mono text-xs text-cyan-400 mt-3 mb-1">{text}</h3>;
    }
    return <h3 className="font-mono text-xs text-white/70 mt-3 mb-1">{text}</h3>;
  },
  code: ({ inline, className, children }) => {
    if (inline) {
      return <code className="font-mono text-xs text-cyan-300 bg-white/5 px-1 rounded">{children}</code>;
    }
    const match = /language-(\w+)/.exec(className || '');
    return <CodeBlock code={String(children).replace(/\n$/, '')} language={match ? match[1] : ''} />;
  },
  p: ({ children }) => <p className="font-mono text-xs text-white/60 leading-relaxed my-1">{children}</p>,
  li: ({ children }) => <li className="font-mono text-xs text-white/60 leading-relaxed ml-4">{children}</li>,
  ul: ({ children }) => <ul className="my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 space-y-0.5 list-decimal ml-4">{children}</ol>,
};

function extractTask(content) {
  const match = content.match(/\[TASK\]\s*([\s\S]*)/);
  return match ? match[1].trim() : content;
}

export default function TerminalOutput({ messages, isStreaming }) {
  return (
    <div className="px-4 py-4 space-y-4 min-h-full">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center pt-20">
          <div className="w-12 h-12 rounded-lg border border-cyan-400/20 flex items-center justify-center mb-4">
            <span className="font-mono text-xs text-cyan-400/40">O</span>
          </div>
          <p className="font-mono text-sm text-white/30">Oikos is ready.</p>
          <p className="font-mono text-xs text-white/20 mt-1">Describe what you want to build below.</p>
          <div className="mt-6 space-y-1">
            <p className="font-mono text-[10px] text-white/10">Try:</p>
            <p className="font-mono text-[10px] text-white/15">"Add JWT authentication with refresh tokens"</p>
            <p className="font-mono text-[10px] text-white/15">"Create a pagination utility for the API"</p>
            <p className="font-mono text-[10px] text-white/15">"Add input validation to all routes"</p>
          </div>
        </div>
      ) : (
        messages.map((msg, i) => {
          if (msg.role === 'user') {
            const displayText = extractTask(msg.content);
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="font-mono text-xs text-cyan-400/70 mt-0.5 shrink-0">$</span>
                <p className="font-mono text-sm text-white/90 leading-relaxed">{displayText}</p>
              </div>
            );
          }
          const isLast = i === messages.length - 1;
          return (
            <div key={i} className="space-y-1">
              <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
              {isStreaming && isLast && (
                <span className="inline-block w-2 h-4 bg-orange-400 animate-pulse align-middle" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}