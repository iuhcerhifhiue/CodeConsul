import { Loader2, Zap } from 'lucide-react';
import Logo from '@/components/Logo';

export default function AgentTray({ status }) {
  const isActive = status === 'thinking' || status === 'executing';

  return (
    <div className="flex items-center gap-2 px-4 md:px-6 py-1.5 border-t border-gray-200 bg-white/80 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-2">
        <div className="relative">
          {isActive ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-ring" />
          )}
        </div>
        <span className="text-[11px] text-gray-500 font-mono">
          {isActive ? 'Oikos is working' : 'Oikos is ready'}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-indigo-400" />
          <span className="text-[11px] text-gray-400 hidden sm:block font-mono">autonomous mode</span>
        </div>
        <div className="w-px h-3 bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <Logo size={14} />
          <span className="text-[11px] text-gray-300 font-mono hidden sm:block">read &amp; write</span>
        </div>
      </div>
    </div>
  );
}