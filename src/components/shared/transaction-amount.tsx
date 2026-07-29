import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";

type TransactionAmountProps = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  className?: string;
};

export function TransactionAmount({
  type,
  amount,
  className,
}: TransactionAmountProps) {
  const isIncome = type === "INCOME";
  const Icon = isIncome ? ArrowUpRight : ArrowDownLeft;

  return (
    <span
      className={cn(
        "inline-flex w-full items-center justify-end gap-1.5 tabular-nums font-medium",
        isIncome
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-destructive",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{isIncome ? "Entrada" : "Saída"}</span>
      {formatCurrency(amount)}
    </span>
  );
}
