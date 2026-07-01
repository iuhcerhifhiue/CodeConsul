import { Bot, Lock } from 'lucide-react';

export default function AgentTray({ status }) {
  const isActive = status === 'thinking' || status === 'executing';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-white/5 bg-[#080B0F]/80 backdrop-blur-xl">
      <div className="relative">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isActive ? 'bg-orange-500/20' : 'bg-white/5'}`}>
          <Bot className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'text-cyan-400/60'}`} />
        </div>
        {isActive && (
          <div className="absolute inset-0 rounded-full border-2 border-orange-400/40 animate-ping" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-mono font-semibold text-white">Oikos</span>
        <span className={`text-[10px] font-mono uppercase tracking-wider ${isActive ? 'text-orange-400' : 'text-white/30'}`}>
          {status || 'idle'}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="w-9 h-9 rounded-full border border-dashed border-white/10 flex items-center justify-center">
            <Lock className="w-3 h-3 text-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}