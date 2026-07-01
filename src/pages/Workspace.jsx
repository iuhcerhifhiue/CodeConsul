import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Github, FileCode, GitBranch, Loader2, Activity, FolderTree } from 'lucide-react';
import AgentTray from '@/components/AgentTray';
import ChatMessages from '@/components/ChatMessages';
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
  const [error, setError] = useState('');
  const [sidebarTab, setSidebarTab] = useState('activity');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
    setError('');
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
              setError('Oikos took too long to respond. Try again.');
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
      setError('Failed to send message. Please try again.');
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-black" />
          <span className="text-sm text-gray-400">Loading workspace...</span>
        </div>
      </div>
    );
  }

  const files = fileTree ? fileTree.split('\n').slice(0, 80) : [];
  const opCount = messages.filter(m => m.tool_calls?.length).reduce((n, m) => n + m.tool_calls.length, 0);

  return (
    <div className="h-screen flex flex-col bg-white text-black font-mono">
      {/* Top border accent */}
      <div className="h-1 bg-editorial shrink-0" />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-black bg-white shrink-0">
        <Link to="/" className="font-bold text-base tracking-tight shrink-0">Consul</Link>
        <div className="w-px h-4 bg-black shrink-0" />
        <Link to="/dashboard" className="text-gray-400 hover:text-black transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <Github className="w-4 h-4 shrink-0" />
          <span className="text-sm font-bold truncate">{project?.repo_full_name}</span>
        </div>
        {project?.stack && (
          <>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="text-xs text-black bg-editorial px-2 py-0.5 rounded font-bold hidden sm:block">{project.stack}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-black">
            <GitBranch className="w-3 h-3" />
            <span className="text-xs">main</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-editorial" />
            <span className="text-xs text-gray-400 hidden sm:block">connected</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-black hidden md:flex flex-col bg-white shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-black shrink-0">
            <button
              onClick={() => setSidebarTab('activity')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors ${
                sidebarTab === 'activity' ? 'text-black bg-editorial' : 'text-gray-400 hover:text-black'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              ACTIVITY
              {opCount > 0 && (
                <span className="text-[10px] bg-black text-white px-1.5 rounded-full">{opCount}</span>
              )}
            </button>
            <button
              onClick={() => setSidebarTab('files')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors ${
                sidebarTab === 'files' ? 'text-black bg-editorial' : 'text-gray-400 hover:text-black'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              FILES
              {files.length > 0 && (
                <span className="text-[10px] bg-black text-white px-1.5 rounded-full">{files.length}</span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {sidebarTab === 'activity' ? (
              <div className="flex-1 overflow-y-auto">
                <ActivityFeed messages={messages} />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {files.length > 0 ? (
                  <div className="py-1">
                    {files.map((path, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-3 py-1 hover:bg-[#FFFBEA] transition-colors group">
                        <FileCode className="w-3 h-3 text-gray-300 shrink-0 group-hover:text-black" />
                        <span className="text-[11px] text-gray-600 truncate">{path}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-gray-400">No files indexed</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Chat */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto bg-white">
          <ChatMessages messages={messages} isStreaming={isStreaming} />
        </main>
      </div>

      {/* Input */}
      <div className="border-t border-black bg-white px-4 md:px-6 py-3 shrink-0">
        {error && (
          <div className="mb-2 px-4 py-2 rounded border border-black text-red-600 text-sm bg-[#FFFBEA]">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className={`flex items-end gap-2 rounded-md border-2 transition-all ${isStreaming ? 'border-gray-200 bg-gray-50' : 'border-black bg-white focus-within:border-editorial'}`}>
            <span className="text-[13px] text-black pl-4 py-3 select-none shrink-0 font-bold">›</span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isStreaming ? 'Oikos is working...' : 'Ask Oikos to build something...'}
              className="flex-1 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none resize-none py-3 pr-4 min-h-[20px] max-h-32"
              disabled={isStreaming}
              autoFocus
              rows={1}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="m-1.5 p-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-20 disabled:hover:opacity-20 transition-opacity shrink-0"
            >
              {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center justify-between px-1 mt-1.5">
            <span className="text-[11px] text-gray-300">enter to send · shift+enter for newline</span>
            <span className="text-[11px] text-gray-300 hidden sm:block">read &amp; write access</span>
          </div>
        </form>
      </div>

      <AgentTray status={isStreaming ? 'executing' : 'idle'} />
    </div>
  );
}