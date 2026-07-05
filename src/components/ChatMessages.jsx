import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ToolCall from './ToolCall';
import { Brain, Terminal, Search, CheckCircle2, FileSearch } from 'lucide-react';

const phaseConfig = {
  PLAN: { label: 'Planning', icon: Brain, color: 'text-[#5046E5]', bg: 'bg-[#5046E5]/[0.06]', border: 'border-[#5046E5]/10' },
  EXECUTE: { label: 'Executing', icon: Terminal, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  REVIEW: { label: 'Reviewing', icon: Search, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  DONE: { label: 'Complete', icon: CheckCircle2, color: 'text-[#5046E5]', bg: 'bg-[#5046E5]/[0.06]', border: 'border-[#5046E5]/10' },
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
    return <h2 className="font-heading font-semibold text-sm text-black mt-3 mb-1">{text}</h2>;
  },
  h3: ({ children }) => <h3 className="font-heading font-semibold text-[13px] text-black/70 mt-2.5 mb-1">{String(children)}</h3>,
  code: ({ inline, className, children }) => {
    if (inline) return <code className="font-mono text-[12px] text-[#5046E5] bg-[#5046E5]/[0.06] px-1 py-0.5 rounded">{children}</code>;
    const match = /language-(\w+)/.exec(className || '');
    return <CodeBlock code={String(children).replace(/\n$/, '')} language={match ? match[1] : ''} />;
  },
  p: ({ children }) => <p className="text-[13px] text-black/70 leading-snug my-1">{children}</p>,
  li: ({ children }) => <li className="text-[13px] text-black/70 leading-snug ml-4 list-disc">{children}</li>,
  ul: ({ children }) => <ul className="my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 space-y-0.5 list-decimal ml-4">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-black">{children}</strong>,
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
      <FileSearch className={`w-3 h-3 shrink-0 ${anyActive ? 'text-[#5046E5] animate-pulse' : anyFailed ? 'text-red-400' : 'text-black/20'}`} />
      <span className="text-[12px] text-black/40">
        {anyActive ? 'Reading' : 'Read'} {toolCalls.length} file{toolCalls.length > 1 ? 's' : ''}
      </span>
      {allDone && files.length > 0 && (
        <span className="text-[11px] text-black/30 truncate">
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
            <rect x="2" y="2" width="44" height="44" rx="12" fill="#0D0D0D" />
            <rect x="12" y="12" width="24" height="24" rx="6" fill="#5046E5" />
            <rect x="18" y="18" width="12" height="12" rx="3" fill="#0D0D0D" />
            <circle cx="24" cy="24" r="2" fill="#5046E5" />
          </svg>
        </div>
        <h2 className="font-heading text-base font-semibold text-black">Oikos is ready</h2>
        <p className="text-[13px] text-black/40 mt-1 max-w-sm leading-relaxed">Describe what you want to build and Oikos will read, write, and commit code directly to your repo.</p>
        <div className="mt-6 flex flex-col gap-1 max-w-lg w-full">
          <p className="text-[11px] font-medium text-black/30 uppercase tracking-wider mb-1 text-left">Try asking</p>
          {[
            'Add JWT authentication with refresh tokens',
            'Create a pagination utility for the API',
            'Add input validation to all routes',
          ].map((s) => (
            <div key={s} className="text-left px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-black/[0.12] hover:bg-[#FAFAFA] transition-colors cursor-default text-[13px] text-black/50 font-mono">
              <span className="text-black/20 mr-2">›</span>{s}
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
                <span className="text-[#5046E5] select-none shrink-0">›</span>
                <p className="text-[13px] text-black/80 leading-snug whitespace-pre-wrap">{displayText}</p>
              </div>
            </div>
          );
        }

        const isLast = i === messages.length - 1;
        const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
        const hasContent = msg.content && msg.content.trim();

        let readCalls = [];
        let writeCalls = [];
        if (hasToolCalls) {
          msg.tool_calls.forEach((tc) => {
            let args = {};
            try { args = JSON.parse(tc.arguments_string); } catch {}
            const op = args.operation || 'read';
            if (op === 'read') readCalls.push(tc);
            else writeCalls.push(tc);
          });
        }

        return (
          <div key={i} className="py-0.5">
            {hasContent && (
              <div className="flex gap-2">
                <span className="text-[#5046E5] select-none shrink-0 mt-0.5">⏺</span>
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
                <div className="w-1.5 h-1.5 rounded-full bg-[#5046E5] animate-pulse" />
                <span className="text-[11px] text-black/30">working</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}