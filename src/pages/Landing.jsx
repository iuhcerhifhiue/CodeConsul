import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, Bot, Terminal } from 'lucide-react';
import CodeStream from '@/components/CodeStream';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black bg-white">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 py-4">
          <Link to="/" className="font-bold text-xl tracking-tight">Consul</Link>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm hover:underline">Sign in</Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
              
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* 01 Hero */}
      <section className="border-b border-black">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-editorial mb-8">01 — AUTONOMOUS CODING AGENT</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              DEPLOY AN AI ENGINEER THAT ACTUALLY{' '}
              <span className="bg-editorial px-2 py-0.5 text-5xl">SHIPS CODE.</span>
            </h1>
            <p className="text-base text-gray-600 mt-8 max-w-md leading-relaxed">
              Paste a GitHub URL. Describe what you want built. Oikos reads your codebase, writes production-ready files, and commits directly — no hand-holding required.
            </p>
            <div className="flex items-center gap-3 mt-10">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                
                Start building <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 border border-black rounded-md text-sm font-medium hover:bg-black hover:text-white transition-colors">
                
                Create account
              </Link>
            </div>
          </div>
          <CodeStream />
        </div>
      </section>

      {/* 02 Capabilities */}
      <section className="border-b border-black">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
          <p className="text-xs font-bold tracking-[0.2em] text-editorial mb-4">02 — CAPABILITIES</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">NOT A CHATBOT. AN ENGINEER.</h2>
          <p className="text-base text-gray-600 max-w-xl mb-12">
            Oikos operates with full repository context — reading, writing, and committing real code.
          </p>

          <div className="grid md:grid-cols-3 gap-px bg-black border border-black rounded-lg overflow-hidden">
            {/* 02.1 large */}
            <div className="md:col-span-2 md:row-span-2 bg-white p-8 flex flex-col">
              <p className="text-xs text-gray-400 mb-4">02.1</p>
              <h3 className="text-2xl font-bold mb-3">Reads before writing</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md leading-relaxed">
                Oikos analyzes your entire file tree and reads key files before touching anything. It understands your architecture, conventions, and patterns — then writes code that fits.
              </p>
              <div className="mt-auto border border-black rounded-md p-4 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">✓</span>
                  <span className="text-gray-500">read</span>
                  <span>src/App.tsx</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">✓</span>
                  <span className="text-gray-500">read</span>
                  <span>src/lib/utils.ts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-black font-bold">✓</span>
                  <span className="font-bold">write</span>
                  <span>src/components/Header.tsx</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-500">committed</span>
                  <span className="text-gray-500">a3f8b2c</span>
                </div>
              </div>
            </div>
            {/* 02.2 */}
            <div className="bg-white p-8">
              <p className="text-xs text-gray-400 mb-4">02.2</p>
              <h3 className="text-lg font-bold mb-2">Direct commits</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Every file write commits to your repo instantly. No staging, no copy-paste.</p>
            </div>
            {/* 02.3 */}
            <div className="bg-white p-8">
              <p className="text-xs text-gray-400 mb-4">02.3</p>
              <h3 className="text-lg font-bold mb-2">Security-first</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Input validation, sanitized outputs, no hardcoded secrets. Production-grade.</p>
            </div>
            {/* 02.4 full width */}
            <div className="md:col-span-3 bg-white p-8">
              <p className="text-xs text-gray-400 mb-4">02.4</p>
              <div className="flex items-start gap-4">
                <Terminal className="w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">Plan → Execute → Review → Ship</h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                    Every task follows a rigorous four-phase workflow. Oikos plans the approach, executes file-by-file, reviews its own work, and reports what shipped.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 Workflow */}
      <section className="border-b border-black">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
          <p className="text-xs font-bold tracking-[0.2em] text-editorial mb-4">03 — WORKFLOW</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-12">THREE STEPS. ZERO FRICTION.</h2>
          <div className="grid md:grid-cols-3 gap-px bg-black border border-black rounded-lg overflow-hidden">
            {[
            { step: '01', icon: GitBranch, title: 'Paste a URL', desc: 'Drop any GitHub repository link. Oikos indexes the file tree and key files in seconds.' },
            { step: '02', icon: Bot, title: 'Describe the task', desc: 'Tell Oikos what to build in plain English. It reads relevant files and plans the approach.' },
            { step: '03', icon: ArrowRight, title: 'Review the commits', desc: 'Oikos writes complete files and commits them directly. Watch every operation in real time.' }].
            map((s) =>
            <div key={s.step} className="bg-white p-8">
                <div className="flex items-center gap-3 mb-6">
                  <s.icon className="w-5 h-5" />
                  <span className="text-5xl font-bold text-black/10">{s.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-black">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="border-2 border-black rounded-lg p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              STOP DESCRIBING TICKETS.<br />START SHIPPING CODE.
            </h2>
            <p className="text-base text-gray-600 mt-4">
              Connect your first repo and task Oikos in under a minute.
            </p>
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-800 transition-colors mt-8">
              
              Get started free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-sm">Consul</span>
            <span className="text-xs text-gray-400">Built for engineers who ship.</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link to="/login" className="text-xs text-gray-600 hover:text-black transition-colors">Sign in</Link>
            <a className="text-xs text-gray-600 hover:text-black transition-colors cursor-pointer">Repos</a>
            <Link to="/register" className="text-xs text-gray-600 hover:text-black transition-colors">Get started</Link>
            <a className="text-xs text-gray-600 hover:text-black transition-colors cursor-pointer">Blog</a>
            <a className="text-xs text-gray-600 hover:text-black transition-colors cursor-pointer">Contact</a>
            <span className="text-xs text-gray-300">PAGE 01 / FIN</span>
          </div>
        </div>
      </footer>
    </div>);

}