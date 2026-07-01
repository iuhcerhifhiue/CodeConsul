import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Github, FileCode, GitBranch, Circle } from 'lucide-react';
import AgentTray from '@/components/AgentTray';
import TerminalOutput from '@/components/TerminalOutput';
import ActivityFeed from '@/components/ActivityFeed';

export default function Workspace() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyFiles, setKeyFiles] = useState({});
  const [fileTree, setFileTree] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      if (data.is_processing !== undefined) setIsStreaming(data.is_processing);
    });
    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadProject = async () => {
    try {
      const proj = await base44.entities.Project.get(projectId);
      setProject(proj);
      setFileTree(proj.file_tree || '');

      if (proj.repo_full_name) {
        try {
          const res = await base44.functions.invoke('githubRepoContents', { repo_full_name: proj.repo_full_name });
          if (res.data?.key_files) setKeyFiles(res.data.key_files);
          if (res.data?.file_tree) setFileTree(res.data.file_tree);
        } catch (err) {
          console.error('Failed to fetch repo contents:', err);
        }
      }

      const sessions = await base44.entities.Session.filter({ project_id: projectId });
      if (sessions.length > 0) {
        const session = sessions[0];
        setConversationId(session.conversation_id);
        const conv = await base44.agents.getConversation(session.conversation_id);
        setMessages(conv.messages || []);
      } else {
        const conv = await base44.agents.createConversation({
          agent_name: 'oikos',
          metadata: { name: proj.repo_name, description: `Coding session for ${proj.repo_name}` },
        });
        await base44.entities.Session.create({
          project_id: projectId,
          conversation_id: conv.id,
          title: `Session for ${proj.repo_name}`,
        });
        setConversationId(conv.id);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const task = input.trim();
    setInput('');
    setIsStreaming(true);

    const contextParts = [];
    if (project?.repo_full_name) contextParts.push(`Repository: ${project.repo_full_name}`);
    if (project?.stack || fileTree) contextParts.push(`Stack: ${project?.stack || 'Unknown'}`);
    if (fileTree) {
      const truncatedTree = fileTree.length > 8000 ? fileTree.substring(0, 8000) + '\n... (truncated)' : fileTree;
      contextParts.push(`File Tree:\n${truncatedTree}`);
    }
    if (Object.keys(keyFiles).length > 0) {
      const filesContext = Object.entries(keyFiles).map(([path, content]) =>
        `--- ${path} ---\n${content}`
      ).join('\n\n');
      contextParts.push(`Key Files:\n${filesContext}`);
    }

    const contextMessage = contextParts.length > 0
      ? `[PROJECT CONTEXT]\n${contextParts.join('\n')}\n\n[TASK]\n${task}`
      : task;

    setMessages((prev) => [...prev, { role: 'user', content: contextMessage }]);

    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: 'user', content: contextMessage });

      const userMsgCount = messages.length + 1;
      const poll = async () => {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const updated = await base44.agents.getConversation(conversationId);
            const msgs = updated.messages || [];
            if (msgs.length > userMsgCount) {
              setMessages(msgs);
              setIsStreaming(false);
              clearInterval(interval);
            } else if (attempts > 150) {
              setIsStreaming(false);
              clearInterval(interval);
            }
          } catch {
            // Keep polling
          }
        }, 2000);
      };
      poll();
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 border border-amber-400/20 rounded-lg flex items-center justify-center">
              <span className="font-mono text-xs text-amber-400/50">◈</span>
            </div>
            <div className="absolute inset-0 rounded-lg border border-amber-400/10 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <span className="font-mono text-[11px] text-white/30">Initializing workspace...</span>
        </div>
      </div>
    );
  }

  const files = fileTree ? fileTree.split('\n').slice(0, 80) : [];

  return (
    <div className="h-screen flex flex-col bg-[#080B0F] text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0A0D12]">
        <Link to="/dashboard" className="text-white/30 hover:text-amber-400 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <Github className="w-3.5 h-3.5 text-white/25 shrink-0" />
          <span className="font-mono text-xs text-white/70 truncate">{project?.repo_full_name}</span>
        </div>
        {project?.stack && (
          <>
            <span className="text-white/10">·</span>
            <span className="font-mono text-[10px] text-amber-400/40 truncate hidden sm:block">{project.stack}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-white/20" />
            <span className="font-mono text-[10px] text-white/25">main</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-1.5 h-1.5 fill-green-400/50 text-green-400/50" />
            <span className="font-mono text-[10px] text-white/25">live</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-white/[0.06] hidden md:flex flex-col bg-[#090C11]">
          {/* Activity */}
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-white/[0.04] flex items-center justify-between sticky top-0 bg-[#090C11]">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.12em]">Activity</span>
              <span className="font-mono text-[9px] text-white/15">
                {messages.filter(m => m.tool_calls?.length).reduce((n, m) => n + m.tool_calls.length, 0)} ops
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ActivityFeed messages={messages} />
            </div>
          </div>

          {/* Repo files */}
          {files.length > 0 && (
            <div className="border-t border-white/[0.06] max-h-48 flex flex-col">
              <div className="px-3 py-2 border-b border-white/[0.04]">
                <span className="font-mono text-[10px] text-white/25 uppercase tracking-[0.12em]">Files</span>
                <span className="font-mono text-[9px] text-white/10 ml-1.5">{files.length}</span>
              </div>
              <div className="overflow-y-auto flex-1">
                {files.map((path, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-0.5 hover:bg-white/[0.02] transition-colors">
                    <FileCode className="w-2.5 h-2.5 text-white/10 shrink-0" />
                    <span className="font-mono text-[10px] text-white/25 truncate">{path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Conversation */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto">
          <TerminalOutput messages={messages} isStreaming={isStreaming} />
        </main>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pt-3 pb-2 border-t border-white/[0.06] bg-[#0A0D12]">
        <div className={`flex items-end gap-2.5 rounded-lg border transition-colors ${isStreaming ? 'border-white/[0.04] bg-black/20' : 'border-white/[0.08] bg-black/30 focus-within:border-amber-400/30'}`}>
          <span className={`font-mono text-sm pl-3.5 py-3 shrink-0 select-none transition-colors ${isStreaming ? 'text-white/15' : 'text-amber-400/50'}`}>›</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isStreaming ? 'Oikos is working...' : 'Describe what you want to build...'}
            className="flex-1 bg-transparent font-mono text-sm text-white placeholder-white/20 outline-none resize-none py-3 min-h-[20px] max-h-32"
            disabled={isStreaming}
            autoFocus
            rows={1}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="m-2 p-1.5 rounded-md text-white/30 hover:text-amber-400 hover:bg-amber-400/10 disabled:opacity-15 disabled:hover:bg-transparent disabled:hover:text-white/30 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 px-1 pt-1.5">
          <span className="font-mono text-[9px] text-white/15">↵ send · ⇧↵ newline</span>
          <span className="font-mono text-[9px] text-white/10 ml-auto">Oikos has read/write access to this repo</span>
        </div>
      </form>

      <AgentTray status={isStreaming ? 'executing' : 'idle'} />
    </div>
  );
}