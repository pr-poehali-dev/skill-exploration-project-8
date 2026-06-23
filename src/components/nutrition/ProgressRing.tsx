interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  unit?: string;
}

const ProgressRing = ({
  value,
  max,
  size = 200,
  stroke = 14,
  color = 'hsl(var(--cal))',
  label,
  unit = 'ккал',
}: ProgressRingProps) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  const left = Math.max(max - value, 0);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-track"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-5xl font-extrabold tracking-tight">
          {value}
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          из {max} {unit}
        </span>
        <span className="text-xs text-primary font-medium mt-2">
          {left} {unit} осталось
        </span>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
};

export default ProgressRing;
