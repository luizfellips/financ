"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { clampPercent, formatCurrency } from "@/utils/currency";

export interface StatProgressProps {
  label: string;
  current: number;
  target: number;
  format?: "currency" | "number" | "percent";
  locale?: string;
  currency?: string;
  className?: string;
  showValues?: boolean;
}

function formatValue(
  value: number,
  format: "currency" | "number" | "percent",
  locale: string,
  currency: string,
): string {
  if (format === "currency") {
    return formatCurrency(value, locale, currency);
  }
  if (format === "percent") {
    return `${value.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
  }
  return value.toLocaleString(locale);
}

export function StatProgress({
  label,
  current,
  target,
  format = "currency",
  locale = "pt-BR",
  currency = "BRL",
  className,
  showValues = true,
}: StatProgressProps) {
  const percent =
    target > 0 ? clampPercent((current / target) * 100) : current > 0 ? 100 : 0;
  const overBudget = target > 0 && current > target;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-foreground">
          {label}
        </span>
        {showValues ? (
          <span
            className={cn(
              "shrink-0 tabular-nums text-muted-foreground",
              overBudget && "text-destructive",
            )}
          >
            {formatValue(current, format, locale, currency)}
            {target > 0
              ? ` / ${formatValue(target, format, locale, currency)}`
              : null}
          </span>
        ) : null}
      </div>
      <Progress
        value={percent}
        indicatorClassName={overBudget ? "bg-destructive" : undefined}
        aria-label={`${label}: ${percent.toFixed(0)}%`}
      />
      <p
        className={cn(
          "text-xs tabular-nums text-muted-foreground",
          overBudget && "text-destructive",
        )}
      >
        {percent.toLocaleString(locale, { maximumFractionDigits: 0 })}%
        {overBudget ? " acima da meta" : " da meta"}
      </p>
    </div>
  );
}
