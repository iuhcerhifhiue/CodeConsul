import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Github, ArrowRight } from 'lucide-react';
import RepoPicker from '@/components/RepoPicker';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRepoPicker, setShowRepoPicker] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projs = await base44.entities.Project.list('-updated_date');
      setProjects(projs);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B0F] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight">Projects</h1>
            <p className="font-mono text-xs text-white/30 mt-1">Your connected repositories</p>
          </div>
          <button
            onClick={() => setShowRepoPicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-400/10 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/20 transition-colors"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs text-cyan-400">Connect Repo</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/5 rounded-xl">
            <div className="w-16 h-16 rounded-lg border border-white/5 flex items-center justify-center mb-4">
              <Github className="w-8 h-8 text-white/10" />
            </div>
            <p className="font-mono text-sm text-white/30">No projects yet</p>
            <p className="font-mono text-xs text-white/20 mt-1">Connect a repo to get started</p>
            <button
              onClick={() => setShowRepoPicker(true)}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/20 transition-colors"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs text-cyan-400">Connect Repo</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/workspace/${project.id}`}
                className="flex items-center gap-4 p-4 border border-white/5 rounded-lg hover:border-cyan-400/30 hover:bg-white/[0.02] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                  <Github className="w-5 h-5 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-white/80 truncate">{project.repo_full_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {project.stack && (
                      <span className="font-mono text-[10px] text-cyan-400/40">{project.stack}</span>
                    )}
                    {project.architecture_notes && (
                      <span className="font-mono text-[10px] text-white/20">{project.architecture_notes}</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {showRepoPicker && (
        <RepoPicker onClose={() => setShowRepoPicker(false)} onConnected={loadProjects} />
      )}
    </div>
  );
}