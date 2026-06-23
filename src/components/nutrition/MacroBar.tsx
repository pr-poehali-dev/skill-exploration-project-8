interface MacroBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}

const MacroBar = ({ label, value, max, color, unit = 'г' }: MacroBarProps) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{value}</span> / {max} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default MacroBar;
