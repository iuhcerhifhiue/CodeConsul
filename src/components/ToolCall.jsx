import { useState } from 'react';
import { ChevronRight, Eye, FilePen, Trash2, Loader2, Check, X, ChevronDown } from 'lucide-react';

const opConfig = {
  read: { icon: Eye, label: 'Read', accent: 'border-l-blue-400/60', iconColor: 'text-blue-400/70', bg: 'hover:bg-blue-400/[0.03]' },
  write: { icon: FilePen, label: 'Write', accent: 'border-l-green-400/60', iconColor: 'text-green-400/70', bg: 'hover:bg-green-400/[0.03]' },
  update: { icon: FilePen, label: 'Update', accent: 'border-l-amber-400/60', iconColor: 'text-amber-400/70', bg: 'hover:bg-amber-400/[0.03]' },
  delete: { icon: Trash2, label: 'Delete', accent: 'border-l-red-400/60', iconColor: 'text-red-400/70', bg: 'hover:bg-red-400/[0.03]' },
};

export default function ToolCall({ toolCall }) {
  const [expanded, setExpanded] = useState(false);

  let args = {};
  try { args = JSON.parse(toolCall.arguments_string); } catch {}

  let results = toolCall.results;
  if (typeof results === 'string') {
    try { results = JSON.parse(results); } catch {}
  }

  const op = args.operation || 'read';
  const config = opConfig[op] || opConfig.read;
  const filePath = args.file_path || args.repo_full_name || 'unknown';
  const fileName = filePath.split('/').pop();

  const isActive = ['pending', 'running', 'in_progress'].includes(toolCall.status);
  const isDone = ['completed', 'success'].includes(toolCall.status);
  const isFailed = ['failed', 'error'].includes(toolCall.status)
    || (typeof results === 'object' && results && results.success === false)
    || (typeof results === 'string' && /error|failed/i.test(results));

  const proj = toolCall.display_projection;
  const hideDetails = proj?.hide_details && proj?.details_redacted;

  const StatusIcon = isActive ? Loader2 : isDone ? Check : isFailed ? X : ChevronRight;
  const statusColor = isActive ? 'text-white/40' : isDone ? 'text-green-400/60' : isFailed ? 'text-red-400/60' : 'text-white/20';

  return (
    <div className={`my-1.5 border-l-2 ${config.accent} ${config.bg} transition-colors`}>
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full px-3 py-1.5 text-left ${hideDetails ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <StatusIcon className={`w-3 h-3 shrink-0 ${statusColor} ${isActive ? 'animate-spin' : ''}`} />
        <span className={`font-mono text-[10px] uppercase tracking-wider shrink-0 ${config.iconColor}`}>{config.label}</span>
        <span className="font-mono text-xs text-white/60 truncate flex-1">{fileName}</span>
        <span className="font-mono text-[9px] text-white/15 truncate hidden sm:block">{filePath}</span>
        {!hideDetails && (
          <ChevronDown className={`w-3 h-3 text-white/20 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>
      {expanded && !hideDetails && (
        <div className="px-3 pb-2 space-y-1.5">
          {Object.keys(args).length > 0 && (
            <div>
              <p className="font-mono text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Args</p>
              <pre className="font-mono text-[10px] text-white/40 bg-black/30 rounded p-2 overflow-x-auto">{JSON.stringify(args, null, 2)}</pre>
            </div>
          )}
          {results !== undefined && results !== null && (
            <div>
              <p className="font-mono text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Result</p>
              <pre className="font-mono text-[10px] text-white/40 bg-black/30 rounded p-2 overflow-x-auto">{typeof results === 'string' ? results : JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}