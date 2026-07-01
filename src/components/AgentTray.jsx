import { Loader2 } from 'lucide-react';

export default function AgentTray({ status }) {
  const isActive = status === 'thinking' || status === 'executing';

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-t border-white/5 bg-[#080B0F]">
      <div className="flex items-center gap-1.5">
        {isActive ? (
          <Loader2 className="w-3 h-3 animate-spin text-amber-400/70" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
        )}
        <span className="font-mono text-[10px] text-white/30">
          {isActive ? (
            <span className="text-amber-400/70">Oikos working</span>
          ) : (
            <span>Oikos idle</span>
          )}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="font-mono text-[9px] text-white/15 hidden sm:block">autonomous mode</span>
      </div>
    </div>
  );
}