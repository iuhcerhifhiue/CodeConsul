import { useState } from 'react';
import { ChevronRight, Eye, FilePen, Trash2, Loader2, Check, X, ChevronDown } from 'lucide-react';

const opConfig = {
  read: { icon: Eye, label: 'Read', color: 'text-blue-600' },
  write: { icon: FilePen, label: 'Write', color: 'text-green-600' },
  update: { icon: FilePen, label: 'Update', color: 'text-amber-600' },
  delete: { icon: Trash2, label: 'Delete', color: 'text-red-600' },
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

  const isActive = ['pending', 'running', 'in_progress'].includes(toolCall.status);
  const isDone = ['completed', 'success'].includes(toolCall.status);
  const isFailed = ['failed', 'error'].includes(toolCall.status)
    || (typeof results === 'object' && results && results.success === false)
    || (typeof results === 'string' && /error|failed/i.test(results));

  const proj = toolCall.display_projection;
  const hideDetails = proj?.hide_details && proj?.details_redacted;

  const label = proj?.active_label && isActive ? proj.active_label
    : proj?.error_label && isFailed ? proj.error_label
    : proj?.label && isDone ? proj.label
    : config.label;

  const StatusIcon = isActive ? Loader2 : isDone ? Check : isFailed ? X : ChevronRight;
  const statusColor = isActive ? 'text-gray-400' : isDone ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-gray-400';

  // Result summary line
  let resultSummary = '';
  if (isDone && results) {
    if (results.operation === 'updated' || results.operation === 'created') resultSummary = ` ${results.operation}`;
    else if (results.operation === 'deleted') resultSummary = ' deleted';
    else if (results.size) resultSummary = ` ${results.size} lines`;
    else if (results.commit_sha) resultSummary = ' committed';
  }

  return (
    <div className="ml-6">
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className={`flex items-center gap-1.5 w-full text-left group ${hideDetails ? 'cursor-default' : 'hover:bg-gray-50'} rounded px-1.5 py-0.5 -mx-1.5 transition-colors`}
      >
        <StatusIcon className={`w-3 h-3 shrink-0 ${statusColor} ${isActive ? 'animate-spin' : ''}`} />
        <span className={`text-[12px] font-semibold shrink-0 ${config.color}`}>{label}</span>
        <span className="text-[12px] text-gray-600 truncate">{filePath}</span>
        {resultSummary && <span className="text-[12px] text-gray-400 shrink-0">{resultSummary}</span>}
        {!hideDetails && (
          <ChevronDown className={`w-3 h-3 text-gray-300 shrink-0 ml-auto transition-transform ${expanded ? 'rotate-180' : ''} group-hover:text-gray-400`} />
        )}
      </button>
      {expanded && !hideDetails && (
        <div className="ml-4 mt-1 mb-2 border-l-2 border-gray-100 pl-3 space-y-2">
          {Object.keys(args).length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Input</p>
              <pre className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto border border-gray-100 max-h-48 overflow-y-auto">{JSON.stringify(args, null, 2)}</pre>
            </div>
          )}
          {results !== undefined && results !== null && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Output</p>
              <pre className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto border border-gray-100 max-h-48 overflow-y-auto">{typeof results === 'string' ? results : JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}