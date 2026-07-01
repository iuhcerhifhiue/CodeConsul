import { useState, useEffect } from 'react';
import { Brain, Check, FilePen, Terminal, Search, CheckCircle2 } from 'lucide-react';

const steps = [
  { type: 'phase', icon: Brain, label: 'Planning', color: 'text-blue-400' },
  { type: 'read', label: 'src/components/Auth.tsx', color: 'text-blue-400' },
  { type: 'read', label: 'src/lib/api.ts', color: 'text-blue-400' },
  { type: 'read', label: 'src/middleware.ts', color: 'text-blue-400' },
  { type: 'phase', icon: Terminal, label: 'Executing', color: 'text-amber-400' },
  { type: 'write', label: 'src/lib/jwt.ts', color: 'text-green-400', detail: 'created' },
  { type: 'write', label: 'src/middleware.ts', color: 'text-green-400', detail: 'updated' },
  { type: 'write', label: 'src/components/Auth.tsx', color: 'text-green-400', detail: 'updated' },
  { type: 'phase', icon: CheckCircle2, label: 'Complete', color: 'text-green-400' },
  { type: 'done', label: 'JWT auth with refresh tokens deployed', color: 'text-gray-400' },
];

export default function CodeStream() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= steps.length) {
      const reset = setTimeout(() => setVisible(0), 3000);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 600 : 900);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0d0d14] overflow-hidden shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[11px] text-gray-500 font-mono">oikos — auth-feature</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] text-gray-500 font-mono">live</span>
        </div>
      </div>

      {/* Stream */}
      <div className="p-4 space-y-1 min-h-[340px] font-mono">
        {steps.slice(0, visible).map((step, i) => {
          if (step.type === 'phase') {
            const Icon = step.icon;
            return (
              <div key={i} className="animate-stream-in flex items-center gap-1.5 mt-3 first:mt-0">
                <Icon className={`w-3 h-3 ${step.color}`} />
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${step.color}`}>
                  {step.label}
                </span>
              </div>
            );
          }
          if (step.type === 'done') {
            return (
              <div key={i} className="animate-stream-in flex items-start gap-2 mt-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                <span className="text-[12px] text-gray-400 leading-snug">{step.label}</span>
              </div>
            );
          }
          return (
            <div key={i} className="animate-stream-in flex items-center gap-2 ml-2">
              <Check className="w-3 h-3 text-gray-600 shrink-0" />
              {step.type === 'write' && <FilePen className={`w-3 h-3 ${step.color} shrink-0`} />}
              <span className={`text-[12px] ${step.color} font-medium`}>
                {step.type === 'write' ? 'write' : 'read'}
              </span>
              <span className="text-[12px] text-gray-500 truncate">{step.label}</span>
              {step.detail && <span className="text-[11px] text-gray-600">{step.detail}</span>}
            </div>
          );
        })}
        {visible < steps.length && (
          <div className="flex items-center gap-1.5 ml-2 mt-1">
            <div className="w-1.5 h-3 bg-indigo-400 animate-blink" />
          </div>
        )}
      </div>
    </div>
  );
}