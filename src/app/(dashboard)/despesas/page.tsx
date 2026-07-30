"use client";

import { ArrowLeftRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { MobileFab } from "@/components/shared/mobile-fab";
import { PageHeader } from "@/components/shared/page-header";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionFiltersBar } from "@/features/transactions/components/transaction-filters";
import {
  TransactionForm,
  type TransactionFormValues,
} from "@/features/transactions/components/transaction-form";
import { TransactionMobileCard } from "@/features/transactions/components/transaction-mobile-card";
import {
  TransferForm,
  type TransferFormValues,
} from "@/features/transactions/components/transfer-form";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  useCreateExpense,
  useDeleteTransaction,
  useExpenses,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import type { Transaction, TransactionFilters } from "@/types/models";
import { formatDate } from "@/utils/date";

function ExpensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [filters, setFilters] = React.useState<TransactionFilters>({
    page: 1,
    pageSize: 20,
    sortBy: "date",
    sortOrder: "desc",
    type: "EXPENSE",
    recurring: "all",
    search: "",
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [deleting, setDeleting] = React.useState<Transaction | null>(null);

  const { data, isLoading } = useExpenses(filters);
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  React.useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/despesas");
    }
  }, [searchParams, router]);

  function openEdit(row: Transaction) {
    setEditing(row);
    setDialogOpen(true);
  }

  function openConvert(row: Transaction) {
    setEditing(row);
    setTransferOpen(true);
  }

  const columns: DataTableColumn<Transaction>[] = [
    {
      id: "date",
      header: "Data",
      cell: (row) => formatDate(row.date),
    },
    {
      id: "title",
      header: "Título",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          {row.installmentTotal ? (
            <Badge variant="outline" className="mt-1 text-[10px]">
              Parcela {row.installmentNumber}/{row.installmentTotal}
            </Badge>
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
      id: "payment",
      header: "Pagamento",
      cell: (row) => PAYMENT_METHOD_LABELS[row.paymentMethod],
    },
    {
      id: "amount",
      header: "Valor",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => <TransactionAmount type="EXPENSE" amount={row.amount} />,
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
            <DropdownMenuItem onClick={() => openEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openConvert(row)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Converter em transferência
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
    const { type: _ignoredType, ...rest } = values;
    void _ignoredType;
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(rest);
    }
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleConvertSubmit(values: TransferFormValues) {
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing.id, ...values });
    setTransferOpen(false);
    setEditing(null);
  }

  const items = data?.data ?? [];
  const meta = data?.meta;

  const pagination =
    meta && meta.totalPages > 1 ? (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {meta.page} de {meta.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() =>
              setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
            }
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() =>
              setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
            }
          >
            Próxima
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        description="Gastos com método de pagamento e parcelas"
        actions={
          <Button
            className="hidden md:inline-flex"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova despesa
          </Button>
        }
      />

      <TransactionFiltersBar
        value={filters}
        onChange={setFilters}
        showTypeFilter={false}
      />

      {isLoading ? (
        <LoadingSkeleton variant={isMobile ? "list" : "table"} rows={8} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhuma despesa encontrada"
          description="Registre compras, contas e outros gastos."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova despesa
            </Button>
          }
        />
      ) : isMobile ? (
        <>
          <div className="flex flex-col gap-2">
            {items.map((row) => (
              <TransactionMobileCard
                key={row.id}
                transaction={row}
                showTypeBadge={false}
                onEdit={openEdit}
                onDelete={setDeleting}
                onConvertToTransfer={openConvert}
              />
            ))}
          </div>
          {pagination}
        </>
      ) : (
        <>
          <DataTable columns={columns} data={items} getRowId={(r) => r.id} />
          {pagination}
        </>
      )}

      <MobileFab
        label="Nova despesa"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />

      <ResponsiveOverlay
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar despesa" : "Nova despesa"}
        desktopClassName="sm:max-w-3xl"
      >
        <TransactionForm
          key={editing?.id ?? "new"}
          lockedType="EXPENSE"
          showInstallments
          transaction={editing}
          onCancel={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={transferOpen}
        onOpenChange={(open) => {
          setTransferOpen(open);
          if (!open) setEditing(null);
        }}
        title="Converter em transferência"
        desktopClassName="sm:max-w-lg"
      >
        <TransferForm
          key={editing?.id ?? "convert-expense"}
          transaction={editing}
          onCancel={() => {
            setTransferOpen(false);
            setEditing(null);
          }}
          onSubmit={handleConvertSubmit}
          submitLabel="Converter"
        />
      </ResponsiveOverlay>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir despesa?"
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

export default function ExpensesPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton variant="table" rows={8} />}>
      <ExpensesPageContent />
    </React.Suspense>
  );
}
