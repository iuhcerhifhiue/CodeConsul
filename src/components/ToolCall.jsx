import { useState } from 'react';
import { Eye, FilePen, Trash2, Loader2, Check, X, ChevronDown } from 'lucide-react';

const opConfig = {
  read: { icon: Eye, label: 'Read', color: 'text-black/40' },
  write: { icon: FilePen, label: 'Write', color: 'text-[#5046E5]' },
  update: { icon: FilePen, label: 'Update', color: 'text-[#5046E5]' },
  delete: { icon: Trash2, label: 'Delete', color: 'text-red-500' },
};

function extractFilePath(args) {
  return args.file_path || args.path || args.filePath || args.filename || args.repo_full_name || 'unknown';
}

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
  const filePath = extractFilePath(args);

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

  const StatusIcon = isActive ? Loader2 : isDone ? Check : isFailed ? X : config.icon;
  const statusColor = isActive ? 'text-[#5046E5]' : isDone ? 'text-[#5046E5]' : isFailed ? 'text-red-500' : 'text-black/30';

  let resultSummary = '';
  if (isDone && results) {
    if (results.operation === 'updated' || results.operation === 'created') resultSummary = `${results.operation}`;
    else if (results.operation === 'deleted') resultSummary = 'deleted';
    else if (results.size) resultSummary = `${results.size}b`;
    else if (results.commit_sha) resultSummary = 'committed';
  }

  const shortPath = filePath !== 'unknown'
    ? filePath.split('/').slice(-2).join('/')
    : 'unknown';

  return (
    <div>
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className={`flex items-center gap-1.5 w-full text-left group ${hideDetails ? 'cursor-default' : 'hover:bg-[#FAFAFA]'} rounded px-1.5 py-0.5 -mx-1.5 transition-colors`}
      >
        <StatusIcon className={`w-3 h-3 shrink-0 ${statusColor} ${isActive ? 'animate-spin' : ''}`} />
        <span className={`text-[12px] font-medium shrink-0 ${config.color}`}>{label}</span>
        <span className="text-[12px] text-black/50 truncate">{shortPath}</span>
        {resultSummary && <span className="text-[11px] text-black/30 shrink-0">{resultSummary}</span>}
        {!hideDetails && (
          <ChevronDown className={`w-3 h-3 text-black/20 shrink-0 ml-auto transition-transform ${expanded ? 'rotate-180' : ''} group-hover:text-black/40`} />
        )}
      </button>
      {expanded && !hideDetails && (
        <div className="ml-4 mt-0.5 mb-1 border-l-2 border-black/[0.06] pl-3 space-y-1.5">
          {Object.keys(args).length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-black/30 uppercase tracking-wider mb-0.5">Input</p>
              <pre className="text-[11px] text-black/60 bg-[#FAFAFA] rounded p-2 overflow-x-auto border border-black/[0.04] max-h-40 overflow-y-auto">{JSON.stringify(args, null, 2)}</pre>
            </div>
          )}
          {results !== undefined && results !== null && (
            <div>
              <p className="text-[10px] font-medium text-black/30 uppercase tracking-wider mb-0.5">Output</p>
              <pre className="text-[11px] text-black/60 bg-[#FAFAFA] rounded p-2 overflow-x-auto border border-black/[0.04] max-h-40 overflow-y-auto">{typeof results === 'string' ? results : JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}