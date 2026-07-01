import { useState, useEffect } from 'react';

const demoLines = [
  { text: '$ consul connect --repo owner/api', color: 'text-white/90' },
  { text: '→ Fetching repository structure...', color: 'text-cyan-400/50' },
  { text: '→ 247 files indexed. Stack: Next.js, TypeScript, Prisma', color: 'text-cyan-400/50' },
  { text: '→ Oikos initialized. Ready.', color: 'text-green-400' },
  { text: '', color: '' },
  { text: '$ Add JWT auth with refresh tokens', color: 'text-white/90' },
  { text: '## PLAN', color: 'text-cyan-400/70 font-bold uppercase tracking-widest text-[10px]' },
  { text: '  1. Create JWT utility (sign/verify/refresh)', color: 'text-white/40' },
  { text: '  2. Add auth middleware for protected routes', color: 'text-white/40' },
  { text: '  3. Implement refresh token rotation', color: 'text-white/40' },
  { text: '## EXECUTE', color: 'text-white/70 font-bold uppercase tracking-widest text-[10px]' },
  { text: '  → src/lib/jwt.ts', color: 'text-cyan-400' },
  { text: '  → src/middleware/auth.ts', color: 'text-cyan-400' },
  { text: '  → src/routes/auth.ts', color: 'text-cyan-400' },
  { text: '## REVIEW', color: 'text-orange-400 font-bold uppercase tracking-widest text-[10px]' },
  { text: '  ✓ Token expiry validated', color: 'text-orange-400/70' },
  { text: '  ✓ Refresh rotation prevents reuse', color: 'text-orange-400/70' },
  { text: '## DONE', color: 'text-green-400 font-bold uppercase tracking-widest text-[10px]' },
  { text: '  3 files created. Auth system deployed.', color: 'text-green-400' },
];

export default function TypingTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= demoLines.length) {
      const reset = setTimeout(() => setVisibleCount(0), 4000);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), visibleCount === 0 ? 600 : 130);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  return (
    <div className="bg-black/40 border border-white/5 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <span className="ml-2 font-mono text-[9px] text-white/20">consul — oikos — 80x24</span>
      </div>
      <div className="p-4 h-56 overflow-hidden font-mono text-xs space-y-0.5">
        {demoLines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className={line.color}>
            {line.text || '\u00A0'}
          </div>
        ))}
        {visibleCount < demoLines.length && (
          <span className="inline-block w-2 h-3.5 bg-cyan-400 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}