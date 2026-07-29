import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import type { TransactionType } from "@/types/models";

type TransactionAmountProps = {
  type: TransactionType;
  amount: number;
  className?: string;
};

export function TransactionAmount({
  type,
  amount,
  className,
}: TransactionAmountProps) {
  const isIncome = type === "INCOME";
  const isTransfer = type === "TRANSFER";
  const Icon = isTransfer
    ? ArrowLeftRight
    : isIncome
      ? ArrowUpRight
      : ArrowDownLeft;

  return (
    <span
      className={cn(
        "inline-flex w-full items-center justify-end gap-1.5 tabular-nums font-medium",
        isTransfer
          ? "text-muted-foreground"
          : isIncome
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">
        {isTransfer ? "Transferência" : isIncome ? "Entrada" : "Saída"}
      </span>
      {formatCurrency(amount)}
    </span>
  );
}
