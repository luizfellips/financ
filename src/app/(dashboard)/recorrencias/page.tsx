"use client";

import {
  Check,
  CheckCheck,
  Eye,
  Repeat,
  X,
} from "lucide-react";
import * as React from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import {
  MonthYearPicker,
  type MonthYearValue,
} from "@/components/shared/month-year-picker";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useApproveRecurringProposals,
  useRecurringProposals,
  useRejectRecurringProposals,
} from "@/hooks/use-recurring";
import {
  PAYMENT_METHOD_LABELS,
  RECURRENCE_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/labels";
import type { RecurringProposal } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { formatDate, getCurrentMonthYear } from "@/utils/date";
import { cn } from "@/lib/utils";

function nextMonthValue(): MonthYearValue {
  const { month, year } = getCurrentMonthYear();
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

function ProposalPreview({ proposal }: { proposal: RecurringProposal }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Título</dt>
        <dd className="font-medium">{proposal.title}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Tipo</dt>
        <dd>{TRANSACTION_TYPE_LABELS[proposal.type]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Valor</dt>
        <dd
          className={cn(
            "font-medium tabular-nums",
            proposal.type === "EXPENSE" ? "text-destructive" : "text-emerald-600",
          )}
        >
          {proposal.type === "EXPENSE" ? "−" : "+"}
          {formatCurrency(proposal.amount)}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Data proposta</dt>
        <dd>{formatDate(proposal.proposedDate)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Conta</dt>
        <dd>{proposal.account.name}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Categoria</dt>
        <dd>{proposal.category.name}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Recorrência</dt>
        <dd>{RECURRENCE_LABELS[proposal.recurrence]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Pagamento</dt>
        <dd>{PAYMENT_METHOD_LABELS[proposal.paymentMethod]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Última ocorrência</dt>
        <dd>{formatDate(proposal.lastOccurrenceDate)}</dd>
      </div>
      {proposal.notes ? (
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Observações</dt>
          <dd className="whitespace-pre-wrap">{proposal.notes}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export default function RecorrenciasPage() {
  const [period, setPeriod] = React.useState<MonthYearValue>(nextMonthValue);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [preview, setPreview] = React.useState<RecurringProposal | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<
    "approve" | "reject" | null
  >(null);

  const { data, isLoading } = useRecurringProposals(period.month, period.year);
  const approveMutation = useApproveRecurringProposals();
  const rejectMutation = useRejectRecurringProposals();

  const proposals = data?.proposals ?? [];

  React.useEffect(() => {
    setSelected(new Set());
    setPreview(null);
  }, [period.month, period.year]);

  const allSelected =
    proposals.length > 0 && proposals.every((p) => selected.has(p.id));
  const selectedIds = React.useMemo(() => [...selected], [selected]);
  const selectedCount = selectedIds.length;
  const busy = approveMutation.isPending || rejectMutation.isPending;

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(proposals.map((p) => p.id)));
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function runConfirm() {
    if (!confirmAction || selectedCount === 0) return;
    if (confirmAction === "approve") {
      await approveMutation.mutateAsync(selectedIds);
    } else {
      await rejectMutation.mutateAsync(selectedIds);
    }
    setConfirmAction(null);
    setSelected(new Set());
    setPreview(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recorrências"
        description="Revise, aprove ou rejeite a criação dos próximos lançamentos recorrentes."
        actions={
          <MonthYearPicker
            value={period}
            onChange={setPeriod}
            yearsAfter={2}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Propostas</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data?.summary.total ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receitas / Despesas</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data?.summary.income ?? 0}
              <span className="mx-1 text-muted-foreground">/</span>
              {data?.summary.expense ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Impacto líquido</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl tabular-nums",
                (data?.summary.totalAmount ?? 0) < 0
                  ? "text-destructive"
                  : "text-emerald-600",
              )}
            >
              {formatCurrency(data?.summary.totalAmount ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Painel de materialização</CardTitle>
            <CardDescription>
              Selecione as propostas do período e aprove para criar os
              lançamentos, ou rejeite para ocultá-las.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedCount === 0 || busy}
              onClick={() => setConfirmAction("reject")}
            >
              <X className="mr-1.5 h-4 w-4" />
              Rejeitar
              {selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
            <Button
              size="sm"
              disabled={selectedCount === 0 || busy}
              onClick={() => setConfirmAction("approve")}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Aprovar
              {selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton variant="list" rows={5} />
          ) : proposals.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="Nenhuma proposta neste período"
              description="Quando houver recorrências com próxima ocorrência neste mês, elas aparecerão aqui para revisão."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  aria-label="Selecionar todas"
                />
                <p className="text-sm text-muted-foreground">
                  {selectedCount} de {proposals.length} selecionada
                  {proposals.length === 1 ? "" : "s"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => toggleAll(!allSelected)}
                >
                  <CheckCheck className="mr-1.5 h-4 w-4" />
                  {allSelected ? "Limpar" : "Selecionar todas"}
                </Button>
              </div>

              <ul className="divide-y divide-border">
                {proposals.map((proposal) => {
                  const checked = selected.has(proposal.id);
                  return (
                    <li
                      key={proposal.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Checkbox
                          className="mt-1"
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleOne(proposal.id, value === true)
                          }
                          aria-label={`Selecionar ${proposal.title}`}
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium">
                              {proposal.title}
                            </p>
                            <Badge variant="outline">
                              {TRANSACTION_TYPE_LABELS[proposal.type]}
                            </Badge>
                            <Badge variant="secondary">
                              {RECURRENCE_LABELS[proposal.recurrence]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(proposal.proposedDate)} ·{" "}
                            {proposal.category.name} · {proposal.account.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <p
                          className={cn(
                            "tabular-nums font-medium",
                            proposal.type === "EXPENSE"
                              ? "text-destructive"
                              : "text-emerald-600",
                          )}
                        >
                          {proposal.type === "EXPENSE" ? "−" : "+"}
                          {formatCurrency(proposal.amount)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreview(proposal)}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          Prévia
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Prévia do lançamento</DialogTitle>
            <DialogDescription>
              Assim ficará a transação se você aprovar esta proposta.
            </DialogDescription>
          </DialogHeader>
          {preview ? <ProposalPreview proposal={preview} /> : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={!preview || busy}
              onClick={() => {
                if (!preview) return;
                setSelected(new Set([preview.id]));
                setPreview(null);
                setConfirmAction("reject");
              }}
            >
              Rejeitar
            </Button>
            <Button
              disabled={!preview || busy}
              onClick={() => {
                if (!preview) return;
                setSelected(new Set([preview.id]));
                setPreview(null);
                setConfirmAction("approve");
              }}
            >
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={
          confirmAction === "approve"
            ? "Aprovar propostas?"
            : "Rejeitar propostas?"
        }
        description={
          confirmAction === "approve"
            ? `${selectedCount} lançamento${selectedCount === 1 ? "" : "s"} será${selectedCount === 1 ? "" : "ão"} criado${selectedCount === 1 ? "" : "s"} e passará${selectedCount === 1 ? "" : "ão"} a afetar saldos e relatórios.`
            : `${selectedCount} proposta${selectedCount === 1 ? "" : "s"} será${selectedCount === 1 ? "" : "ão"} ocultada${selectedCount === 1 ? "" : "s"} neste período. Você pode gerar de novo criando a recorrência manualmente.`
        }
        confirmLabel={confirmAction === "approve" ? "Aprovar" : "Rejeitar"}
        variant={confirmAction === "reject" ? "destructive" : "default"}
        loading={busy}
        onConfirm={() => void runConfirm()}
      />
    </div>
  );
}
