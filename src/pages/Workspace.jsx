import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Github, FileCode, GitBranch, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Loading workspace...</span>
        </div>
      </div>
    );
  }

  const files = fileTree ? fileTree.split('\n').slice(0, 80) : [];
  const opCount = messages.filter(m => m.tool_calls?.length).reduce((n, m) => n + m.tool_calls.length, 0);

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-900 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <Github className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-sm font-medium text-gray-800 truncate">{project?.repo_full_name}</span>
        </div>
        {project?.stack && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-blue-600 truncate hidden sm:block">{project.stack}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-gray-400">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="text-xs">main</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">connected</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-gray-200 hidden md:flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</span>
              <span className="text-xs text-gray-400">{opCount}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ActivityFeed messages={messages} />
            </div>
          </div>

          {files.length > 0 && (
            <div className="border-t border-gray-200 max-h-52 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Files</span>
                <span className="text-xs text-gray-300 ml-1.5">{files.length}</span>
              </div>
              <div className="overflow-y-auto flex-1">
                {files.map((path, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-4 py-1 hover:bg-gray-50 transition-colors">
                    <FileCode className="w-3 h-3 text-gray-300 shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Chat */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto bg-white">
          <ChatMessages messages={messages} isStreaming={isStreaming} />
        </main>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 md:px-6 py-4">
        {error && (
          <div className="mb-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className={`flex items-end gap-2 rounded-lg border transition-colors ${isStreaming ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white focus-within:border-gray-400'}`}>
            <span className="font-mono text-[13px] text-green-600 pl-4 py-3 select-none shrink-0">›</span>
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
              className="flex-1 bg-transparent font-mono text-[13px] text-gray-900 placeholder-gray-300 outline-none resize-none py-3 pr-4 min-h-[20px] max-h-32"
              disabled={isStreaming}
              autoFocus
              rows={1}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="m-1.5 p-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-20 disabled:hover:bg-gray-900 transition-colors shrink-0"
            >
              {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center justify-between px-1 mt-1.5">
            <span className="text-[11px] text-gray-300 font-mono">enter to send · shift+enter for newline</span>
            <span className="text-[11px] text-gray-300 font-mono hidden sm:block">read &amp; write access</span>
          </div>
        </form>
      </div>

      <AgentTray status={isStreaming ? 'executing' : 'idle'} />
    </div>
  );
}