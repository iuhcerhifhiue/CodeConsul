import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Github, Loader2, Link2, AlertCircle } from 'lucide-react';

export default function RepoPicker({ onClose, onConnected }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const parseRepoName = (input) => {
    let val = input.trim();
    val = val.replace(/^https?:\/\/github\.com\//, '');
    val = val.replace(/^github\.com\//, '');
    val = val.replace(/\.git$/, '').replace(/\/$/, '');
    const parts = val.split('/');
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return val;
  };

  const handleConnect = async () => {
    if (!repoUrl.trim()) return;
    const fullName = parseRepoName(repoUrl);
    if (!fullName.includes('/')) {
      setError('Enter a valid GitHub URL (e.g. https://github.com/owner/repo)');
      return;
    }

    setError('');
    setConnecting(true);

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
        const msg = err?.response?.data?.error || err?.message;
        if (msg) setError(msg);
      }

      onConnected?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to connect repo');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-lg font-bold text-gray-900">Connect a Repo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">GitHub Repository URL</label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); setError(''); }}
              placeholder="https://github.com/owner/repo"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:bg-white transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              autoFocus
              disabled={connecting}
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">Paste any public GitHub repository URL</p>

          <button
            onClick={handleConnect}
            disabled={!repoUrl.trim() || connecting}
            className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            {connecting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Indexing repository...</>
            ) : (
              <><Github className="w-4 h-4" />Connect Repository</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}