import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Layout, Server, Terminal, CheckCircle, Shield, Compass, Box } from 'lucide-react';
import { AGENT_INFO } from '@/lib/plans';

const ICON_MAP = {
  Layout,
  Server,
  Terminal,
  CheckCircle,
  Shield,
  Compass,
};

export default function AgentPanel({ agentName, messages, status, task }) {
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef(null);
  const info = AGENT_INFO[agentName];
  const Icon = info ? (ICON_MAP[info.icon] || Box) : Box;

  const isActive = status === 'working';
  const isDone = status === 'done';
  const isFailed = status === 'failed';

  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expanded]);

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white transition-all ${
        isActive ? 'border-black ring-1 ring-editorial' : isDone ? 'border-black' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${isActive ? 'bg-editorial' : 'bg-gray-100'}`}>
          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-gray-500'}`} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-bold truncate">{info?.name || agentName}</p>
          {task && <p className="text-[10px] text-gray-400 truncate">{task.substring(0, 50)}{task.length > 50 ? '...' : ''}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isActive && <Loader2 className="w-3 h-3 animate-spin text-black" />}
          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
          {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {/* Messages */}
      {expanded && (
        <div ref={scrollRef} className="max-h-64 overflow-y-auto p-3 space-y-1 font-mono">
          {messages.length === 0 ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 className="w-3 h-3 animate-spin text-gray-300" />
              <p className="text-[11px] text-gray-400">Waiting for {info?.name}...</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div className="flex gap-1.5 py-0.5">
                    <span className="text-green-600 select-none shrink-0">›</span>
                    <p className="text-[11px] text-gray-600 leading-snug">{msg.content?.replace(/\[PROJECT CONTEXT\][\s\S]*?(?=\[TASK\]|$)/, '').replace('[TASK]', '').trim()}</p>
                  </div>
                ) : (
                  <>
                    {msg.content && (
                      <div className="text-[11px] text-gray-700 leading-snug">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="my-0.5">{children}</p>,
                            li: ({ children }) => <li className="ml-3 list-disc">{children}</li>,
                            code: ({ inline, children }) => inline
                              ? <code className="text-[10px] bg-gray-100 px-1 rounded">{children}</code>
                              : <pre className="text-[10px] bg-gray-50 p-2 rounded my-1 overflow-x-auto">{children}</pre>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {msg.tool_calls?.map((tc, ti) => {
                      let args = {};
                      try { args = JSON.parse(tc.arguments_string); } catch {}
                      const path = args.file_path || args.path || '';
                      const done = ['completed', 'success'].includes(tc.status);
                      const failed = ['failed', 'error'].includes(tc.status);
                      return (
                        <div key={ti} className="flex items-center gap-1.5 py-0.5 text-[10px]">
                          {done ? <CheckCircle2 className="w-2.5 h-2.5 text-black shrink-0" /> : failed ? <AlertCircle className="w-2.5 h-2.5 text-red-500 shrink-0" /> : <Loader2 className="w-2.5 h-2.5 animate-spin text-gray-400 shrink-0" />}
                          <span className={failed ? 'text-red-500' : 'text-gray-500'}>{args.operation || 'read'}</span>
                          {path && <span className="text-gray-700 truncate">{path}</span>}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}