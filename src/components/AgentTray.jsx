import { Loader2 } from 'lucide-react';

export default function AgentTray({ status }) {
  const isActive = status === 'thinking' || status === 'executing';

  return (
    <div className="flex items-center gap-2 px-4 md:px-8 py-1.5 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-1.5">
        {isActive ? (
          <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        )}
        <span className="text-[11px] text-gray-400 font-mono">
          {isActive ? 'Oikos is working' : 'Oikos is ready'}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[11px] text-gray-300 hidden sm:block font-mono">autonomous mode</span>
      </div>
    </div>
  );
}