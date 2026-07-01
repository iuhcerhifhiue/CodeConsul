import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-md overflow-hidden border border-white/[0.07] bg-[#0D1117]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/10" />
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">{language || 'text'}</span>
        </div>
        <button onClick={handleCopy} className="text-white/25 hover:text-amber-400/70 transition-colors">
          {copied ? <Check className="w-3 h-3 text-green-400/60" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="font-mono text-[11px] text-white/75 leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}