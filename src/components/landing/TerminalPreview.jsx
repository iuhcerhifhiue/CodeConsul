import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

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
      <div className="absolute -inset-4 bg-[#C8FF00]/[0.04] rounded-2xl blur-3xl pointer-events-none" />

      <div className="relative bg-[#0D0D0F] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
            <span className="text-xs text-white/50 font-mono">oikos — workspace</span>
          </div>
        </div>

        <div className="p-5 min-h-[380px] font-mono text-[13px]">
          {lines.slice(0, visible).map((line, i) => {
            if (line.type === 'user') return (
              <div key={i} className="animate-stream-in flex gap-2 py-0.5">
                <span className="text-[#C8FF00]">›</span>
                <span className="text-white/90">{line.text}</span>
              </div>
            );
            if (line.type === 'phase') return (
              <div key={i} className="animate-stream-in py-1.5 mt-3 first:mt-0">
                <span className="text-[10px] text-white/30 tracking-widest uppercase">{line.text}</span>
              </div>
            );
            if (line.type === 'deploy') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-0.5">
                <span className="text-white/20">→</span>
                <span className="text-[#C8FF00] font-semibold text-[12px]">{line.agent}</span>
                <span className="text-white/30 text-[10px]">deployed</span>
                <span className="text-white/40 text-[11px] truncate">{line.task}</span>
              </div>
            );
            if (line.type === 'read') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-0.5 ml-4">
                <CheckCircle2 className="w-2.5 h-2.5 text-white/20" />
                <span className="text-white/30 text-[11px]">read</span>
                <span className="text-white/50 text-[12px]">{line.file}</span>
              </div>
            );
            if (line.type === 'write' || line.type === 'edit') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-0.5 ml-4">
                <CheckCircle2 className="w-2.5 h-2.5 text-[#C8FF00]" />
                <span className="text-[#C8FF00] text-[11px] font-semibold">{line.type}</span>
                <span className="text-white/80 text-[12px]">{line.file}</span>
                <span className="text-white/25 text-[10px] ml-auto">{line.detail}</span>
              </div>
            );
            if (line.type === 'commit') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-1 mt-3 pt-3 border-t border-white/[0.06]">
                <span className="text-blue-400 text-[11px]">↳</span>
                <span className="text-blue-400 text-[11px] font-semibold">{line.sha}</span>
                <span className="text-white/40 text-[11px] truncate">{line.msg}</span>
              </div>
            );
            if (line.type === 'done') return (
              <div key={i} className="animate-stream-in flex items-center gap-2 py-1 mt-2">
                <span className="w-2 h-2 rounded-full bg-[#C8FF00]" />
                <span className="text-white/80 text-[12px] font-semibold">{line.text}</span>
              </div>
            );
            return null;
          })}
          {visible < lines.length && (
            <span className="inline-block w-2 h-4 bg-[#C8FF00] animate-blink ml-1 mt-1" />
          )}
        </div>
      </div>
    </div>
  );
}