import { Loader2, Zap } from 'lucide-react';

export default function AgentTray({ status }) {
  const isActive = status === 'thinking' || status === 'executing';

  return (
    <div className="flex items-center gap-2 px-4 md:px-6 py-1.5 border-t border-black bg-white shrink-0">
      <div className="flex items-center gap-2">
        <div className="relative">
          {isActive ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-editorial" />
          )}
        </div>
        <span className="text-[11px] text-gray-500">
          {isActive ? 'Oikos is working' : 'Oikos is ready'}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          <span className="text-[11px] text-gray-400 hidden sm:block">autonomous mode</span>
        </div>
        <div className="w-px h-3 bg-black hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-300 hidden sm:block">CONSUL / OIKOS</span>
        </div>
      </div>
    </div>
  );
}