import { Link } from 'react-router-dom';
import ParticleField from '@/components/ParticleField';
import TypingTerminal from '@/components/TypingTerminal';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[#080B0F] overflow-hidden flex flex-col">
      <ParticleField />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.8) 2px, rgba(255,255,255,0.8) 4px)' }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">Consul v1.0</span>
        </div>
        <span className="font-mono text-[10px] text-white/20">AGENT: OIKOS // ONLINE</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">Autonomous Coding Platform</span>
        </div>

        <h1
          className="font-display text-[20vw] md:text-[12vw] font-black tracking-tighter text-white leading-[0.85]"
          style={{ textShadow: '0 0 80px rgba(0, 229, 255, 0.15)' }}
        >
          CONSUL
        </h1>

        <p className="font-mono text-xs md:text-sm text-white/40 mt-4 max-w-md text-center tracking-wide leading-relaxed">
          Connect a repo. Tell the agent what to build.<br />
          It plans, codes, reviews, and ships — autonomously.
        </p>

        <div className="mt-8 w-full max-w-lg">
          <TypingTerminal />
        </div>

        <Link
          to="/dashboard"
          className="mt-8 group flex items-center gap-3 px-8 py-3.5 bg-transparent border border-cyan-400/30 hover:bg-cyan-400/10 transition-all"
        >
          <span className="font-mono text-sm text-cyan-400 tracking-wider">CONNECT A REPO</span>
          <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <span className="font-mono text-[10px] text-white/15">SYSTEM READY</span>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-white/15">REPO: CONNECTED</span>
          <span className="font-mono text-[10px] text-white/15">AGENT: IDLE</span>
        </div>
      </div>
    </div>
  );
}