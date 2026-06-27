interface MetricCardProps {
  label: string;
  value: string;
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-lg font-medium text-foreground">{value}</span>
    </div>
  );
}
