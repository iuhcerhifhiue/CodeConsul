import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Github, ArrowRight, Loader2, Clock } from 'lucide-react';
import RepoPicker from '@/components/RepoPicker';
import Logo from '@/components/Logo';

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
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Top accent */}
      <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-heading text-lg font-bold tracking-tight">Consul</span>
          </Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Home
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Your connected repositories</p>
          </div>
          <button
            onClick={() => setShowRepoPicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Connect Repo</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-gray-200 rounded-2xl bg-white">
            <div className="mb-5">
              <Logo size={40} />
            </div>
            <p className="text-base font-medium text-gray-700">No projects yet</p>
            <p className="text-sm text-gray-400 mt-1">Paste a GitHub URL to get started</p>
            <button
              onClick={() => setShowRepoPicker(true)}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Connect Repo</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/workspace/${project.id}`}
                className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                  <Github className="w-5 h-5 text-gray-500 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{project.repo_full_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {project.stack && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">{project.stack}</span>
                    )}
                    {project.architecture_notes && (
                      <span className="text-xs text-gray-400 truncate">{project.architecture_notes}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
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