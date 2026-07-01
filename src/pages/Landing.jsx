import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, Bot, Shield, Zap, Brain, FilePen, GitCommit, Sparkles, Terminal } from 'lucide-react';
import Logo from '@/components/Logo';
import CodeStream from '@/components/CodeStream';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-heading text-lg font-bold tracking-tight">Consul</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a0f] text-white pt-32 pb-20">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-float-slow-2" />
        <div className="absolute inset-0 grid-pattern opacity-50" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-gray-300">Autonomous coding agent</span>
              <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
            </div>

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Deploy an AI engineer<br />
              that actually{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                ships code.
              </span>
            </h1>

            <p className="text-lg text-gray-400 mt-6 max-w-lg leading-relaxed">
              Paste a GitHub URL. Describe what you want built. Oikos reads your codebase, writes production-ready files, and commits directly — no hand-holding required.
            </p>

            <div className="flex items-center gap-3 mt-8">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-all"
              >
                Start building
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl font-medium transition-colors"
              >
                Create account
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12">
              {[
                { value: '12k+', label: 'files written' },
                { value: '800+', label: 'repos connected' },
                { value: '99.9%', label: 'uptime' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-heading text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live agent preview */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <CodeStream />
          </div>
        </div>
      </section>

      {/* Bento capabilities */}
      <section className="px-6 md:px-10 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Capabilities</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
            Not a chatbot. An engineer.
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            Oikos operates with full repository context — reading, writing, and committing real code.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Large card */}
          <div className="md:col-span-2 md:row-span-2 p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-5">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold">Reads before writing</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-md">
              Oikos analyzes your entire file tree and reads key files before touching anything. It understands your architecture, conventions, and patterns — then writes code that fits.
            </p>
            <div className="mt-auto pt-8">
              <div className="rounded-xl bg-white/60 border border-indigo-100 p-4 font-mono text-xs space-y-1">
                <div className="flex items-center gap-2 text-blue-600"><FilePen className="w-3 h-3" /><span>read</span><span className="text-gray-500">src/App.tsx</span></div>
                <div className="flex items-center gap-2 text-blue-600"><FilePen className="w-3 h-3" /><span>read</span><span className="text-gray-500">src/lib/utils.ts</span></div>
                <div className="flex items-center gap-2 text-green-600"><FilePen className="w-3 h-3" /><span>write</span><span className="text-gray-500">src/components/Header.tsx</span></div>
                <div className="flex items-center gap-2 text-gray-400"><GitCommit className="w-3 h-3" /><span>committed</span><span className="text-gray-500">a3f8b2c</span></div>
              </div>
            </div>
          </div>

          {/* Small cards */}
          <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-heading font-bold text-base">Direct commits</h3>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">Every file write commits to your repo instantly. No staging, no copy-paste.</p>
          </div>

          <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-heading font-bold text-base">Security-first</h3>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">Input validation, sanitized outputs, no hardcoded secrets. Production-grade.</p>
          </div>

          <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 md:col-span-2">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base">Plan → Execute → Review → Ship</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">Every task follows a rigorous four-phase workflow. Oikos plans the approach, executes file-by-file, reviews its own work, and reports what shipped.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[#0a0a0f] text-white py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Workflow</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
              Three steps. Zero friction.
            </h2>
          </div>

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connection line */}
            <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/40 to-violet-500/0" />

            {[
              { step: '01', icon: GitBranch, title: 'Paste a URL', desc: 'Drop any GitHub repository link. Oikos indexes the file tree and key files in seconds.' },
              { step: '02', icon: Bot, title: 'Describe the task', desc: 'Tell Oikos what to build in plain English. It reads relevant files and plans the approach.' },
              { step: '03', icon: Zap, title: 'Review the commits', desc: 'Oikos writes complete files and commits them directly. Watch every operation in real time.' },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 mb-5 z-10">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <span className="block font-heading text-3xl font-bold text-white/10 mb-1">{s.step}</span>
                <h3 className="font-heading text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 py-24">
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 text-center">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative">
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white">
              Stop describing tickets.<br />Start shipping code.
            </h2>
            <p className="text-indigo-100 mt-4 text-lg">
              Connect your first repo and task Oikos in under a minute.
            </p>
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-all mt-8"
            >
              Get started free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-heading font-semibold text-sm">Consul</span>
          </div>
          <p className="text-xs text-gray-400">Built for engineers who ship.</p>
        </div>
      </footer>
    </div>
  );
}