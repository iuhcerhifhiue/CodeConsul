import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, Shield, Search, Users, CheckCircle2, Terminal } from 'lucide-react';
import TerminalPreview from '@/components/landing/TerminalPreview';
import AgentGrid from '@/components/landing/AgentGrid';
import Logo from '@/components/Logo';

const features = [
  { icon: Search, title: 'Full repo context', desc: 'Reads your entire file tree and key files before writing a single line. No blind patches.' },
  { icon: GitBranch, title: 'Direct to GitHub', desc: 'Every write commits instantly. Changes land on a review branch and open a pull request.' },
  { icon: Users, title: '22 specialist agents', desc: 'Each agent owns a domain — backend, UI, security, DevOps. Oikos delegates to the right one.' },
  { icon: Shield, title: 'Verified before PR', desc: 'Tests and builds run automatically. Failed verification triggers a repair loop before you review.' },
];

const steps = [
  { num: '01', icon: GitBranch, title: 'Connect your repo', desc: 'Paste a GitHub URL. We index the file tree and read key files in seconds.' },
  { num: '02', icon: Terminal, title: 'Describe the task', desc: 'Tell Oikos what you want built. It breaks down the work and delegates to specialists.' },
  { num: '03', icon: CheckCircle2, title: 'Review the PR', desc: 'Agents write code, verify it works, and open a pull request. You review and merge.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black font-body antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-heading font-bold text-lg tracking-tight">Consul</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-black/50 hover:text-black transition-colors">Features</a>
            <a href="#workflow" className="text-sm text-black/50 hover:text-black transition-colors">Workflow</a>
            <a href="#agents" className="text-sm text-black/50 hover:text-black transition-colors">Agents</a>
            <Link to="/plans" className="text-sm text-black/50 hover:text-black transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-black/60 hover:text-black transition-colors">Sign in</Link>
            <Link to="/register" className="text-sm font-medium bg-[#0D0D0D] text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#5046E5]/[0.05] rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-20 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.08] bg-[#FAFAFA] mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5046E5] animate-pulse" />
                <span className="text-xs text-black/60 font-medium">22 specialist agents · CEO orchestrated</span>
              </div>

              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                An AI engineering team<br className="hidden md:block" /> that{' '}
                <span className="text-[#5046E5]">ships real code.</span>
              </h1>

              <p className="text-base md:text-lg text-black/50 mt-6 max-w-lg leading-relaxed">
                Connect your repo. Describe the task. Oikos delegates to specialist agents that read your codebase, write production files, and open pull requests — autonomously.
              </p>

              <div className="flex items-center gap-3 mt-10">
                <Link to="/dashboard" className="group inline-flex items-center gap-2 px-6 py-3 bg-[#0D0D0D] text-white rounded-lg text-sm font-semibold hover:bg-black/80 transition-colors">
                  Start building
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 border border-black/[0.12] text-black rounded-lg text-sm font-medium hover:bg-[#FAFAFA] transition-colors">
                  Create account
                </Link>
              </div>

              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-black/[0.06]">
                <div>
                  <p className="text-2xl font-bold font-heading">22</p>
                  <p className="text-xs text-black/40 mt-0.5">specialist agents</p>
                </div>
                <div className="w-px h-10 bg-black/[0.06]" />
                <div>
                  <p className="text-2xl font-bold font-heading">∞</p>
                  <p className="text-xs text-black/40 mt-0.5">repo context</p>
                </div>
                <div className="w-px h-10 bg-black/[0.06]" />
                <div>
                  <p className="text-2xl font-bold font-heading">PR</p>
                  <p className="text-xs text-black/40 mt-0.5">based workflow</p>
                </div>
              </div>
            </div>

            <TerminalPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-black/[0.06] bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold tracking-wider text-[#5046E5] mb-3 uppercase">Capabilities</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">Not a chatbot. An engineering team.</h2>
            <p className="text-base text-black/50 mt-4">
              Every agent operates with full repository context — reading, writing, and committing real code to your GitHub.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-black/[0.06] rounded-xl overflow-hidden border border-black/[0.06]">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-6 hover:bg-[#FAFAFA] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[#F4F4F5] flex items-center justify-center mb-5 group-hover:bg-[#5046E5] transition-colors">
                  <f.icon className="w-5 h-5 text-black/50 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-black mb-2">{f.title}</h3>
                <p className="text-xs text-black/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold tracking-wider text-[#5046E5] mb-3 uppercase">Workflow</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">Three steps. Zero friction.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg border border-black/[0.08] bg-[#FAFAFA] flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-black/70" />
                  </div>
                  <span className="font-heading text-4xl font-bold text-black/[0.08]">{s.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-black mb-3">{s.title}</h3>
                <p className="text-sm text-black/50 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 -right-3 text-black/10">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="border-t border-black/[0.06] bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold tracking-wider text-[#5046E5] mb-3 uppercase">The Team</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">22 specialists. One orchestrator.</h2>
            <p className="text-base text-black/50 mt-4">
              Oikos (CEO) breaks down your task and delegates to the right agents. Each specialist reads, writes, and verifies its own work.
            </p>
          </div>

          <AgentGrid />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="relative rounded-2xl border border-black/[0.08] bg-gradient-to-b from-[#FAFAFA] to-white p-12 md:p-20 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#5046E5]/[0.06] rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
                Stop describing tickets.<br />Start shipping code.
              </h2>
              <p className="text-base text-black/50 mt-4">
                Connect your first repo and task Oikos in under a minute.
              </p>
              <Link to="/dashboard" className="group inline-flex items-center gap-2 px-8 py-4 bg-[#0D0D0D] text-white rounded-lg text-sm font-semibold hover:bg-black/80 transition-colors mt-8">
                Get started free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-heading font-bold text-sm">Consul</span>
            <span className="text-xs text-black/30 ml-4">Built for engineers who ship.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-xs text-black/50 hover:text-black transition-colors">Sign in</Link>
            <Link to="/register" className="text-xs text-black/50 hover:text-black transition-colors">Get started</Link>
            <Link to="/plans" className="text-xs text-black/50 hover:text-black transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}