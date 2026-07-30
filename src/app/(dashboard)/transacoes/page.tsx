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
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import type { Transaction, TransactionFilters } from "@/types/models";
import { formatDate } from "@/utils/date";

function TransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

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
  const [transferOpen, setTransferOpen] = React.useState(false);
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
    if (searchParams.get("transferir") === "1") {
      setEditing(null);
      setTransferOpen(true);
      router.replace("/transacoes");
    }
  }, [searchParams, router]);

  function openEdit(row: Transaction) {
    setEditing(row);
    if (row.type === "TRANSFER") {
      setTransferOpen(true);
    } else {
      setDialogOpen(true);
    }
  }

  function openConvert(row: Transaction) {
    setEditing(row);
    setDialogOpen(false);
    setTransferOpen(true);
  }

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
          {row.type === "TRANSFER" && row.account && row.transferToAccount ? (
            <p className="truncate text-xs text-muted-foreground">
              {row.account.name} → {row.transferToAccount.name}
            </p>
          ) : row.notes ? (
            <p className="truncate text-xs text-muted-foreground">{row.notes}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoria",
      cell: (row) =>
        row.type === "TRANSFER" ? "—" : (row.category?.name ?? "—"),
    },
    {
      id: "type",
      header: "Tipo",
      cell: (row) => (
        <Badge
          variant={
            row.type === "INCOME"
              ? "default"
              : row.type === "TRANSFER"
                ? "outline"
                : "secondary"
          }
        >
          {TRANSACTION_TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      id: "payment",
      header: "Pagamento",
      cell: (row) =>
        PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod,
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
            <DropdownMenuItem onClick={() => openEdit(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {row.type !== "TRANSFER" ? (
              <DropdownMenuItem onClick={() => openConvert(row)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Converter em transferência
              </DropdownMenuItem>
            ) : null}
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

  const converting =
    editing != null &&
    (editing.type === "INCOME" || editing.type === "EXPENSE");

  async function handleTransferSubmit(values: TransferFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setTransferOpen(false);
    setEditing(null);
  }

  const meta = data?.meta;
  const items = data?.data ?? [];

  const pagination =
    meta && meta.totalPages > 1 ? (
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
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações"
        description="Receitas, despesas e transferências entre contas"
        actions={
          <div className="hidden flex-wrap gap-2 md:flex">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setTransferOpen(true);
              }}
            >
              <ArrowLeftRight className="mr-1.5 h-4 w-4" />
              Transferir
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nova transação
            </Button>
          </div>
        }
      />

      <TransactionFiltersBar value={filters} onChange={setFilters} />

      {isLoading ? (
        <LoadingSkeleton variant={isMobile ? "list" : "table"} rows={8} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhuma transação encontrada"
          description="Ajuste os filtros ou registre uma nova movimentação."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setTransferOpen(true);
                }}
              >
                <ArrowLeftRight className="mr-1.5 h-4 w-4" />
                Transferir
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Nova transação
              </Button>
            </div>
          }
        />
      ) : isMobile ? (
        <>
          <div className="flex flex-col gap-2">
            {items.map((row) => (
              <TransactionMobileCard
                key={row.id}
                transaction={row}
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
          <DataTable
            columns={columns}
            data={items}
            getRowId={(row) => row.id}
          />
          {pagination}
        </>
      )}

      <MobileFab
        label="Nova movimentação"
        actions={[
          {
            label: "Nova transação",
            icon: <Plus className="h-4 w-4" />,
            onSelect: () => {
              setEditing(null);
              setDialogOpen(true);
            },
          },
          {
            label: "Transferir",
            icon: <ArrowLeftRight className="h-4 w-4" />,
            onSelect: () => {
              setEditing(null);
              setTransferOpen(true);
            },
          },
        ]}
      />

      <ResponsiveOverlay
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        title={editing ? "Editar transação" : "Nova transação"}
        desktopClassName="sm:max-w-3xl"
      >
        <TransactionForm
          key={editing?.id ?? "new"}
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
        title={
          converting
            ? "Converter em transferência"
            : editing
              ? "Editar transferência"
              : "Transferir entre contas"
        }
        desktopClassName="sm:max-w-lg"
      >
        <TransferForm
          key={editing?.id ?? "new-transfer"}
          transaction={editing}
          onCancel={() => {
            setTransferOpen(false);
            setEditing(null);
          }}
          onSubmit={handleTransferSubmit}
          submitLabel={
            converting ? "Converter" : editing ? "Salvar" : "Transferir"
          }
        />
      </ResponsiveOverlay>

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
