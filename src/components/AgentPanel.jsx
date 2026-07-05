import { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Layout, Server, Terminal, CheckCircle, Eye,
  Database, Network, Gauge, FileText, Bug, Shield, Cloud, Smartphone,
  BarChart3, Wand2, Compass, Brain, Zap, Accessibility, ArrowRightLeft, Activity, Box, Globe,
  FileSearch, FilePen, Trash2, Clock,
} from 'lucide-react';
import { AGENT_INFO } from '@/lib/plans';

const ICON_MAP = {
  Layout, Server, Terminal, CheckCircle, Eye,
  Database, Network, Gauge, FileText, Bug, Shield, Cloud, Smartphone,
  BarChart3, Wand2, Compass, Brain, Zap, Accessibility, ArrowRightLeft, Activity, Globe,
};

function getCurrentAction(messages, isActive) {
  let lastToolCall = null;
  let lastContent = null;

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      if (msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) lastToolCall = tc;
      }
      if (msg.content?.trim()) lastContent = msg.content;
    }
  }

  if (lastToolCall) {
    let args = {};
    try { args = JSON.parse(lastToolCall.arguments_string); } catch {}
    const op = args.operation || 'read';
    const path = args.file_path || args.path || '';
    const fileName = path ? path.split('/').pop() : '';
    const inProgress = ['pending', 'running', 'in_progress'].includes(lastToolCall.status);
    const verb = { read: 'Reading', write: 'Writing', edit: 'Editing', update: 'Updating', delete: 'Deleting' }[op] || op;
    return { type: op, verb, fileName, fullPath: path, inProgress: inProgress && isActive };
  }

  if (lastContent && isActive) return { type: 'thinking', verb: 'Thinking', fileName: '', inProgress: true };
  return null;
}

function getStats(messages) {
  let reads = 0, writes = 0, edits = 0, deletes = 0, searches = 0;
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    for (const tc of msg.tool_calls || []) {
      if (!['completed', 'success'].includes(tc.status)) continue;
      let args = {};
      try { args = JSON.parse(tc.arguments_string); } catch {}
      const fn = tc.name || args.operation || 'read';
      if (fn === 'githubSearch' || fn === 'search') searches++;
      else if (fn === 'delete' || args.operation === 'delete') deletes++;
      else if (fn === 'edit' || args.operation === 'edit') edits++;
      else if (fn === 'write' || args.operation === 'write' || fn === 'update' || args.operation === 'update') writes++;
      else reads++;
    }
  }
  return { reads, writes, edits, deletes, searches };
}

function ElapsedTimer({ startTime, isRunning }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning || !startTime) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  if (!startTime) return null;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="flex items-center gap-0.5 text-[9px] text-black/30 font-mono">
      <Clock className="w-2.5 h-2.5" />
      {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}
    </span>
  );
}

