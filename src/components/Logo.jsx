export default function Logo({ size = 32, className = '' }) {
  const id = `oikos-grad-${size}`;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M24 4 C13 4 6 12 6 24 C6 36 13 44 24 44 C35 44 42 36 42 24 C42 12 35 4 24 4 Z M24 8 C32 8 38 14 38 24 C38 34 32 40 24 40 C16 40 10 34 10 24 C10 14 16 8 24 8 Z"
        fill={`url(#${id})`}
      />
      <path
        d="M24 14 Q30 24 24 34 Q18 24 24 14 Z"
        fill={`url(#${id})`}
        opacity="0.8"
      />
      <circle cx="24" cy="24" r="2.5" fill="#8b5cf6" />
    </svg>
  );
}