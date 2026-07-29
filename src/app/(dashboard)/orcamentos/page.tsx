"use client";

import { AlertTriangle, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatProgress } from "@/components/shared/stat-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BudgetForm,
  type BudgetFormValues,
} from "@/features/budgets/components/budget-form";
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "@/hooks/use-budgets";
import { MONTH_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Budget } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { getCurrentMonthYear } from "@/utils/date";

function budgetLabel(budget: Budget) {
  return budget.title?.trim() || budget.category.name;
}

function BudgetsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = getCurrentMonthYear();
  const [month, setMonth] = React.useState<number | undefined>(undefined);
  const [year, setYear] = React.useState<number | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Budget | null>(null);
  const [deleting, setDeleting] = React.useState<Budget | null>(null);

  const { data: budgets = [], isLoading } = useBudgets(month, year);
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const years = Array.from({ length: 5 }, (_, i) => current.year - 2 + i);

  React.useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/orcamentos");
    }
  }, [searchParams, router]);

  async function handleSubmit(values: BudgetFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setMonth(values.month);
    setYear(values.year);
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        description="Limites mensais por categoria, com título e controle por unidade"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Novo orçamento
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={month ? String(month) : "all"}
          onValueChange={(value) =>
            setMonth(value === "all" ? undefined : Number(value))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {MONTH_LABELS.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={year ? String(year) : "all"}
          onValueChange={(value) =>
            setYear(value === "all" ? undefined : Number(value))
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : budgets.length === 0 ? (
        <EmptyState
          title="Nenhum orçamento encontrado"
          description="Defina um limite para acompanhar seus gastos."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Novo orçamento
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const exceeded = budget.percent >= 100;
            const warning = !exceeded && budget.percent >= budget.alertAt;
            const hasUnits = budget.unitCost != null && budget.unitCost > 0;
            return (
              <Card
                key={budget.id}
                className={cn(
                  exceeded && "border-destructive/40",
                  warning && "border-amber-500/40",
                )}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: budget.category.color }}
                      />
                      {budgetLabel(budget)}
                    </CardTitle>
                    <CardDescription>
                      {budget.title?.trim()
                        ? `${budget.category.name} · `
                        : null}
                      Limite {formatCurrency(budget.limitAmount)} · Alerta em{" "}
                      {budget.alertAt}%
                    </CardDescription>
                    {budget.description ? (
                      <p className="pt-1 text-sm text-muted-foreground">
                        {budget.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {exceeded || warning ? (
                      <Badge
                        variant={exceeded ? "destructive" : "secondary"}
                        className="gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {exceeded ? "Excedido" : "Alerta"}
                      </Badge>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(budget);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(budget)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatProgress
                    label="Utilização"
                    current={budget.spent}
                    target={budget.limitAmount}
                  />
                  {hasUnits ? (
                    <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <p>
                        ~{budget.estimatedQuantity?.toLocaleString("pt-BR")} un.
                        × {formatCurrency(budget.unitCost!)} ={" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(budget.spent)}
                        </span>
                        {budget.quantityLimit != null ? (
                          <>
                            {" "}
                            · limite {budget.quantityLimit} un.
                          </>
                        ) : null}
                      </p>
                      {budget.potentialSavings != null &&
                      budget.potentialSavings > 0 ? (
                        <p className="mt-1 text-amber-700 dark:text-amber-400">
                          Economia se respeitar o limite:{" "}
                          {formatCurrency(budget.potentialSavings)}
                        </p>
                      ) : budget.quantityRemaining != null &&
                        budget.quantityRemaining > 0 ? (
                        <p className="mt-1">
                          Ainda cabem ~{budget.quantityRemaining.toLocaleString("pt-BR")}{" "}
                          un. ({formatCurrency(budget.remaining)})
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Restante:{" "}
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          budget.remaining < 0
                            ? "text-destructive"
                            : "text-foreground",
                        )}
                      >
                        {formatCurrency(budget.remaining)}
                      </span>
                    </span>
                    <span>
                      {MONTH_LABELS[budget.month - 1]} / {budget.year}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar orçamento" : "Novo orçamento"}
            </DialogTitle>
          </DialogHeader>
          <BudgetForm
            key={editing?.id ?? `new-${month}-${year}`}
            budget={
              editing ??
              ({
                month,
                year,
                alertAt: 80,
                limitAmount: 0,
                categoryId: "",
                title: null,
                description: null,
                unitCost: null,
                quantityLimit: null,
              } as Budget)
            }
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir orçamento?"
        description="O histórico de gastos permanece nas transações."
        confirmLabel="Excluir"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton variant="list" rows={4} />}>
      <BudgetsPageContent />
    </React.Suspense>
  );
}
