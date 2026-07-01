import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ToolCall from './ToolCall';
import { Brain, Terminal, Search, CheckCircle2, FileSearch } from 'lucide-react';

const phaseConfig = {
  PLAN: { label: 'Planning', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  EXECUTE: { label: 'Executing', icon: Terminal, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  REVIEW: { label: 'Reviewing', icon: Search, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  DONE: { label: 'Complete', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
};

const mdComponents = {
  h2: ({ children }) => {
    const text = String(children);
    const phase = phaseConfig[text];
    if (phase) {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${phase.bg} ${phase.border} border mt-3 mb-1`}>
          <phase.icon className={`w-3 h-3 ${phase.color}`} />
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${phase.color}`}>{phase.label}</span>
        </div>
      );
    }
    return <h2 className="font-heading font-semibold text-sm text-gray-900 mt-3 mb-1">{text}</h2>;
  },
  h3: ({ children }) => {
    const text = String(children);
    return <h3 className="font-heading font-semibold text-[13px] text-gray-700 mt-2.5 mb-1">{text}</h3>;
  },
  code: ({ inline, className, children }) => {
    if (inline) {
      return <code className="font-mono text-[12px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded">{children}</code>;
    }
    const match = /language-(\w+)/.exec(className || '');
    return <CodeBlock code={String(children).replace(/\n$/, '')} language={match ? match[1] : ''} />;
  },
  p: ({ children }) => <p className="text-[13px] text-gray-700 leading-snug my-1">{children}</p>,
  li: ({ children }) => <li className="text-[13px] text-gray-700 leading-snug ml-4 list-disc">{children}</li>,
  ul: ({ children }) => <ul className="my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 space-y-0.5 list-decimal ml-4">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
};

function extractTask(content) {
  const match = content.match(/\[TASK\]\s*([\s\S]*)/);
  return match ? match[1].trim() : content.replace(/\[PROJECT CONTEXT\][\s\S]*?(?=\[TASK\]|$)/, '').trim();
}

function extractFilePath(args) {
  return args.file_path || args.path || args.filePath || args.filename || args.repo_full_name || '';
}

function ReadSummary({ toolCalls }) {
  const files = toolCalls.map((tc) => {
    let args = {};
    try { args = JSON.parse(tc.arguments_string); } catch {}
    return extractFilePath(args);
  }).filter(Boolean);

  const anyActive = toolCalls.some((tc) => ['pending', 'running', 'in_progress'].includes(tc.status));
  const allDone = toolCalls.every((tc) => ['completed', 'success'].includes(tc.status));
  const anyFailed = toolCalls.some((tc) => ['failed', 'error'].includes(tc.status));

  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <FileSearch className={`w-3 h-3 shrink-0 ${anyActive ? 'text-gray-400 animate-pulse' : anyFailed ? 'text-red-400' : 'text-gray-300'}`} />
      <span className="text-[12px] text-gray-400">
        {anyActive ? 'Reading' : 'Read'} {toolCalls.length} file{toolCalls.length > 1 ? 's' : ''}
      </span>
      {allDone && files.length > 0 && (
        <span className="text-[11px] text-gray-300 truncate">
          {files.map((f) => f.split('/').pop()).join(', ')}
        </span>
      )}
    </div>
  );
}

export default function ChatMessages({ messages, isStreaming }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
        <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
          <svg viewBox="0 0 48 48" className="w-12 h-12">
            <defs>
              <linearGradient id="oikosGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M24 4 C13 4 6 12 6 24 C6 36 13 44 24 44 C35 44 42 36 42 24 C42 12 35 4 24 4 Z M24 8 C32 8 38 14 38 24 C38 34 32 40 24 40 C16 40 10 34 10 24 C10 14 16 8 24 8 Z" fill="url(#oikosGrad)" />
            <path d="M24 14 Q30 24 24 34 Q18 24 24 14 Z" fill="url(#oikosGrad)" opacity="0.8" />
            <circle cx="24" cy="24" r="2.5" fill="#8b5cf6" />
          </svg>
        </div>
        <h2 className="font-heading text-base font-semibold text-gray-900">Oikos is ready</h2>
        <p className="text-[13px] text-gray-500 mt-1 max-w-sm leading-relaxed">Describe what you want to build and Oikos will read, write, and commit code directly to your repo.</p>
        <div className="mt-6 flex flex-col gap-1 max-w-lg w-full">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 text-left">Try asking</p>
          {[
            'Add JWT authentication with refresh tokens',
            'Create a pagination utility for the API',
            'Add input validation to all routes',
          ].map((s) => (
            <div key={s} className="text-left px-3 py-1.5 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-default text-[13px] text-gray-600 font-mono">
              <span className="text-gray-300 mr-2">›</span>{s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-4 space-y-0.5 max-w-3xl mx-auto font-mono">
      {messages.map((msg, i) => {
        if (msg.role === 'user') {
          const displayText = extractTask(msg.content);
          return (
            <div key={i} className="py-1.5">
              <div className="flex gap-2">
                <span className="text-green-600 select-none shrink-0">›</span>
                <p className="text-[13px] text-gray-800 leading-snug whitespace-pre-wrap">{displayText}</p>
              </div>
            </div>
          );
        }

        const isLast = i === messages.length - 1;
        const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
        const hasContent = msg.content && msg.content.trim();

        // Split tool calls: reads get collapsed, writes/updates/deletes shown individually
        let readCalls = [];
        let writeCalls = [];
        if (hasToolCalls) {
          msg.tool_calls.forEach((tc) => {
            let args = {};
            try { args = JSON.parse(tc.arguments_string); } catch {}
            const op = args.operation || 'read';
            if (op === 'read') {
              readCalls.push(tc);
            } else {
              writeCalls.push(tc);
            }
          });
        }

        return (
          <div key={i} className="py-0.5">
            {hasContent && (
              <div className="flex gap-2">
                <span className="text-orange-500 select-none shrink-0 mt-0.5">⏺</span>
                <div className="flex-1 min-w-0">
                  <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            )}
            {readCalls.length > 0 && (
              <div className="mt-1 ml-6">
                <ReadSummary toolCalls={readCalls} />
              </div>
            )}
            {writeCalls.length > 0 && (
              <div className="space-y-0 mt-1 ml-6">
                {writeCalls.map((tc, ti) => (
                  <ToolCall key={ti} toolCall={tc} />
                ))}
              </div>
            )}
            {isStreaming && isLast && !hasToolCalls && (
              <div className="flex items-center gap-1.5 mt-1 ml-6">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-[11px] text-gray-400">working</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}