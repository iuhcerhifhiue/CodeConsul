import { FileCode } from 'lucide-react';

export default function FileTree({ files, onSelect }) {
  if (!files.length) {
    return (
      <div className="text-xs font-mono text-white/20 px-3 py-2">
        No files generated yet
      </div>
    );
  }

  return (
    <div className="py-1">
      {files.map((file, i) => (
        <button
          key={i}
          onClick={() => onSelect?.(file)}
          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-white/5 transition-colors text-left"
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400/50 shrink-0" />
          <span className="text-xs font-mono text-white/60 truncate">{file}</span>
        </button>
      ))}
    </div>
  );
}