import { Bot, Lock } from 'lucide-react';

export default function AgentTray({ status }) {
  const isActive = status === 'thinking' || status === 'executing';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-white/5 bg-[#080B0F]/90 backdrop-blur-xl">
      <div className="relative">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${isActive ? 'border-orange-400/40 bg-orange-500/10' : 'border-white/10 bg-white/5'}`}>
          <Bot className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'text-cyan-400/50'}`} />
        </div>
        {isActive && (
          <div className="absolute inset-0 rounded-lg border border-orange-400/30 animate-ping" />
        )}
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080B0F] ${isActive ? 'bg-orange-400' : 'bg-green-400/60'}`} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-white">Oikos</span>
          <span className="font-mono text-[9px] text-white/20">v1.0</span>
        </div>
        <span className={`font-mono text-[10px] uppercase tracking-wider ${isActive ? 'text-orange-400' : 'text-white/30'}`}>
          {status || 'idle'}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
              <Lock className="w-3 h-3 text-white/10" />
            </div>
            <span className="font-mono text-[8px] text-white/10 uppercase">locked</span>
          </div>
        ))}
      </div>
    </div>
  );
}