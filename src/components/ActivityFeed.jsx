import { Eye, FilePen, Trash2, Loader2, Check, X } from 'lucide-react';

const opConfig = {
  read: { icon: Eye, label: 'read', color: 'text-blue-500' },
  write: { icon: FilePen, label: 'write', color: 'text-green-500' },
  update: { icon: FilePen, label: 'update', color: 'text-amber-500' },
  delete: { icon: Trash2, label: 'delete', color: 'text-red-500' },
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
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-gray-400">No operations yet</p>
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
            className={`flex items-center gap-2 px-4 py-2 transition-colors ${isActive ? 'bg-gray-50' : ''}`}
          >
            {isActive ? (
              <Loader2 className={`w-3.5 h-3.5 shrink-0 animate-spin ${act.config.color}`} />
            ) : isDone ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-green-400" />
            ) : isFailed ? (
              <X className="w-3.5 h-3.5 shrink-0 text-red-400" />
            ) : (
              <Icon className={`w-3.5 h-3.5 shrink-0 ${act.config.color}`} />
            )}
            <span className={`text-xs shrink-0 ${act.config.color}`}>{act.config.label}</span>
            <span className="text-xs text-gray-500 truncate flex-1">{act.path}</span>
          </div>
        );
      })}
    </div>
  );
}