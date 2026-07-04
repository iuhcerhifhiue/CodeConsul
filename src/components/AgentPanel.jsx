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

// Derive the single most recent action from the agent's tool calls — what it's
// doing RIGHT NOW (or the last thing it did if it's thinking between calls).
function getCurrentAction(messages, isActive) {
  let lastToolCall = null;
  let lastContent = null;

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      if (msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          lastToolCall = tc;
        }
      }
      if (msg.content?.trim()) {
        lastContent = msg.content;
      }
    }
  }

  if (lastToolCall) {
    let args = {};
    try { args = JSON.parse(lastToolCall.arguments_string); } catch {}
    const op = args.operation || 'read';
    const path = args.file_path || args.path || '';
    const fileName = path ? path.split('/').pop() : '';
    const inProgress = ['pending', 'running', 'in_progress'].includes(lastToolCall.status);

    const verb = {
      read: 'Reading',
      write: 'Writing',
      edit: 'Editing',
      update: 'Updating',
      delete: 'Deleting',
    }[op] || op;

    return {
      type: op,
      verb,
      fileName,
      fullPath: path,
      inProgress: inProgress && isActive,
      status: lastToolCall.status,
    };
  }

  if (lastContent && isActive) {
    return { type: 'thinking', verb: 'Thinking', fileName: '', inProgress: true };
  }

  return null;
}

// Count file operations across all messages for a quick stat readout.
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
    <span className="flex items-center gap-0.5 text-[9px] text-gray-400 font-mono">
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

  // Start timer when agent becomes active; clear when done/failed
  useEffect(() => {
    if (isActive && !startTime) setStartTime(Date.now());
    if (!isActive) {/* keep the elapsed value frozen on completion */}
  }, [isActive, startTime]);

  const currentAction = useMemo(() => getCurrentAction(messages, isActive), [messages, isActive]);
  const stats = useMemo(() => getStats(messages), [messages]);

  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expanded]);

  const actionIcon = currentAction?.type === 'read' ? FileSearch
    : currentAction?.type === 'write' ? FilePen
    : currentAction?.type === 'edit' || currentAction?.type === 'update' ? FilePen
    : currentAction?.type === 'delete' ? Trash2
    : currentAction?.type === 'thinking' ? Brain
    : null;

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
          {task && <p className="text-[10px] text-gray-400 truncate">{task.substring(0, 60)}{task.length > 60 ? '...' : ''}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isActive && <ElapsedTimer startTime={startTime} isRunning={isActive} />}
          {isActive && <Loader2 className="w-3 h-3 animate-spin text-black" />}
          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
          {isFailed && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {/* Live status bar — shows what the agent is doing RIGHT NOW */}
      {isActive && currentAction && (
        <div className="px-3 py-1.5 bg-[#FFFBEA] border-b border-gray-100 flex items-center gap-2 animate-pulse">
          {actionIcon && <actionIcon className={`w-3 h-3 shrink-0 ${currentAction.inProgress ? 'text-black' : 'text-gray-400'}`} />}
          <span className="text-[10px] font-bold text-black">
            {currentAction.verb}
          </span>
          {currentAction.fileName && (
            <span className="text-[10px] text-gray-600 truncate font-mono">{currentAction.fileName}</span>
          )}
          {currentAction.inProgress && (
            <span className="flex gap-0.5 ml-auto shrink-0">
              <span className="w-1 h-1 rounded-full bg-black animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-black animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-black animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
      )}

      {/* Stats bar — file operation counts */}
      {(stats.reads > 0 || stats.writes > 0 || stats.edits > 0 || stats.deletes > 0 || stats.searches > 0) && (
        <div className="flex items-center gap-3 px-3 py-1 border-b border-gray-50 bg-gray-50/50">
          {stats.searches > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-gray-500">
              <FileSearch className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.searches}</span> searched
            </span>
          )}
          {stats.reads > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-gray-500">
              <FileSearch className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.reads}</span> read
            </span>
          )}
          {stats.writes > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-black">
              <FilePen className="w-2.5 h-2.5" />
              <span className="font-bold">{stats.writes}</span> written
            </span>
          )}
          {stats.edits > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-black">
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
                <Loader2 className="w-3 h-3 animate-spin text-gray-300" />
                <p className="text-[11px] text-gray-400">Waiting for {info?.name}...</p>
              </div>
              {task && (
                <div className="px-2 py-1.5 rounded bg-gray-50 border border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Assigned task</p>
                  <p className="text-[10px] text-gray-600 leading-snug">{task}</p>
                </div>
              )}
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
                      const path = args.file_path || args.path || args.query || '';
                      const isSearch = (tc.name === 'githubSearch' || args.operation === 'search');
                      const op = isSearch ? 'search' : (args.operation || 'read');
                      const done = ['completed', 'success'].includes(tc.status);
                      const failed = ['failed', 'error'].includes(tc.status);
                      const inProgress = ['pending', 'running', 'in_progress'].includes(tc.status);
                      const opLabel = isSearch ? 'search' : op;
                      const displayPath = isSearch ? `"${path}"` : path;
                      return (
                        <div key={ti} className={`flex items-center gap-1.5 py-0.5 text-[10px] ${inProgress ? 'bg-[#FFFBEA] -mx-1 px-1 rounded' : ''}`}>
                          {done ? <CheckCircle2 className="w-2.5 h-2.5 text-black shrink-0" />
                            : failed ? <AlertCircle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                            : <Loader2 className="w-2.5 h-2.5 animate-spin text-black shrink-0" />}
                          <span className={failed ? 'text-red-500 font-bold' : inProgress ? 'text-black font-bold' : 'text-gray-500'}>
                            {opLabel}
                          </span>
                          {displayPath && <span className="text-gray-700 truncate font-mono">{displayPath.split('/').pop() || displayPath}</span>}
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