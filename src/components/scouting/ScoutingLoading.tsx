import { cn } from "@/lib/utils";

interface ScoutingLoadingProps {
  message?: string;
  className?: string;
  variant?: "page" | "section" | "inline";
}

export function ScoutingLoading({
  message,
  className,
  variant = "section",
}: ScoutingLoadingProps) {
  const inner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        variant === "section" && "py-16",
        variant === "inline" && "py-8",
        variant === "page" && "min-h-screen",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-[2.5px] border-primary/15" />
        <div className="absolute inset-0 h-9 w-9 animate-spin rounded-full border-[2.5px] border-transparent border-t-primary" />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );

  if (variant === "page") {
    return <div className="min-h-screen bg-background">{inner}</div>;
  }

  return inner;
}
