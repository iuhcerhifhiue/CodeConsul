import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const lines = [
  { type: 'user', text: 'Add JWT auth with refresh tokens' },
  { type: 'phase', text: 'Oikos — delegating to specialists' },
  { type: 'deploy', agent: 'backend_engineer', task: 'JWT middleware + token logic' },
  { type: 'deploy', agent: 'ui_builder', task: 'Login form component' },
  { type: 'read', file: 'src/middleware.ts' },
  { type: 'read', file: 'src/lib/db.ts' },
  { type: 'write', file: 'src/lib/jwt.ts', detail: '+142 lines' },
  { type: 'edit', file: 'src/middleware.ts', detail: 'updated' },
  { type: 'write', file: 'src/components/LoginForm.tsx', detail: '+89 lines' },
  { type: 'commit', sha: 'a3f8b2c', msg: 'feat: JWT auth with refresh tokens' },
  { type: 'done', text: 'Pull request opened — 3 files changed' },
];

export default function TerminalPreview() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= lines.length) {
      const reset = setTimeout(() => setVisible(0), 4000);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 600 : 800);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-[#5046E5]/[0.06] rounded-3xl blur-3xl pointer-events-none" />

      <div className="relative bg-white border border-black/[0.08] rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.06] bg-[#FAFAFA]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5046E5] animate-pulse" />
            <span className="text-xs text-black/40 font-mono">oikos — workspace</span>
          </div>
        </div>

        <div className="p-5 min-h-[380px] font-mono text-[13px] bg-white">
          {lines.slice(0, visible).map((line, i) => {
            if (line.type === 'user') return (
              <div key={i} className="animate-stream-in flex gap-2 py-0.5">
                <span className="text-[#5046E5]">›</span>
                <span className="text-black/90">{line.text}</span>
              </div>
            );
            if (line.type === 'phase') return (
              <div key={i} className="animate-stream-in py-1.5 mt-3 first:mt-0">
                <span className="text-[10px] text-black/30 tracking-widest uppercase">{line.text}</span>
              </div>
            );
            if (line.type === 'deploy') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-0.5">
                <span className="text-black/20">→</span>
                <span className="text-[#5046E5] font-semibold text-[12px]">{line.agent}</span>
                <span className="text-black/30 text-[10px]">deployed</span>
                <span className="text-black/40 text-[11px] truncate">{line.task}</span>
              </div>
            );
            if (line.type === 'read') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-0.5 ml-4">
                <Check className="w-2.5 h-2.5 text-black/20" />
                <span className="text-black/30 text-[11px]">read</span>
                <span className="text-black/50 text-[12px]">{line.file}</span>
              </div>
            );
            if (line.type === 'write' || line.type === 'edit') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-0.5 ml-4">
                <Check className="w-2.5 h-2.5 text-[#5046E5]" />
                <span className="text-[#5046E5] text-[11px] font-semibold">{line.type}</span>
                <span className="text-black/80 text-[12px]">{line.file}</span>
                <span className="text-black/25 text-[10px] ml-auto">{line.detail}</span>
              </div>
            );
            if (line.type === 'commit') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-1 mt-3 pt-3 border-t border-black/[0.06]">
                <span className="text-[#5046E5] text-[11px]">↳</span>
                <span className="text-[#5046E5] text-[11px] font-semibold">{line.sha}</span>
                <span className="text-black/40 text-[11px] truncate">{line.msg}</span>
              </div>
            );
            if (line.type === 'done') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-1 mt-2">
                <span className="w-2 h-2 rounded-full bg-[#5046E5]" />
                <span className="text-black/80 text-[12px] font-semibold">{line.text}</span>
              </div>
            );
            return null;
          })}
          {visible < lines.length && (
            <span className="inline-block w-2 h-4 bg-[#5046E5] animate-blink ml-1 mt-1" />
          )}
        </div>
      </div>
    </div>
  );
}