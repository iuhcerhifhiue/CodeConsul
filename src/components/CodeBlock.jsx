import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border border-white/10 border-b-0 rounded-t-md">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{language || 'code'}</span>
        <button onClick={handleCopy} className="text-white/30 hover:text-cyan-400 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="bg-[#0D1117] border border-white/10 rounded-b-md p-3 overflow-x-auto">
        <code className="font-mono text-xs text-white/80 leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}