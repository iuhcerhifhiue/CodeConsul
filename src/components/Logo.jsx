export default function Logo({ size = 32, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect x="3" y="3" width="42" height="42" rx="13" fill="#C8FF00" />
      <circle cx="24" cy="24" r="8" fill="#08080A" />
      <circle cx="24" cy="24" r="2.5" fill="#C8FF00" />
    </svg>
  );
}