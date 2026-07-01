import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ToolCall from './ToolCall';

const phaseConfig = {
  PLAN: { label: 'Planning', color: 'text-blue-600' },
  EXECUTE: { label: 'Executing', color: 'text-amber-600' },
  REVIEW: { label: 'Reviewing', color: 'text-purple-600' },
  DONE: { label: 'Done', color: 'text-green-600' },
};

const mdComponents = {
  h2: ({ children }) => {
    const text = String(children);
    const phase = phaseConfig[text];
    if (phase) {
      return (
        <div className="flex items-center gap-2 mt-4 mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${phase.color}`}>⟡ {phase.label}</span>
        </div>
      );
    }
    return <h2 className="font-heading font-semibold text-base text-gray-900 mt-5 mb-2">{text}</h2>;
  },
  h3: ({ children }) => {
    const text = String(children);
    return <h3 className="font-heading font-semibold text-sm text-gray-700 mt-4 mb-1.5">{text}</h3>;
  },
  code: ({ inline, className, children }) => {
    if (inline) {
      return <code className="font-mono text-[13px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{children}</code>;
    }
    const match = /language-(\w+)/.exec(className || '');
    return <CodeBlock code={String(children).replace(/\n$/, '')} language={match ? match[1] : ''} />;
  },
  p: ({ children }) => <p className="text-[13px] text-gray-700 leading-relaxed my-1.5">{children}</p>,
  li: ({ children }) => <li className="text-[13px] text-gray-700 leading-relaxed ml-4 list-disc">{children}</li>,
  ul: ({ children }) => <ul className="my-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 space-y-0.5 list-decimal ml-4">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
};

function extractTask(content) {
  const match = content.match(/\[TASK\]\s*([\s\S]*)/);
  return match ? match[1].trim() : content.replace(/\[PROJECT CONTEXT\][\s\S]*?(?=\[TASK\]|$)/, '').trim();
}

export default function ChatMessages({ messages, isStreaming }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
        <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
          <span className="text-white text-lg font-bold">α</span>
        </div>
        <h2 className="font-heading text-lg font-semibold text-gray-900">Oikos is ready</h2>
        <p className="text-sm text-gray-500 mt-1.5 max-w-sm">Describe what you want to build and Oikos will read, write, and commit code directly to your repo.</p>
        <div className="mt-8 flex flex-col gap-1.5 max-w-lg w-full">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 text-left">Try asking</p>
          {[
            'Add JWT authentication with refresh tokens',
            'Create a pagination utility for the API',
            'Add input validation to all routes',
          ].map((s) => (
            <div key={s} className="text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-default text-[13px] text-gray-600 font-mono">
              <span className="text-gray-300 mr-2">›</span>{s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-1 max-w-3xl mx-auto font-mono">
      {messages.map((msg, i) => {
        if (msg.role === 'user') {
          const displayText = extractTask(msg.content);
          return (
            <div key={i} className="py-2">
              <div className="flex gap-2">
                <span className="text-green-600 select-none shrink-0">›</span>
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{displayText}</p>
              </div>
            </div>
          );
        }

        const isLast = i === messages.length - 1;
        const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
        const hasContent = msg.content && msg.content.trim();

        return (
          <div key={i} className="py-1">
            {hasContent && (
              <div className="flex gap-2">
                <span className="text-orange-500 select-none shrink-0 mt-0.5">⏺</span>
                <div className="flex-1 min-w-0">
                  <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            )}
            {hasToolCalls && (
              <div className="space-y-0.5 mt-1.5">
                {msg.tool_calls.map((tc, ti) => (
                  <ToolCall key={ti} toolCall={tc} />
                ))}
              </div>
            )}
            {isStreaming && isLast && !hasToolCalls && (
              <div className="flex items-center gap-1.5 mt-2 ml-6">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs text-gray-400">working...</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}