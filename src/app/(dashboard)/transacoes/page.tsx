"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  TransactionFiltersBar,
} from "@/features/transactions/components/transaction-filters";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/features/transactions/components/transaction-form";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import type { Transaction, TransactionFilters } from "@/types/models";
import { formatDate } from "@/utils/date";

function TransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = React.useState<TransactionFilters>({
    page: 1,
    pageSize: 20,
    sortBy: "date",
    sortOrder: "desc",
    type: "ALL",
    recurring: "all",
    search: "",
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [deleting, setDeleting] = React.useState<Transaction | null>(null);

  const { data, isLoading } = useTransactions(filters);
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  React.useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/transacoes");
    }
  }, [searchParams, router]);

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: "date",
      header: "Data",
      cell: (row) => formatDate(row.date),
      className: "whitespace-nowrap",
    },
    {
      id: "title",
      header: "Título",
      cell: (row) => (
        <div className="min-w-[140px]">
          <p className="font-medium">{row.title}</p>
          {row.notes ? (
            <p className="truncate text-xs text-muted-foreground">{row.notes}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoria",
      cell: (row) => row.category?.name ?? "—",
    },
    {
      id: "type",
      header: "Tipo",
      cell: (row) => (
        <Badge variant={row.type === "INCOME" ? "default" : "secondary"}>
          {row.type === "INCOME" ? "Receita" : "Despesa"}
        </Badge>
      ),
    },
    {
      id: "payment",
      header: "Pagamento",
      cell: (row) => PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod,
    },
    {
      id: "amount",
      header: "Valor",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <TransactionAmount type={row.type} amount={row.amount} />
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditing(row);
                setDialogOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  async function handleSubmit(values: TransactionFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    setEditing(null);
  }

  const meta = data?.meta;
  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações"
        description="Todas as suas movimentações financeiras"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova transação
          </Button>
        }
      />

      <TransactionFiltersBar value={filters} onChange={setFilters} />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhuma transação encontrada"
          description="Ajuste os filtros ou registre uma nova movimentação."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nova transação
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            getRowId={(row) => row.id}
          />
          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages} · {meta.total} registro(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.max(1, (prev.page ?? 1) - 1),
                    }))
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: (prev.page ?? 1) + 1,
                    }))
                  }
                >
                  Próxima
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar transação" : "Nova transação"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            key={editing?.id ?? "new"}
            transaction={editing}
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
        title="Excluir transação?"
        description="Esta ação não pode ser desfeita."
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

export default function TransactionsPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton variant="table" rows={8} />}>
      <TransactionsPageContent />
    </React.Suspense>
  );
}
