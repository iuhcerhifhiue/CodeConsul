import { useState, useEffect } from 'react';

const steps = [
  { type: 'phase', label: 'PLANNING' },
  { type: 'read', label: 'src/components/Auth.tsx' },
  { type: 'read', label: 'src/lib/api.ts' },
  { type: 'read', label: 'src/middleware.ts' },
  { type: 'phase', label: 'EXECUTING' },
  { type: 'write', label: 'src/lib/jwt.ts', detail: 'created' },
  { type: 'write', label: 'src/middleware.ts', detail: 'updated' },
  { type: 'write', label: 'src/components/Auth.tsx', detail: 'updated' },
  { type: 'phase', label: 'COMPLETE' },
  { type: 'done', label: 'JWT auth with refresh tokens deployed' },
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
    <div className="relative border-2 border-editorial bg-[#FFFBEA] rounded-lg overflow-hidden shadow-[6px_6px_0_0_#000]">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-editorial">
        <span className="font-mono text-xs font-bold text-black">oikos — auth-feature</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-editorial animate-pulse" />
          <span className="font-mono text-xs text-black font-bold">Live</span>
        </div>
      </div>

      {/* Stream */}
      <div className="p-5 space-y-1 min-h-[340px] font-mono">
        {steps.slice(0, visible).map((step, i) => {
          if (step.type === 'phase') {
            return (
              <div key={i} className="animate-stream-in mt-4 first:mt-0">
                <span className="text-xs font-bold tracking-widest text-black bg-editorial px-2 py-0.5 rounded">
                  {step.label}
                </span>
              </div>
            );
          }
          if (step.type === 'done') {
            return (
              <div key={i} className="animate-stream-in flex items-start gap-2 mt-4 pt-3 border-t border-black/10">
                <span className="text-black shrink-0">→</span>
                <span className="text-xs text-gray-700 leading-snug">{step.label}</span>
              </div>
            );
          }
          return (
            <div key={i} className="animate-stream-in flex items-center gap-2 ml-1">
              <span className="text-black">✓</span>
              <span className={`text-xs font-bold ${step.type === 'write' ? 'text-black' : 'text-gray-500'}`}>
                {step.type === 'write' ? 'write' : 'read'}
              </span>
              <span className="text-xs text-gray-700 truncate">{step.label}</span>
              {step.detail && <span className="text-xs text-gray-400">{step.detail}</span>}
            </div>
          );
        })}
        {visible < steps.length && (
          <div className="ml-1 mt-1">
            <span className="inline-block w-2 h-4 bg-black animate-blink" />
          </div>
        )}
      </div>
    </div>
  );
}