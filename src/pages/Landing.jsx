import { Link } from 'react-router-dom';
import ParticleField from '@/components/ParticleField';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[#080B0F] overflow-hidden">
      <ParticleField />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.6) 2px, rgba(255,255,255,0.6) 4px)' }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">Autonomous Coding Platform</span>
        </div>

        <h1 className="font-display text-[22vw] md:text-[13vw] font-black tracking-tighter text-white leading-[0.85]">
          CONSUL
        </h1>

        <p className="font-mono text-xs md:text-sm text-cyan-400/60 mt-6 max-w-md text-center tracking-wide leading-relaxed">
          Connect a repo. Tell the agent what to build.<br />It plans, codes, reviews, and ships — autonomously.
        </p>

        <Link
          to="/dashboard"
          className="mt-10 group flex items-center gap-3 px-8 py-3.5 bg-transparent border border-cyan-400/30 hover:bg-cyan-400/10 transition-all"
        >
          <span className="font-mono text-sm text-cyan-400 tracking-wider">CONNECT A REPO</span>
          <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <div className="absolute bottom-8 flex items-center gap-6 font-mono text-[10px] text-white/20">
          <span>AGENT: OIKOS</span>
          <span className="text-white/10">•</span>
          <span>STATUS: ONLINE</span>
        </div>
      </div>
    </div>
  );
}