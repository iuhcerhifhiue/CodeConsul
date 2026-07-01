import { Eye, FilePen, Trash2, Loader2, Check, X } from 'lucide-react';

const opConfig = {
  read: { icon: Eye, label: 'read', color: 'text-blue-400/60', dot: 'bg-blue-400' },
  write: { icon: FilePen, label: 'write', color: 'text-green-400/60', dot: 'bg-green-400' },
  update: { icon: FilePen, label: 'update', color: 'text-amber-400/60', dot: 'bg-amber-400' },
  delete: { icon: Trash2, label: 'delete', color: 'text-red-400/60', dot: 'bg-red-400' },
};

function parseActivities(messages) {
  const activities = [];
  messages.forEach((msg) => {
    if (msg.role === 'assistant' && msg.tool_calls) {
      msg.tool_calls.forEach((tc) => {
        let args = {};
        try { args = JSON.parse(tc.arguments_string); } catch {}
        const op = args.operation || 'read';
        const path = args.file_path || 'unknown';
        const config = opConfig[op] || opConfig.read;
        activities.push({ config, path, status: tc.status, op });
      });
    }
  });
  return activities;
}

export default function ActivityFeed({ messages }) {
  const activities = parseActivities(messages);

  if (!activities.length) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="font-mono text-[10px] text-white/15">No operations yet</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {activities.map((act, i) => {
        const Icon = act.config.icon;
        const isActive = ['pending', 'running', 'in_progress'].includes(act.status);
        const isDone = ['completed', 'success'].includes(act.status);
        const isFailed = ['failed', 'error'].includes(act.status);

        return (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-1.5 transition-colors ${isActive ? 'bg-white/[0.02]' : ''}`}
          >
            <div className={`w-1 h-1 rounded-full shrink-0 ${isActive ? act.config.dot : 'bg-white/10'}`} />
            {isActive ? (
              <Loader2 className={`w-3 h-3 shrink-0 animate-spin ${act.config.color}`} />
            ) : isDone ? (
              <Check className="w-3 h-3 shrink-0 text-green-400/40" />
            ) : isFailed ? (
              <X className="w-3 h-3 shrink-0 text-red-400/50" />
            ) : (
              <Icon className={`w-3 h-3 shrink-0 ${act.config.color}`} />
            )}
            <span className="font-mono text-[9px] text-white/30 shrink-0">{act.config.label}</span>
            <span className="font-mono text-[11px] text-white/45 truncate flex-1">{act.path}</span>
          </div>
        );
      })}
    </div>
  );
}