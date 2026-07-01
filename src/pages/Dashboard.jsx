import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Github, ArrowRight, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black bg-white">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 py-4">
          <Link to="/" className="font-bold text-xl tracking-tight">Consul</Link>
          <div className="flex items-center gap-4">
            <Link to="/plans" className="text-sm text-gray-500 hover:text-black hover:underline transition-colors">
              Plans
            </Link>
            <Link to="/" className="text-sm text-gray-500 hover:text-black hover:underline transition-colors">
              ← Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12 pb-6 border-b border-black">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-editorial mb-3">04 — PROJECTS</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Your repositories</h1>
          </div>
          <button
            onClick={() => setShowRepoPicker(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Connect Repo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <Github className="w-10 h-10 text-gray-300 mb-4" />
            <p className="text-lg font-bold">No projects yet</p>
            <p className="text-sm text-gray-500 mt-1">Paste a GitHub URL to get started</p>
            <button
              onClick={() => setShowRepoPicker(true)}
              className="mt-8 flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Connect Repo
            </button>
          </div>
        ) : (
          <div className="grid gap-px bg-black border border-black rounded-lg overflow-hidden">
            {projects.map((project, i) => (
              <Link
                key={project.id}
                to={`/workspace/${project.id}`}
                className="group flex items-center gap-4 p-6 bg-white hover:bg-[#FFFBEA] transition-colors"
              >
                <span className="text-xs text-gray-300 shrink-0 w-8">{String(i + 1).padStart(2, '0')}</span>
                <div className="w-10 h-10 rounded-md border border-black flex items-center justify-center shrink-0 group-hover:bg-editorial transition-colors">
                  <Github className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{project.repo_full_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {project.stack && (
                      <span className="text-xs text-black bg-editorial px-2 py-0.5 rounded font-bold">{project.stack}</span>
                    )}
                    {project.architecture_notes && (
                      <span className="text-xs text-gray-400 truncate">{project.architecture_notes}</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0" />
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