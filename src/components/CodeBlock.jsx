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
    <div className="my-3 rounded-lg overflow-hidden border border-black/[0.08] bg-[#0D0D0D]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161618] border-b border-white/[0.06]">
        <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">{language || 'text'}</span>
        <button onClick={handleCopy} className="text-white/30 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-[#5046E5]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="font-mono text-xs text-white/80 leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}