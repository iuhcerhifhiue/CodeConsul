import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ToolCall from './ToolCall';
import { Bot } from 'lucide-react';

const phaseConfig = {
  PLAN: { symbol: 'Planning', color: 'text-blue-600', bg: 'bg-blue-50' },
  EXECUTE: { symbol: 'Executing', color: 'text-amber-600', bg: 'bg-amber-50' },
  REVIEW: { symbol: 'Reviewing', color: 'text-purple-600', bg: 'bg-purple-50' },
  DONE: { symbol: 'Complete', color: 'text-green-600', bg: 'bg-green-50' },
};

const mdComponents = {
  h2: ({ children }) => {
    const text = String(children);
    const phase = phaseConfig[text];
    if (phase) {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${phase.bg} ${phase.color} text-xs font-semibold mt-4 mb-2`}>
          {phase.symbol}
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
  p: ({ children }) => <p className="text-sm text-gray-600 leading-relaxed my-2">{children}</p>,
  li: ({ children }) => <li className="text-sm text-gray-600 leading-relaxed ml-5 list-disc">{children}</li>,
  ul: ({ children }) => <ul className="my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal ml-5">{children}</ol>,
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
        <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mb-5">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-heading text-xl font-semibold text-gray-900">Oikos is ready</h2>
        <p className="text-gray-500 mt-2">Describe what you want to build and Oikos will write the code directly to your repo.</p>
        <div className="mt-8 grid gap-2 max-w-md w-full">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Try these</p>
          {[
            'Add JWT authentication with refresh tokens',
            'Create a pagination utility for the API',
            'Add input validation to all routes',
          ].map((s) => (
            <div key={s} className="text-left px-4 py-2.5 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-default text-sm text-gray-600">
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 space-y-6 max-w-4xl mx-auto">
      {messages.map((msg, i) => {
        if (msg.role === 'user') {
          const displayText = extractTask(msg.content);
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] bg-gray-900 text-white rounded-2xl rounded-tr-md px-4 py-2.5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayText}</p>
              </div>
            </div>
          );
        }

        const isLast = i === messages.length - 1;
        const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
        const hasContent = msg.content && msg.content.trim();

        return (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {hasContent && (
                <div className="text-gray-700">
                  <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                </div>
              )}
              {hasToolCalls && (
                <div className="space-y-1.5">
                  {msg.tool_calls.map((tc, ti) => (
                    <ToolCall key={ti} toolCall={tc} />
                  ))}
                </div>
              )}
              {isStreaming && isLast && !hasToolCalls && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}