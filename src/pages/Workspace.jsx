import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Send, Github, Loader2, GitPullRequest,
  Clock, FileSearch, FilePen, AlertCircle,
} from 'lucide-react';
import { PLANS } from '@/lib/plans';
import ChatMessages from '@/components/ChatMessages';
import Logo from '@/components/Logo';

function computeStats(messages) {
  let reads = 0, writes = 0;
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    for (const tc of msg.tool_calls || []) {
      if (!['completed', 'success'].includes(tc.status)) continue;
      let args = {};
      try { args = JSON.parse(tc.arguments_string); } catch {}
      const op = args.operation || 'read';
      if (op === 'read') reads++;
      else if (['write', 'edit', 'update'].includes(op)) writes++;
    }
  }
  return { reads, writes };
}

export default function Workspace() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prUrl, setPrUrl] = useState('');
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const branchRef = useRef('');
  const taskRef = useRef('');
  const isWorkingRef = useRef(false);

  useEffect(() => {
    loadProject();
    loadUser();
  }, [projectId]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      if (
        isWorkingRef.current &&
        !data.is_processing &&
        data.messages?.some((m) => m.role === 'assistant')
      ) {
        isWorkingRef.current = false;
        setIsWorking(false);
        openPR();
      }
    });
    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    if (!isWorking || !startTime) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isWorking, startTime]);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setUserPlan(u.plan || 'free');
    } catch {}
  };

  const loadProject = async () => {
    try {
      const proj = await base44.entities.Project.get(projectId);
      setProject(proj);

      // Always create a fresh Consul conversation — old sessions may have been
      // created with the deleted "oikos" agent and must not be reused.
      const oldSessions = await base44.entities.Session.filter({ project_id: projectId });
      for (const s of oldSessions) {
        try { await base44.entities.Session.delete(s.id); } catch {}
      }
      const conv = await base44.agents.createConversation({
        agent_name: 'consul',
        metadata: { name: proj.repo_name, description: `Session for ${proj.repo_name}` },
      });
      await base44.entities.Session.create({
        project_id: projectId,
        conversation_id: conv.id,
        title: `Session for ${proj.repo_name}`,
      });
      setConversationId(conv.id);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const buildContext = (task) => {
    const parts = [];
    if (project?.repo_full_name) parts.push(`Repository: ${project.repo_full_name}`);
    if (project?.stack) parts.push(`Stack: ${project.stack}`);
    if (project?.file_tree) {
      const truncated = project.file_tree.length > 8000
        ? project.file_tree.substring(0, 8000) + '\n... (truncated)'
        : project.file_tree;
      parts.push(`File Tree:\n${truncated}`);
    }
    if (branchRef.current) {
      parts.push(
        `Task Branch: ${branchRef.current}\nIMPORTANT: Pass { "branch": "${branchRef.current}" } on EVERY githubWrite call so changes land on this branch.`,
      );
    }
    return parts.length > 0 ? `[PROJECT CONTEXT]\n${parts.join('\n')}\n\n[TASK]\n${task}` : task;
  };

  const openPR = async () => {
    if (!branchRef.current || !project?.repo_full_name) return;
    try {
      const res = await base44.functions.invoke('githubPullRequest', {
        operation: 'open',
        repo_full_name: project.repo_full_name,
        branch: branchRef.current,
        title: `Consul: ${taskRef.current.substring(0, 60)}`,
        pr_body: `Automated changes by Consul.\n\nTask: ${taskRef.current}\n\nReview before merging.`,
      });
      if (res.data?.url) setPrUrl(res.data.url);
    } catch (err) {
      console.error('Failed to open PR:', err);
    }
  };

  const handleTask = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isWorking) return;

    const task = input.trim();
    taskRef.current = task;
    setInput('');
    setError('');
    setPrUrl('');
    setElapsed(0);

    try {
      if (project?.repo_full_name) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        try {
          const res = await base44.functions.invoke('githubPullRequest', {
            operation: 'ensure_branch',
            repo_full_name: project.repo_full_name,
            branch: `consul/${stamp}`,
          });
          if (res.data?.branch) branchRef.current = res.data.branch;
        } catch (err) {
          console.error('Failed to create branch:', err);
        }
      }

      const contextMessage = buildContext(task);
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: 'user', content: contextMessage });

      isWorkingRef.current = true;
      setIsWorking(true);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to send task:', err);
      setError(err.message || 'Failed to send task');
      setIsWorking(false);
      isWorkingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#5046E5]" />
      </div>
    );
  }

  const stats = computeStats(messages);

  return (
    <div className="h-screen flex flex-col bg-white text-black font-body">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-black/[0.06] shrink-0">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo size={22} />
          <span className="font-heading font-bold text-sm tracking-tight hidden sm:block">Consul</span>
        </Link>
        <div className="w-px h-5 bg-black/[0.08] shrink-0" />
        <Link to="/dashboard" className="text-black/30 hover:text-black transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <Github className="w-4 h-4 shrink-0 text-black/40" />
          <span className="text-sm font-semibold truncate">{project?.repo_full_name}</span>
        </div>
        {project?.stack && (
          <span className="text-[11px] text-[#5046E5] bg-[#5046E5]/[0.08] px-2 py-0.5 rounded font-medium hidden sm:block">
            {project.stack}
          </span>
        )}
        <Link
          to="/plans"
          className="ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#0D0D0D] text-white hover:bg-black/80 transition-colors shrink-0"
        >
          {PLANS[userPlan]?.name?.toUpperCase() || 'FREE'}
        </Link>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={messages} isStreaming={isWorking} />
      </div>

      {/* Stats bar */}
      {(isWorking || stats.reads > 0 || stats.writes > 0 || prUrl) && (
        <div className="flex items-center gap-4 px-4 md:px-8 py-2 border-t border-black/[0.06] bg-[#FAFAFA] shrink-0">
          {isWorking ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5046E5]" />
              <span className="text-xs font-medium text-[#5046E5]">Working</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#5046E5]" />
              <span className="text-xs font-medium text-black/60">Done</span>
            </div>
          )}
          {isWorking && startTime && (
            <span className="flex items-center gap-1 text-xs text-black/40 font-mono">
              <Clock className="w-3 h-3" />
              {Math.floor(elapsed / 60)}m {elapsed % 60}s
            </span>
          )}
          {stats.reads > 0 && (
            <span className="flex items-center gap-1 text-xs text-black/40">
              <FileSearch className="w-3 h-3" />
              <span className="font-bold">{stats.reads}</span> read
            </span>
          )}
          {stats.writes > 0 && (
            <span className="flex items-center gap-1 text-xs text-[#5046E5]">
              <FilePen className="w-3 h-3" />
              <span className="font-bold">{stats.writes}</span> written
            </span>
          )}
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-[#5046E5] hover:underline"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              Review PR →
            </a>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-black/[0.06] px-3 py-2 shrink-0 bg-white">
        {error && (
          <div className="mb-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs bg-red-50 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleTask}>
          <div
            className={`flex items-end gap-2 rounded-xl border transition-all ${
              isWorking
                ? 'border-black/[0.06] bg-[#FAFAFA]'
                : 'border-black/[0.08] bg-white focus-within:border-[#5046E5]/40 focus-within:ring-2 focus-within:ring-[#5046E5]/10'
            }`}
          >
            <span className="text-[13px] text-[#5046E5] pl-3 py-2.5 select-none shrink-0 font-bold">›</span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTask(e);
                }
              }}
              placeholder={isWorking ? 'Consul is working...' : 'Tell Consul what to build...'}
              className="flex-1 bg-transparent text-[13px] text-black placeholder-black/20 outline-none resize-none py-2.5 pr-3 min-h-[20px] max-h-32"
              disabled={isWorking}
              rows={1}
            />
            <button
              type="submit"
              disabled={isWorking || !input.trim()}
              className="m-1 p-1.5 rounded-lg bg-[#0D0D0D] text-white hover:bg-black/80 disabled:opacity-20 transition-opacity shrink-0"
            >
              {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center justify-between px-1 mt-1">
            <span className="text-[10px] text-black/20">enter to send · shift+enter for newline</span>
            <span className="text-[10px] text-black/20 hidden sm:block">reads · writes · commits in real time</span>
          </div>
        </form>
      </div>
    </div>
  );
}