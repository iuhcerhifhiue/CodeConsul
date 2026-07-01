import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Github, FileCode } from 'lucide-react';
import AgentTray from '@/components/AgentTray';
import TerminalOutput from '@/components/TerminalOutput';
import FileTree from '@/components/FileTree';

export default function Workspace() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState([]);
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

  useEffect(() => {
    const allFiles = [];
    messages.forEach((msg) => {
      if (msg.role === 'assistant') {
        const regex = /### → (.+)/g;
        let match;
        while ((match = regex.exec(msg.content)) !== null) {
          allFiles.push(match[1].trim());
        }
      }
    });
    setFiles([...new Set(allFiles)]);
  }, [messages]);

  const loadProject = async () => {
    try {
      const proj = await base44.entities.Project.get(projectId);
      setProject(proj);
      setFileTree(proj.file_tree || '');

      // Fetch fresh key files from GitHub for agent context
      if (proj.repo_full_name) {
        try {
          const res = await base44.functions.invoke('githubRepoContents', { repo_full_name: proj.repo_full_name });
          if (res.data?.key_files) setKeyFiles(res.data.key_files);
          if (res.data?.file_tree) setFileTree(res.data.file_tree);
        } catch (err) {
          console.error('Failed to fetch repo contents:', err);
        }
      }

      // Load or create session
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

    // Build context message with repo data for the agent
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

      // Poll conversation until Oikos responds, then re-enable input
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
              // 5 minute timeout
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
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="font-mono text-xs text-white/30">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#080B0F] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
        <Link to="/dashboard" className="text-white/30 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Github className="w-4 h-4 text-white/30" />
        <span className="font-mono text-xs text-white/70">{project?.repo_full_name}</span>
        {project?.stack && (
          <span className="font-mono text-[10px] text-cyan-400/40 ml-2">{project.stack}</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[10px] text-white/20">main</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
            <span className="font-mono text-[10px] text-white/20">connected</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <div className="w-52 border-r border-white/5 overflow-y-auto hidden md:flex flex-col">
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Generated</span>
            <span className="font-mono text-[10px] text-white/20">{files.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FileTree files={files} />
          </div>
          {fileTree && (
            <div className="border-t border-white/5 p-2">
              <div className="px-1 py-1">
                <span className="font-mono text-[9px] text-white/20 uppercase tracking-wider">Repo Files</span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {fileTree.split('\n').slice(0, 50).map((path, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-0.5">
                    <FileCode className="w-2.5 h-2.5 text-white/10 shrink-0" />
                    <span className="font-mono text-[9px] text-white/20 truncate">{path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Terminal output */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <TerminalOutput messages={messages} isStreaming={isStreaming} />
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
        <span className="font-mono text-xs text-cyan-400/70">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell Oikos what to build..."
          className="flex-1 bg-transparent font-mono text-sm text-white placeholder-white/20 outline-none"
          disabled={isStreaming}
          autoFocus
        />
        <button type="submit" disabled={isStreaming || !input.trim()} className="text-cyan-400/70 hover:text-cyan-400 disabled:opacity-20 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </form>

      <AgentTray status={isStreaming ? 'executing' : 'idle'} />
    </div>
  );
}