import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, Bot, Zap, Shield, Check } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold font-heading">C</span>
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">Consul</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
            Sign in
          </Link>
          <Link to="/register" className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-20 pb-24 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Autonomous coding agent
          </span>
        </div>

        <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl">
          Deploy an AI engineer<br />
          <span className="text-gray-400">that actually ships code.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 mt-6 max-w-2xl leading-relaxed">
          Connect a GitHub repo. Describe what you want built. Oikos reads your codebase, writes production-ready files, and commits directly — no hand-holding required.
        </p>

        <div className="flex items-center gap-3 mt-8">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
          >
            Start building
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3.5 text-gray-700 hover:text-gray-900 font-medium transition-colors">
            Create account
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-3 gap-4 mt-20">
          {[
            { icon: Bot, title: 'Plans before coding', desc: 'Oikos analyzes your codebase and outlines a plan before touching a single file.' },
            { icon: GitBranch, title: 'Reads & writes to GitHub', desc: 'Full repository access — reads existing files, writes new ones, commits instantly.' },
            { icon: Shield, title: 'Production quality', desc: 'No stubs, no placeholders. Every file is complete, typed, and ready to ship.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-heading font-semibold text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-center">
            Three steps. Zero friction.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-14">
            {[
              { step: '01', title: 'Connect a repo', desc: 'Paste any GitHub repository URL. Oikos indexes the file tree and key files instantly.' },
              { step: '02', title: 'Describe the task', desc: 'Tell Oikos what to build in plain English. It reads the relevant files and plans the approach.' },
              { step: '03', title: 'Review the commits', desc: 'Oikos writes complete files and commits them to your repo. Watch every operation in real time.' },
            ].map((s) => (
              <div key={s.step} className="relative">
                <span className="font-heading text-4xl font-bold text-gray-200">{s.step}</span>
                <h3 className="font-heading text-lg font-semibold mt-2">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
            Stop describing tickets.<br />Start shipping code.
          </h2>
          <p className="text-gray-500 mt-4 text-lg">
            Connect your first repo and task Oikos in under a minute.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all mt-8"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-heading">C</span>
            </div>
            <span className="font-heading font-semibold text-sm">Consul</span>
          </div>
          <p className="text-xs text-gray-400">Built for engineers who ship.</p>
        </div>
      </footer>
    </div>
  );
}