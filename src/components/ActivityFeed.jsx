import { Eye, FilePen, Trash2, Loader2, Check, X, Inbox } from 'lucide-react';

const opConfig = {
  read: { icon: Eye, label: 'read', color: 'text-gray-500' },
  write: { icon: FilePen, label: 'write', color: 'text-black font-bold' },
  update: { icon: FilePen, label: 'update', color: 'text-black font-bold' },
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
        const path = args.file_path || args.path || args.filePath || 'unknown';
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
      <div className="px-4 py-12 text-center flex flex-col items-center gap-2">
        <Inbox className="w-6 h-6 text-gray-200" />
        <p className="text-xs text-gray-400">No operations yet</p>
        <p className="text-[11px] text-gray-300 max-w-[160px]">Agent activity will appear here as Oikos reads and writes files</p>
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
        const shortPath = act.path !== 'unknown' ? act.path.split('/').slice(-2).join('/') : 'unknown';

        return (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-1.5 transition-colors ${isActive ? 'bg-[#FFFBEA]' : ''} hover:bg-gray-50`}
          >
            {isActive ? (
              <Loader2 className="w-3 h-3 shrink-0 animate-spin text-black" />
            ) : isDone ? (
              <Check className="w-3 h-3 shrink-0 text-black" />
            ) : isFailed ? (
              <X className="w-3 h-3 shrink-0 text-red-500" />
            ) : (
              <Icon className={`w-3 h-3 shrink-0 ${act.config.color}`} />
            )}
            <span className={`text-[11px] shrink-0 ${act.config.color}`}>{act.config.label}</span>
            <span className="text-[11px] text-gray-600 truncate flex-1">{shortPath}</span>
          </div>
        );
      })}
    </div>
  );
}