import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send } from 'lucide-react';
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
    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    try {
      const conv = await base44.agents.getConversation(conversationId);
      const context = `Project: ${project?.repo_full_name || 'unknown'}\nStack: ${project?.stack || 'unknown'}\nArchitecture: ${project?.architecture_notes || 'none'}\n\nTask: ${userMessage}`;
      await base44.agents.addMessage(conv, { role: 'user', content: context });
      setIsStreaming(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B0F] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#080B0F] text-white">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
        <Link to="/dashboard" className="text-white/30 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-mono text-xs text-white/60">{project?.repo_full_name}</span>
        <span className="font-mono text-[10px] text-white/20 ml-auto">main</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r border-white/5 overflow-y-auto hidden md:block">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Files</span>
          </div>
          <FileTree files={files} />
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <TerminalOutput messages={messages} isStreaming={isStreaming} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2.5 border-t border-white/5">
        <span className="font-mono text-xs text-cyan-400/70">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell Oikos what to build..."
          className="flex-1 bg-transparent font-mono text-xs text-white placeholder-white/20 outline-none"
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