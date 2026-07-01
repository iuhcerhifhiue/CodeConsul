import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Github, Loader2, Crown, Layers, GitPullRequest, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [notice, setNotice] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [verification, setVerification] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
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

  // Parse the CEO's assignment block. Returns { assignments, error } so the caller
  // can surface failures to the user instead of silently dispatching nothing.
  const parseAssignments = (content) => {
    if (!content) return { assignments: [], error: 'The CEO returned an empty response.' };

    let jsonText = null;
    const marked = content.match(/\[ASSIGNMENTS\]([\s\S]*?)\[\/ASSIGNMENTS\]/);
    if (marked) {
      jsonText = marked[1].trim();
    } else {
      // Fallback: the first JSON array of objects anywhere in the message.
      const arr = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arr) jsonText = arr[0];
    }
    if (!jsonText) {
      return { assignments: [], error: 'No [ASSIGNMENTS] block found in the CEO response.' };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      return { assignments: [], error: `The CEO produced invalid assignment JSON: ${e.message}` };
    }
    if (!Array.isArray(parsed)) {
      return { assignments: [], error: 'The CEO assignments were not a JSON array.' };
    }

    const assignments = [];
    for (const a of parsed) {
      if (a && typeof a.agent === 'string' && typeof a.task === 'string') {
        assignments.push({
          agent: a.agent,
          task: a.task,
          depends_on: Array.isArray(a.depends_on) ? a.depends_on.filter((d) => typeof d === 'string') : [],
        });
      }
    }
    if (assignments.length === 0) {
      return { assignments: [], error: 'No valid assignments found (each needs an "agent" and a "task").' };
    }
    return { assignments, error: null };
  };

  // Order assignments into execution waves based on depends_on. Assignments whose
  // prerequisites are all satisfied run together (in parallel); the next wave waits.
  // Unknown or cyclic dependencies are broken by running the remainder as one wave.
  const orderIntoWaves = (assignments) => {
    const names = new Set(assignments.map((a) => a.agent));
    const done = new Set();
    const remaining = [...assignments];
    const waves = [];
    let guard = 0;
    while (remaining.length && guard++ < 100) {
      const ready = remaining.filter((a) => a.depends_on.every((d) => !names.has(d) || done.has(d)));
      const wave = ready.length ? ready : remaining.slice();
      waves.push(wave);
      wave.forEach((a) => {
        done.add(a.agent);
        const i = remaining.indexOf(a);
        if (i >= 0) remaining.splice(i, 1);
      });
    }
    return waves;
  };

  // Pull the files a specialist actually wrote/edited/deleted from its tool calls,
  // deduped by path (last operation wins). Used to coordinate later waves.
  const extractTouched = (messages) => {
    const map = new Map();
    for (const m of messages || []) {
      for (const tc of m.tool_calls || []) {
        let args = {};
        try { args = JSON.parse(tc.arguments_string); } catch {}
        const op = args.operation;
        const path = args.file_path || args.path;
        const ok = ['completed', 'success'].includes(tc.status);
        if (path && ok && ['write', 'edit', 'update', 'delete'].includes(op)) {
          map.set(path, op);
        }
      }
    }
    return Array.from(map.entries()).map(([path, op]) => ({ path, op }));
  };

  // Ask the Consul verify service to clone the branch and run the repo's real
  // test/typecheck/build command. Returns null when there's nothing to verify
  // against; on a service/network failure, returns a synthetic "skipped" result
  // rather than throwing, so a missing CONSUL_VERIFY_URL degrades gracefully.
  const verifyOnBranch = async (branch) => {
    if (!project?.repo_full_name || !branch) return null;
    try {
      const res = await base44.functions.invoke('verifyBranch', {
        repo_full_name: project.repo_full_name,
        branch,
      });
      return res.data || null;
    } catch (err) {
      console.error('Verification call failed:', err);
      return { ran: false, passed: false, summary: err.message || 'verification service unreachable', failures: [] };
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

  // Dispatch a single specialist and resolve with the files it touched once it
  // stops processing (or after a safety timeout, so one stuck agent can't block the run).
  const runSpecialist = (assignment, branch, priorFiles) => {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (touched) => {
        if (settled) return;
        settled = true;
        resolve(touched);
      };

      (async () => {
        try {
          const conv = await base44.agents.createConversation({
            agent_name: assignment.agent,
            metadata: {
              name: `${assignment.agent} — ${assignment.task.substring(0, 50)}`,
              description: assignment.task,
            },
          });

          setSpecialists((prev) => ({
            ...prev,
            [assignment.agent]: { conversationId: conv.id, messages: [], status: 'working', task: assignment.task },
          }));

          const branchNote = branch
            ? `\n\n[TASK BRANCH]\nAll file changes MUST target the branch "${branch}". Pass { "branch": "${branch}" } on every githubWrite write/edit/delete so changes land on the review branch, not the default branch.`
            : '';
          const coordNote = priorFiles.length
            ? `\n\n[COORDINATION]\nOther agents in this run already modified these files. READ their current state before touching them and do not overwrite unrelated work:\n${priorFiles.map((f) => `- ${f.path} (${f.op})`).join('\n')}`
            : '';

          const specialistContext = buildContext(assignment.task) + branchNote + coordNote;
          await base44.agents.addMessage(conv, { role: 'user', content: specialistContext });

          let lastMessages = [];
          const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
            lastMessages = data.messages || [];
            setSpecialists((prev) => ({
              ...prev,
              [assignment.agent]: {
                ...prev[assignment.agent],
                messages: lastMessages,
                status: data.is_processing ? 'working' : 'done',
              },
            }));
            if (!data.is_processing && lastMessages.some((m) => m.role === 'assistant')) {
              finish(extractTouched(lastMessages));
            }
          });
          unsubRefs.current.push(unsub);

          // Safety timeout: don't let a stuck specialist stall the whole orchestration.
          setTimeout(() => {
            setSpecialists((prev) =>
              prev[assignment.agent]?.status === 'working'
                ? { ...prev, [assignment.agent]: { ...prev[assignment.agent], status: 'done' } }
                : prev,
            );
            finish(extractTouched(lastMessages));
          }, 180000);
        } catch (err) {
          console.error(`Specialist ${assignment.agent} failed:`, err);
          setSpecialists((prev) => ({
            ...prev,
            [assignment.agent]: {
              ...(prev[assignment.agent] || {}),
              status: 'failed',
              task: assignment.task,
              messages: prev[assignment.agent]?.messages || [],
            },
          }));
          finish([]);
        }
      })();
    });
  };

  const handleTask = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isOrchestrating) return;

    const task = input.trim();
    setInput('');
    setError('');
    setNotice('');
    setPrUrl('');
    setVerification(null);
    setIsVerifying(false);
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

      const { assignments, error: parseError } = parseAssignments(ceoResponse.content);
      if (parseError) {
        setError(parseError);
        setIsOrchestrating(false);
        return;
      }

      const allowedAgents = (PLANS[userPlan] || PLANS.free).agents;
      const validAssignments = assignments.filter((a) => allowedAgents.includes(a.agent));
      const skipped = assignments.filter((a) => !allowedAgents.includes(a.agent));

      if (validAssignments.length === 0) {
        setError(
          `Every assigned agent is above your ${PLANS[userPlan]?.name} plan. Upgrade to deploy: ${assignments.map((a) => a.agent).join(', ')}.`,
        );
        setIsOrchestrating(false);
        return;
      }
      if (skipped.length) {
        setNotice(`Skipped ${skipped.length} agent(s) not in your plan: ${skipped.map((a) => a.agent).join(', ')}.`);
      }

      // Create a review branch so specialist changes open a PR instead of
      // committing straight to the default branch.
      let branch = '';
      if (project?.repo_full_name) {
        try {
          const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const res = await base44.functions.invoke('githubPullRequest', {
            operation: 'ensure_branch',
            repo_full_name: project.repo_full_name,
            branch: `consul/${stamp}`,
          });
          if (res.data?.branch) branch = res.data.branch;
        } catch (err) {
          console.error('Failed to create review branch:', err);
        }
      }

      // Execute in dependency-ordered waves, accumulating modified files (with the
      // agent that touched each one, last writer wins) so later waves — and a
      // possible repair pass — know what earlier agents changed and who to ask.
      const waves = orderIntoWaves(validAssignments);
      const modifiedFiles = [];
      const recordTouched = (agent, touched) => {
        touched.forEach((f) => {
          const existing = modifiedFiles.find((m) => m.path === f.path);
          if (existing) {
            existing.op = f.op;
            existing.agent = agent;
          } else {
            modifiedFiles.push({ path: f.path, op: f.op, agent });
          }
        });
      };
      for (const wave of waves) {
        const results = await Promise.all(wave.map((a) => runSpecialist(a, branch, [...modifiedFiles])));
        wave.forEach((a, i) => recordTouched(a.agent, results[i] || []));
      }

      // Verify on the branch: clone it, run the repo's real test/typecheck/build
      // command, and report pass/fail — this is the step that turns "the agents
      // said they're done" into "the code actually works." On failure, dispatch
      // one bounded repair pass to the agent(s) whose files are implicated, then
      // re-verify once and report the final state.
      let verificationResult = null;
      if (branch && project?.repo_full_name && modifiedFiles.length) {
        setIsVerifying(true);
        verificationResult = await verifyOnBranch(branch);

        if (verificationResult?.ran && !verificationResult?.passed) {
          const failingPaths = new Set((verificationResult.failures || []).map((f) => f.file).filter(Boolean));
          const allAgents = [...new Set(modifiedFiles.map((f) => f.agent).filter(Boolean))];
          const implicatedAgents = failingPaths.size
            ? [...new Set(modifiedFiles.filter((f) => failingPaths.has(f.path)).map((f) => f.agent).filter(Boolean))]
            : [];
          const repairAgents = (implicatedAgents.length ? implicatedAgents : allAgents).filter((a) =>
            allowedAgents.includes(a),
          );

          if (repairAgents.length) {
            setNotice((n) => `${n ? n + ' ' : ''}Verification failed — dispatching a repair pass to ${repairAgents.join(', ')}.`);
            const failureText =
              (verificationResult.failures || [])
                .slice(0, 10)
                .map((f) => `- ${f.file ? f.file + ': ' : ''}${f.label} — ${f.detail}`)
                .join('\n') || verificationResult.summary;

            const repairAssignments = repairAgents.map((agent) => ({
              agent,
              task: `Fix this verification failure on branch "${branch}". Re-read the current file state first — it may differ from what you last wrote.\n\n${failureText}`,
              depends_on: [],
            }));
            const repairResults = await Promise.all(
              repairAssignments.map((a) => runSpecialist(a, branch, [...modifiedFiles])),
            );
            repairAssignments.forEach((a, i) => recordTouched(a.agent, repairResults[i] || []));

            const reverified = await verifyOnBranch(branch);
            verificationResult = reverified ? { ...reverified, repaired: true } : verificationResult;
          }
        }
        setIsVerifying(false);
        setVerification(verificationResult);
      }

      // Open a PR for the user to review once the specialists finish, regardless
      // of verification outcome — never lose the work, just report the real state.
      if (branch && project?.repo_full_name && modifiedFiles.length) {
        try {
          const verifyLine = !verificationResult
            ? ''
            : verificationResult.ran
              ? `\nVerification: ${verificationResult.passed ? 'passed' : 'FAILED'}${verificationResult.repaired ? ' (after 1 repair pass)' : ''} — ${verificationResult.summary}`
              : `\nVerification: skipped — ${verificationResult.summary || 'no verify service configured'}`;
          const res = await base44.functions.invoke('githubPullRequest', {
            operation: 'open',
            repo_full_name: project.repo_full_name,
            branch,
            title: `Consul: ${task.substring(0, 60)}`,
            pr_body: `Automated changes from the Consul multi-agent platform.\n\nTask: ${task}\n${verifyLine}\n\nFiles changed:\n${modifiedFiles.map((f) => `- ${f.path} (${f.op})`).join('\n')}\n\nReview before merging.`,
          });
          if (res.data?.url) setPrUrl(res.data.url);
        } catch (err) {
          console.error('Failed to open PR:', err);
          setNotice((n) => `${n ? n + ' ' : ''}Changes landed on branch "${branch}", but opening the PR failed — open it manually.`);
        }
      }

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
            {isVerifying && (
              <div className="mb-2 px-3 py-1.5 rounded border border-gray-300 text-gray-600 text-xs bg-gray-50 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                Running real verification (tests/build) on the branch...
              </div>
            )}
            {verification && verification.ran && (
              <div className={`mb-2 px-3 py-1.5 rounded border text-xs ${verification.passed ? 'border-black bg-editorial' : 'border-black text-red-600 bg-[#FFFBEA]'}`}>
                <div className="flex items-center gap-2">
                  {verification.passed ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span className="font-bold">
                    {verification.passed ? 'Verified — real tests passed' : 'Verification failed'}
                    {verification.repaired ? ' (after 1 repair pass)' : ''}
                  </span>
                </div>
                {verification.summary && <p className="mt-1 text-gray-600">{verification.summary}</p>}
                {!verification.passed && verification.failures?.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {verification.failures.slice(0, 5).map((f, i) => (
                      <li key={i} className="text-gray-500 truncate">{f.file ? `${f.file}: ` : ''}{f.label} — {f.detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {verification && !verification.ran && (
              <div className="mb-2 px-3 py-1.5 rounded border border-gray-300 text-gray-500 text-xs bg-gray-50">
                Verification skipped — {verification.summary || 'no verify service configured'}
              </div>
            )}
            {prUrl && (
              <div className="mb-2 px-3 py-1.5 rounded border border-black text-xs bg-editorial flex items-center gap-2">
                <GitPullRequest className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold">Pull request opened.</span>
                <a href={prUrl} target="_blank" rel="noreferrer" className="underline hover:no-underline">Review changes →</a>
              </div>
            )}
            {notice && (
              <div className="mb-2 px-3 py-1.5 rounded border border-gray-300 text-gray-600 text-xs bg-gray-50">
                {notice}
              </div>
            )}
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
