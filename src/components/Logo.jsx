export default function Logo({ size = 28, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#0D0D0D" />
      <rect x="12" y="12" width="24" height="24" rx="6" fill="#5046E5" />
      <rect x="18" y="18" width="12" height="12" rx="3" fill="#0D0D0D" />
      <circle cx="24" cy="24" r="2" fill="#5046E5" />
    </svg>
  );
}