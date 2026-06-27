import { cn } from "@/lib/utils";

interface TagPillProps {
  label: string;
  variant?: "default" | "green" | "amber";
  className?: string;
}

export function TagPill({ label, variant = "default", className }: TagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border",
        variant === "default" && "bg-blue-50 text-blue-700 border-blue-200",
        variant === "green" && "bg-green-50 text-green-700 border-green-200",
        variant === "amber" && "bg-amber-50 text-amber-700 border-amber-200",
        className
      )}
    >
      {label}
    </span>
  );
}
