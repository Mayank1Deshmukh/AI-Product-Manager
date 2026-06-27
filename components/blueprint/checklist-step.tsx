import { Check } from "lucide-react";

interface ChecklistStepProps {
  step: number;
  label: string;
  description: string;
  status: "done" | "active" | "pending";
}

export function ChecklistStep({ step, label, description, status }: ChecklistStepProps) {
  return (
    <div className="flex items-start gap-4">
      {/* Dot */}
      <div className="relative shrink-0 mt-0.5">
        {/* Pulsing ring — only visible when active */}
        {status === "active" && (
          <div
            className="absolute inset-0 rounded-full border-2 border-primary"
            style={{ animation: "blueprint-ring-pulse 1.2s ease-out infinite" }}
          />
        )}

        {/* Dot body — key change triggers scale-in animation on state transition */}
        <div
          key={status}
          className={[
            "relative z-10 h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium animate-in zoom-in-95 duration-150",
            status === "done" && "bg-green-500/20 text-green-600",
            status === "active" && "bg-primary/10 text-primary",
            status === "pending" && "border border-border text-muted-foreground bg-background",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {status === "done" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <span>{step}</span>
          )}
        </div>
      </div>

      {/* Text */}
      <div className="pt-0.5">
        <p
          className={[
            "text-[13px] font-semibold leading-tight",
            status === "pending" ? "text-muted-foreground" : "text-foreground",
          ].join(" ")}
        >
          {label}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
