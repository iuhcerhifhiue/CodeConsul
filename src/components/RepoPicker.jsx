import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Github, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';

const CONNECTOR_ID = '6a242ab8748831bf367aed86';

export default function RepoPicker({ onClose, onConnected }) {
  const [repoName, setRepoName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [cloningRepo, setCloningRepo] = useState(null);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await base44.functions.invoke('githubRepos', {});
      if (res.data?.repos) {
        setRepos(res.data.repos);
        setGithubConnected(true);
      }
    } catch {
      setGithubConnected(false);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const createProject = async (fullName) => {
    setConnecting(true);
    setCloningRepo(fullName);
    try {
      const project = await base44.entities.Project.create({
        repo_name: fullName.split('/').pop(),
        repo_full_name: fullName,
        repo_url: `https://github.com/${fullName}`,
        stack: '',
        architecture_notes: '',
        key_decisions: [],
        file_tree: '',
      });

      // Clone: fetch actual repo tree and key files
      try {
        const res = await base44.functions.invoke('githubRepoContents', { repo_full_name: fullName });
        if (res.data) {
          await base44.entities.Project.update(project.id, {
            stack: res.data.stack || '',
            file_tree: (res.data.file_tree || '').substring(0, 10000),
            architecture_notes: `${res.data.file_count || 0} files indexed. Branch: ${res.data.default_branch || 'main'}`,
          });
        }
      } catch (err) {
        console.error('Failed to fetch repo contents:', err);
      }

      onConnected?.();
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setConnecting(false);
      setCloningRepo(null);
    }
  };

  const handleConnect = () => {
    if (!repoName.trim()) return;
    createProject(repoName.trim());
  };

  const handleGitHubConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchRepos();
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#0D1117] border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold text-white">Connect a Repo</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {githubConnected ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Your Repos</span>
              <button onClick={fetchRepos} className="text-white/30 hover:text-cyan-400 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRepos ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {loadingRepos ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-cyan-400/50 animate-spin" />
              </div>
            ) : repos.length === 0 ? (
              <p className="font-mono text-xs text-white/20 py-4 text-center">No repos found</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {repos.map((repo) => (
                  <button
                    key={repo.name}
                    onClick={() => createProject(repo.name)}
                    disabled={connecting}
                    className="flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left disabled:opacity-30"
                  >
                    {cloningRepo === repo.name ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    ) : (
                      <Github className="w-4 h-4 text-white/30 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-white/60 truncate block">{repo.name}</span>
                      {repo.language && (
                        <span className="font-mono text-[9px] text-white/20">{repo.language}</span>
                      )}
                    </div>
                    {cloningRepo === repo.name && (
                      <span className="font-mono text-[9px] text-cyan-400/50">cloning...</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleGitHubConnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors mb-4"
          >
            <Github className="w-5 h-5 text-white" />
            <span className="font-mono text-sm text-white">Connect GitHub</span>
          </button>
        )}

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-mono text-[10px] text-white/20">OR ENTER MANUALLY</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-3">
          <input
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="owner/repo-name"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <button
            onClick={handleConnect}
            disabled={!repoName.trim() || connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg font-mono text-sm text-cyan-400 hover:bg-cyan-400/20 transition-colors disabled:opacity-30"
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cloning repository...
              </>
            ) : (
              <>
                Connect Repo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}