export default function AgentPanel({ agentName, messages, status, task }) {
  const [expanded, setExpanded] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const scrollRef = useRef(null);
  const info = AGENT_INFO[agentName];
  const Icon = info ? (ICON_MAP[info.icon] || Box) : Box;

  const isActive = status === 'working';
  const isDone = status === 'done';
  const isFailed = status === 'failed';

  useEffect(() => {
    if (isActive && !startTime) setStartTime(Date.now());
  }, [isActive, startTime]);

  const currentAction = useMemo(() => getCurrentAction(messages, isActive), [messages, isActive]);
  const stats = useMemo(() => getStats(messages), [messages]);

  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expanded]);

  const actionIcon = currentAction?.type === 'read' ? FileSearch
    : ['write', 'edit', 'update'].includes(currentAction?.type) ? FilePen
    : currentAction?.type === 'delete' ? Trash2
    : currentAction?.type === 'thinking' ? Brain : null;

  return (
    <div
      className={`border rounded-xl overflow-hidden bg-white transition-all ${
        isActive ? 'border-[#5046E5]/30 ring-1 ring-[#5046E5]/10' : isDone ? 'border-black/[0.08]' : 'border-black/[0.06]'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-black/[0.04] hover:bg-[#FAFAFA] transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-[#5046E5]' : 'bg-[#F4F4F5]'}`}>
          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-black/50'}`} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-semibold truncate">{info?.name || agentName}</p>
          {task && <p className="text-[10px] text-black/30 truncate">{task.substring(0, 60)}{task.length > 60 ? '...' : ''}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isActive && <ElapsedTimer startTime={startTime} isRunning={isActive} />}
          {isActive && <Loader2 className="w-3 h-3 animate-spin text-[#5046E5]" />}
          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#5046E5]" />}
          {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-black/30" /> : <ChevronDown className="w-3.5 h-3.5 text-black/30" />}
        </div>
      </button>

      {/* Live status bar */}
      {isActive && currentAction && (
        <div className="px-4 py-1.5 bg-[#5046E5]/[0.04] border-b border-black/[0.04] flex items-center gap-2">
          {actionIcon && <actionIcon className={`w-3 h-3 shrink-0 ${currentAction.inProgress ? 'text-[#5046E5]' : 'text-black/30'}`} />}
          <span className="text-[10px] font-semibold text-[#5046E5]">{currentAction.verb}</span>
          {currentAction.fileName && (
            <span className="text-[10px] text-black/50 truncate font-mono">{currentAction.fileName}</span>
          )}
          {currentAction.inProgress && (
            <span className="flex gap-0.5 ml-auto shrink-0">
              <span className="w-1 h-1 rounded-full bg-[#5046E5] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-[#5046E5] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-[#5046E5] animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
      )}

      {/* Stats bar */}
      {(stats.reads > 0 || stats.writes > 0 || stats.edits > 0 || stats.deletes > 0 || stats.searches > 0) && (
        <div className="flex items-center gap-3 px-4 py-1 border-b border-black/[0.04] bg-[#FAFAFA]/50">
          {stats.searches > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-black/40">
              <FileSearch className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.searches}</span> searched
            </span>
          )}
          {stats.reads > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-black/40">
              <FileSearch className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.reads}</span> read
            </span>
          )}
          {stats.writes > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-[#5046E5]">
              <FilePen className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.writes}</span> written
            </span>
          )}
          {stats.edits > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-[#5046E5]">
              <FilePen className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.edits}</span> edited
            </span>
          )}
          {stats.deletes > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-red-500">
              <Trash2 className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.deletes}</span> deleted
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      {expanded && (
        <div ref={scrollRef} className="max-h-64 overflow-y-auto p-3 space-y-1 font-mono">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-2 py-1">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-black/20" />
                <p className="text-[11px] text-black/30">Waiting for {info?.name}...</p>
              </div>
              {task && (
                <div className="px-2 py-1.5 rounded-lg bg-[#FAFAFA] border border-black/[0.04]">
                  <p className="text-[9px] text-black/30 uppercase tracking-wide mb-0.5">Assigned task</p>
                  <p className="text-[10px] text-black/50 leading-snug">{task}</p>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div className="flex gap-1.5 py-0.5">
                    <span className="text-[#5046E5] select-none shrink-0">›</span>
                    <p className="text-[11px] text-black/50 leading-snug">{msg.content?.replace(/\[PROJECT CONTEXT\][\s\S]*?(?=\[TASK\]|$)/, '').replace('[TASK]', '').trim()}</p>
                  </div>
                ) : (
                  <>
                    {msg.content && (
                      <div className="text-[11px] text-black/70 leading-snug">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="my-0.5">{children}</p>,
                            li: ({ children }) => <li className="ml-3 list-disc">{children}</li>,
                            code: ({ inline, children }) => inline
                              ? <code className="text-[10px] bg-[#F4F4F5] px-1 rounded">{children}</code>
                              : <pre className="text-[10px] bg-[#FAFAFA] p-2 rounded my-1 overflow-x-auto">{children}</pre>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {msg.tool_calls?.map((tc, ti) => {
                      let args = {};
                      try { args = JSON.parse(tc.arguments_string); } catch {}
                      const path = args.file_path || args.path || args.query || '';
                      const isSearch = (tc.name === 'githubSearch' || args.operation === 'search');
                      const op = isSearch ? 'search' : (args.operation || 'read');
                      const done = ['completed', 'success'].includes(tc.status);
                      const failed = ['failed', 'error'].includes(tc.status);
                      const inProgress = ['pending', 'running', 'in_progress'].includes(tc.status);
                      const opLabel = isSearch ? 'search' : op;
                      const displayPath = isSearch ? `"${path}"` : path;
                      return (
                        <div key={ti} className={`flex items-center gap-1.5 py-0.5 text-[10px] ${inProgress ? 'bg-[#5046E5]/[0.04] -mx-1 px-1 rounded' : ''}`}>
                          {done ? <CheckCircle2 className="w-2.5 h-2.5 text-[#5046E5] shrink-0" />
                            : failed ? <AlertCircle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                            : <Loader2 className="w-2.5 h-2.5 animate-spin text-[#5046E5] shrink-0" />}
                          <span className={failed ? 'text-red-500 font-bold' : inProgress ? 'text-[#5046E5] font-bold' : 'text-black/40'}>
                            {opLabel}
                          </span>
                          {displayPath && <span className="text-black/60 truncate font-mono">{displayPath.split('/').pop() || displayPath}</span>}
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