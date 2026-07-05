import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Github, ArrowRight, Loader2, Star, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-white text-black font-body antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-heading font-bold text-lg tracking-tight">Consul</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/plans" className="text-sm text-black/50 hover:text-black transition-colors">Plans</Link>
            <Link to="/" className="text-sm text-black/50 hover:text-black transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 pb-6 border-b border-black/[0.06]">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#5046E5] mb-2 uppercase">Projects</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">Your repositories</h1>
            <p className="text-sm text-black/40 mt-2">Connect a repo and start deploying agents.</p>
          </div>
          <button
            onClick={() => setShowRepoPicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D0D0D] text-white rounded-lg text-sm font-medium hover:bg-black/80 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Connect Repo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-black/20" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-black/[0.12] rounded-2xl bg-[#FAFAFA]">
            <div className="w-14 h-14 rounded-xl bg-white border border-black/[0.06] flex items-center justify-center mb-5 shadow-sm">
              <Github className="w-7 h-7 text-black/40" />
            </div>
            <p className="text-lg font-semibold">No projects yet</p>
            <p className="text-sm text-black/40 mt-1">Paste a GitHub URL to get started</p>
            <button
              onClick={() => setShowRepoPicker(true)}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#0D0D0D] text-white rounded-lg text-sm font-medium hover:bg-black/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Connect Repo
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/workspace/${project.id}`}
                className="group flex items-center gap-4 p-5 border border-black/[0.06] rounded-xl hover:border-black/[0.12] hover:shadow-sm bg-white transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F4F4F5] border border-black/[0.04] flex items-center justify-center shrink-0 group-hover:bg-[#5046E5] transition-colors">
                  <Github className="w-5 h-5 text-black/50 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{project.repo_full_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {project.stack && (
                      <span className="text-[11px] text-[#5046E5] bg-[#5046E5]/[0.08] px-2 py-0.5 rounded font-medium">{project.stack}</span>
                    )}
                    {project.architecture_notes && (
                      <span className="text-xs text-black/40 truncate">{project.architecture_notes}</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-black/20 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0" />
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