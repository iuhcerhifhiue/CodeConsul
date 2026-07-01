import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Github, Loader2, Crown, Layers } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import ChatMessages from '@/components/ChatMessages';
import AgentPanel from '@/components/AgentPanel';
import AgentRoster from '@/components/AgentRoster';

export default function Workspace() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [ceoConversationId, setCeoConversationId] = useState(null);
  const [ceoMessages, setCeoMessages] = useState([]);
  const [specialists, setSpecialists] = useState({});
  const [input, setInput] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileTree, setFileTree] = useState('');
  const [keyFiles, setKeyFiles] = useState({});
  const [error, setError] = useState('');
  const unsubRefs = useRef([]);

  useEffect(() => {
    loadProject();
    loadUser();
  }, [projectId]);

  useEffect(() => {
    if (!ceoConversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(ceoConversationId, (data) => {
      setCeoMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [ceoConversationId]);

  useEffect(() => {
    return () => {
      unsubRefs.current.forEach((fn) => fn && fn());
      unsubRefs.current = [];
    };
  }, []);

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
        setCeoConversationId(session.conversation_id);
        const conv = await base44.agents.getConversation(session.conversation_id);
        setCeoMessages(conv.messages || []);
      } else {
        const conv = await base44.agents.createConversation({
          agent_name: 'oikos',
          metadata: { name: proj.repo_name, description: `CEO session for ${proj.repo_name}` },
        });
        await base44.entities.Session.create({
          project_id: projectId,
          conversation_id: conv.id,
          title: `CEO session for ${proj.repo_name}`,
        });
        setCeoConversationId(conv.id);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildContext = (task) => {
    const parts = [];
    if (project?.repo_full_name) parts.push(`Repository: ${project.repo_full_name}`);
    if (project?.stack) parts.push(`Stack: ${project.stack}`);
    if (fileTree) {
      const truncated = fileTree.length > 8000 ? fileTree.substring(0, 8000) + '\n... (truncated)' : fileTree;
      parts.push(`File Tree:\n${truncated}`);
    }
    if (Object.keys(keyFiles).length > 0) {
      const filesCtx = Object.entries(keyFiles)
        .map(([path, content]) => `--- ${path} ---\n${content}`)
        .join('\n\n');
      parts.push(`Key Files:\n${filesCtx}`);
    }
    return parts.length > 0 ? `[PROJECT CONTEXT]\n${parts.join('\n')}\n\n[TASK]\n${task}` : task;
  };

  const parseAssignments = (content) => {
    if (!content) return [];
    const match = content.match(/\[ASSIGNMENTS\]([\s\S]*?)\[\/ASSIGNMENTS\]/);
    if (!match) return [];
    try {
      return JSON.parse(match[1].trim());
    } catch {
      return [];
    }
  };

  const pollForCeoResponse = (convId, minMsgCount) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const conv = await base44.agents.getConversation(convId);
          const msgs = conv.messages || [];
          if (msgs.length > minMsgCount) {
            clearInterval(interval);
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'assistant') {
                resolve(msgs[i]);
                return;
              }
            }
            resolve(msgs[msgs.length - 1]);
          } else if (attempts > 150) {
            clearInterval(interval);
            reject(new Error('CEO took too long to respond'));
          }
        } catch {}
      }, 2000);
    });
  };

  const handleTask = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isOrchestrating) return;

    const task = input.trim();
    setInput('');
    setError('');
    setIsOrchestrating(true);

    // Clear previous specialist subscriptions
    unsubRefs.current.forEach((fn) => fn && fn());
    unsubRefs.current = [];
    setSpecialists({});

    const contextMessage = buildContext(task);
    const msgCountBefore = ceoMessages.length;
    setCeoMessages((prev) => [...prev, { role: 'user', content: contextMessage }]);

    try {
      const ceoConv = await base44.agents.getConversation(ceoConversationId);
      await base44.agents.addMessage(ceoConv, { role: 'user', content: contextMessage });

      const ceoResponse = await pollForCeoResponse(ceoConversationId, msgCountBefore + 1);

      const assignments = parseAssignments(ceoResponse.content);
      const allowedAgents = (PLANS[userPlan] || PLANS.free).agents;
      const validAssignments = assignments.filter((a) => allowedAgents.includes(a.agent));

      if (validAssignments.length === 0) {
        setIsOrchestrating(false);
        return;
      }

      const newSpecialists = {};
      for (const assignment of validAssignments) {
        const conv = await base44.agents.createConversation({
          agent_name: assignment.agent,
          metadata: {
            name: `${assignment.agent} — ${task.substring(0, 50)}`,
            description: assignment.task,
          },
        });

        newSpecialists[assignment.agent] = {
          conversationId: conv.id,
          messages: [],
          status: 'working',
          task: assignment.task,
        };

        const specialistContext = buildContext(assignment.task);
        await base44.agents.addMessage(conv, { role: 'user', content: specialistContext });

        const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
          setSpecialists((prev) => ({
            ...prev,
            [assignment.agent]: {
              ...prev[assignment.agent],
              messages: data.messages || [],
              status: data.is_processing ? 'working' : 'done',
            },
          }));
        });
        unsubRefs.current.push(unsub);
      }

      setSpecialists(newSpecialists);
      setIsOrchestrating(false);
    } catch (err) {
      console.error('Orchestration failed:', err);
      setError(err.message || 'Failed to process task');
      setIsOrchestrating(false);
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

  const activeAgentNames = Object.entries(specialists)
    .filter(([, s]) => s.status === 'working')
    .map(([name]) => name);
  const specialistEntries = Object.entries(specialists);

  return (
    <div className="h-screen flex flex-col bg-white text-black font-mono">
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
          <span className="text-xs text-black bg-editorial px-2 py-0.5 rounded font-bold hidden sm:block">{project.stack}</span>
        )}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Link
            to="/plans"
            className={`text-[10px] font-bold px-2.5 py-1 rounded border border-black transition-colors ${
              PLANS[userPlan]?.accent ? 'bg-editorial hover:bg-black hover:text-editorial' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {PLANS[userPlan]?.name.toUpperCase()}
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Agent Roster */}
        <aside className="w-56 border-r border-black hidden lg:flex flex-col shrink-0">
          <AgentRoster currentPlan={userPlan} activeAgents={activeAgentNames} />
        </aside>

        {/* Center: CEO Chat */}
        <div className="flex-1 flex flex-col min-w-0 md:border-r md:border-black">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-black bg-[#FFFBEA] shrink-0">
            <Crown className="w-4 h-4" />
            <span className="text-xs font-bold">Oikos (CEO)</span>
            <span className="text-[10px] text-gray-400 hidden sm:block">— breaks down tasks & delegates</span>
            {isOrchestrating && (
              <div className="ml-auto flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px] text-gray-500">delegating...</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <ChatMessages messages={ceoMessages} isStreaming={isOrchestrating} />
          </div>

          {/* Input */}
          <div className="border-t border-black px-3 py-2 shrink-0 bg-white">
            {error && (
              <div className="mb-2 px-3 py-1.5 rounded border border-black text-red-600 text-xs bg-[#FFFBEA]">
                {error}
              </div>
            )}
            <form onSubmit={handleTask}>
              <div className={`flex items-end gap-2 rounded-md border-2 transition-all ${
                isOrchestrating ? 'border-gray-200 bg-gray-50' : 'border-black bg-white focus-within:border-editorial'
              }`}>
                <span className="text-[13px] text-black pl-3 py-2.5 select-none shrink-0 font-bold">›</span>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTask(e);
                    }
                  }}
                  placeholder={isOrchestrating ? 'CEO is delegating...' : 'Describe what you want built...'}
                  className="flex-1 bg-transparent text-[13px] text-black placeholder-gray-300 outline-none resize-none py-2.5 pr-3 min-h-[20px] max-h-32"
                  disabled={isOrchestrating}
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={isOrchestrating || !input.trim()}
                  className="m-1 p-1.5 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-20 transition-opacity shrink-0"
                >
                  {isOrchestrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between px-1 mt-1">
                <span className="text-[10px] text-gray-300">enter to send · shift+enter for newline</span>
                <span className="text-[10px] text-gray-300 hidden sm:block">CEO → specialists</span>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Specialist Panels */}
        <div className="flex-1 hidden md:flex flex-col min-w-0 bg-gray-50">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-black bg-white shrink-0">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold">Specialist Agents</span>
            {specialistEntries.length > 0 && (
              <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded-full font-bold ml-auto">
                {specialistEntries.length} active
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {specialistEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Layers className="w-8 h-8 text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-400">No agents deployed yet</p>
                <p className="text-xs text-gray-300 mt-1 max-w-xs leading-relaxed">
                  Submit a task to Oikos. The CEO will break it down and deploy specialist agents to work in parallel.
                </p>
              </div>
            ) : (
              specialistEntries.map(([agentName, spec]) => (
                <AgentPanel
                  key={agentName}
                  agentName={agentName}
                  messages={spec.messages}
                  status={spec.status}
                  task={spec.task}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}