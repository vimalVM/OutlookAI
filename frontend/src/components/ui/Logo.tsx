export function Logo({ className = "w-full h-full text-[#e8a33d]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Left curve of eye */}
        <path d="M 20 30 C 25 15, 45 15, 55 35" />
        <path d="M 20 30 C 25 55, 45 55, 55 35" />
        
        {/* Right intersecting arrow / eye part */}
        <path d="M 45 25 C 55 10, 75 10, 85 20" />
        <path d="M 45 45 C 55 60, 75 60, 85 45" />
        
        {/* Arrow head on the right curve */}
        <path d="M 75 10 L 88 10 L 88 23" />
        <line x1="55" y1="45" x2="88" y2="10" />
        
        {/* Inner pill shape */}
        <rect x="42" y="18" width="12" height="24" rx="6" />
      </g>
    </svg>
  );
}
