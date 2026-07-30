"use client";

import {
  ArrowLeftRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { TransactionAmount } from "@/components/shared/transaction-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/models";
import { formatDate } from "@/utils/date";

type TransactionMobileCardProps = {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onConvertToTransfer?: (transaction: Transaction) => void;
  showTypeBadge?: boolean;
  className?: string;
};

export function TransactionMobileCard({
  transaction,
  onEdit,
  onDelete,
  onConvertToTransfer,
  showTypeBadge = true,
  className,
}: TransactionMobileCardProps) {
  const subtitle =
    transaction.type === "TRANSFER" &&
    transaction.account &&
    transaction.transferToAccount
      ? `${transaction.account.name} → ${transaction.transferToAccount.name}`
      : [
          transaction.category?.name,
          transaction.account?.name,
        ]
          .filter(Boolean)
          .join(" · ") || formatDate(transaction.date);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-sm active:bg-muted/40",
        className,
      )}
    >
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onEdit(transaction)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {transaction.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {formatDate(transaction.date)}
              </span>
              {showTypeBadge ? (
                <Badge
                  variant={
                    transaction.type === "INCOME"
                      ? "default"
                      : transaction.type === "TRANSFER"
                        ? "outline"
                        : "secondary"
                  }
                  className="h-5 px-1.5 text-[10px]"
                >
                  {TRANSACTION_TYPE_LABELS[transaction.type]}
                </Badge>
              ) : null}
            </div>
          </div>
          <TransactionAmount
            type={transaction.type}
            amount={transaction.amount}
            className="w-auto shrink-0 justify-end text-sm"
          />
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            aria-label="Ações"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(transaction)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          {onConvertToTransfer && transaction.type !== "TRANSFER" ? (
            <DropdownMenuItem
              onClick={() => onConvertToTransfer(transaction)}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Converter em transferência
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(transaction)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
