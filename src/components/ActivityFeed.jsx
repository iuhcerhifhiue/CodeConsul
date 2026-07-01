import { Eye, FilePen, Trash2, Loader2, Check, X } from 'lucide-react';

const operationConfig = {
  read: { icon: Eye, label: 'Reading', color: 'text-cyan-400/60', activeColor: 'text-cyan-400' },
  write: { icon: FilePen, label: 'Writing', color: 'text-green-400/60', activeColor: 'text-green-400' },
  update: { icon: FilePen, label: 'Updating', color: 'text-green-400/60', activeColor: 'text-green-400' },
  delete: { icon: Trash2, label: 'Deleting', color: 'text-red-400/60', activeColor: 'text-red-400' },
};

function parseActivities(messages) {
  const activities = [];
  messages.forEach((msg, mi) => {
    if (msg.role === 'assistant' && msg.tool_calls) {
      msg.tool_calls.forEach((tc, ti) => {
        let args = {};
        try { args = JSON.parse(tc.arguments_string); } catch {}
        const op = args.operation || 'read';
        const path = args.file_path || 'unknown';
        const config = operationConfig[op] || operationConfig.read;
        activities.push({
          id: `${mi}-${ti}`,
          operation: op,
          path,
          config,
          status: tc.status,
        });
      });
    }
  });
  return activities;
}

export default function ActivityFeed({ messages }) {
  const activities = parseActivities(messages);

  if (!activities.length) {
    return (
      <div className="text-xs font-mono text-white/20 px-3 py-4 text-center">
        No activity yet
      </div>
    );
  }

  return (
    <div className="py-1">
      {activities.map((act) => {
        const Icon = act.config.icon;
        const isActive = ['pending', 'running', 'in_progress'].includes(act.status);
        const isDone = ['completed', 'success'].includes(act.status);
        const isFailed = ['failed', 'error'].includes(act.status);
        const iconColor = isActive ? act.config.activeColor : isDone ? 'text-white/25' : 'text-red-400/50';

        return (
          <div
            key={act.id}
            className={`flex items-center gap-2 px-3 py-1.5 transition-colors ${isActive ? 'bg-white/5' : ''}`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
            <span className={`text-[9px] font-mono uppercase tracking-wider shrink-0 ${isActive ? act.config.activeColor : 'text-white/25'}`}>
              {act.config.label}
            </span>
            <span className="text-xs font-mono text-white/50 truncate flex-1">{act.path}</span>
            {isActive && <Loader2 className="w-3 h-3 animate-spin text-white/30 shrink-0" />}
            {isDone && <Check className="w-3 h-3 text-green-400/40 shrink-0" />}
            {isFailed && <X className="w-3 h-3 text-red-400/50 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}