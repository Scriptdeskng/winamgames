interface AutoAdvanceRingProps {
  durationMs: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Animated SVG ring that fills over `durationMs` to indicate an upcoming
 * auto-advance. Pure visual — the actual timer lives in useGameSession.
 */
export function AutoAdvanceRing({
  durationMs,
  size = 28,
  strokeWidth = 2.5,
}: AutoAdvanceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={strokeWidth}
        opacity={0.4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        style={{
          animation: `auto-advance-ring ${durationMs}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes auto-advance-ring {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}
