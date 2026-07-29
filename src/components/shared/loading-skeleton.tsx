import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  variant?: "card" | "table" | "list" | "kpi";
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = "card",
  rows = 3,
  className,
}: LoadingSkeletonProps) {
  if (variant === "kpi") {
    return (
      <div
        className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
      >
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-border p-6"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-4 rounded-xl border border-border p-6", className)}
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
