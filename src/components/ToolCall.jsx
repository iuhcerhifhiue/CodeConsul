import { useState } from 'react';
import { ChevronRight, Eye, FilePen, Trash2, Loader2, Check, X, ChevronDown } from 'lucide-react';

const opConfig = {
  read: { icon: Eye, label: 'Read', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  write: { icon: FilePen, label: 'Write', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  update: { icon: FilePen, label: 'Update', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  delete: { icon: Trash2, label: 'Delete', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
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
  const statusColor = isActive ? 'text-gray-400' : isDone ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-gray-400';

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden`}>
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-left ${hideDetails ? 'cursor-default' : 'hover:bg-black/[0.02]'}`}
      >
        <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusColor} ${isActive ? 'animate-spin' : ''}`} />
        <span className={`text-xs font-medium shrink-0 ${config.color}`}>{config.label}</span>
        <span className="text-sm text-gray-700 truncate flex-1">{fileName}</span>
        <span className="text-xs text-gray-400 truncate hidden sm:block">{filePath}</span>
        {!hideDetails && (
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>
      {expanded && !hideDetails && (
        <div className="px-3 pb-3 space-y-2 border-t border-black/5">
          {Object.keys(args).length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Parameters</p>
              <pre className="text-xs text-gray-600 bg-white rounded-lg p-2.5 overflow-x-auto border border-gray-100">{JSON.stringify(args, null, 2)}</pre>
            </div>
          )}
          {results !== undefined && results !== null && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Result</p>
              <pre className="text-xs text-gray-600 bg-white rounded-lg p-2.5 overflow-x-auto border border-gray-100">{typeof results === 'string' ? results : JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}