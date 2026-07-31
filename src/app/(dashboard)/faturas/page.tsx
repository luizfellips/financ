"use client";

import { CreditCard, Loader2, Pencil } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { MobileFab } from "@/components/shared/mobile-fab";
import { MoneyInput } from "@/components/shared/money-input";
import {
  MonthYearPicker,
  type MonthYearValue,
} from "@/components/shared/month-year-picker";
import { PageHeader } from "@/components/shared/page-header";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import {
  useInvoiceDetail,
  usePayInvoice,
  useUpdateInvoiceOpening,
} from "@/hooks/use-invoices";
import { MONTH_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatDate, getCurrentMonthYear } from "@/utils/date";

function FaturasPageContent() {
  const searchParams = useSearchParams();
  const [period, setPeriod] = React.useState<MonthYearValue>(getCurrentMonthYear);
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts(
    period.month,
    period.year,
  );
  const creditAccounts = accounts.filter((a) => a.type === "CREDIT");

  const [accountId, setAccountId] = React.useState<string>("");
  const [openingOpen, setOpeningOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [openingAmount, setOpeningAmount] = React.useState(0);
  const [payAmount, setPayAmount] = React.useState(0);
  const [fromAccountId, setFromAccountId] = React.useState("");
  const [payTitle, setPayTitle] = React.useState("");

  React.useEffect(() => {
    const fromQuery = searchParams.get("conta");
    if (fromQuery && creditAccounts.some((a) => a.id === fromQuery)) {
      setAccountId(fromQuery);
      return;
    }
    if (!accountId && creditAccounts.length > 0) {
      setAccountId(creditAccounts[0]!.id);
    }
  }, [searchParams, creditAccounts, accountId]);

  const { data: invoice, isLoading: loadingInvoice } = useInvoiceDetail(
    accountId || null,
    period.month,
    period.year,
  );
  const updateOpening = useUpdateInvoiceOpening();
  const payInvoice = usePayInvoice();

  const sourceAccounts = accounts.filter(
    (a) => a.type !== "CREDIT" && a.id !== accountId,
  );

  React.useEffect(() => {
    if (invoice) {
      setOpeningAmount(invoice.openingAmount);
      setPayAmount(invoice.total > 0 ? invoice.total : 0);
    }
  }, [invoice]);

  React.useEffect(() => {
    if (!fromAccountId && sourceAccounts.length > 0) {
      const preferred =
        sourceAccounts.find((a) => a.isDefault) ?? sourceAccounts[0];
      if (preferred) setFromAccountId(preferred.id);
    }
  }, [sourceAccounts, fromAccountId]);

  const monthLabel = MONTH_LABELS[period.month - 1] ?? "";

  if (loadingAccounts) {
    return (
      <div className="space-y-6">
        <PageHeader title="Faturas" description="Faturas de cartão de crédito" />
        <LoadingSkeleton variant="list" rows={4} />
      </div>
    );
  }

  if (creditAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Faturas" description="Faturas de cartão de crédito" />
        <EmptyState
          icon={CreditCard}
          title="Nenhuma conta de crédito"
          description="Cadastre uma conta do tipo Crédito para acompanhar a fatura mensal."
          action={
            <Button asChild>
              <a href="/contas?nova=1">Nova conta</a>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturas"
        description={`Compras e pagamentos de ${monthLabel}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cartão" />
              </SelectTrigger>
              <SelectContent>
                {creditAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <MonthYearPicker value={period} onChange={setPeriod} />
            <Button
              className="hidden md:inline-flex"
              disabled={!invoice || invoice.total <= 0}
              onClick={() => setPayOpen(true)}
            >
              Pagar fatura
            </Button>
          </div>
        }
      />

      {loadingInvoice || !invoice ? (
        <LoadingSkeleton variant="list" rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardDescription>Valor inicial</CardDescription>
                <CardTitle className="flex items-center justify-between gap-2 text-xl tabular-nums">
                  {formatCurrency(invoice.openingAmount)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label="Editar valor inicial"
                    onClick={() => setOpeningOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardDescription>Compras</CardDescription>
                <CardTitle className="text-xl tabular-nums text-destructive">
                  {formatCurrency(invoice.expenses)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardDescription>Pagamentos</CardDescription>
                <CardTitle className="text-xl tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(invoice.payments)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardDescription>Total da fatura</CardDescription>
                <CardTitle
                  className={cn(
                    "text-xl tabular-nums",
                    invoice.total > 0 && "text-destructive",
                  )}
                >
                  {formatCurrency(invoice.total)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Saldo da conta:{" "}
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      invoice.balance < 0 && "text-destructive",
                    )}
                  >
                    {formatCurrency(invoice.balance)}
                  </span>
                </p>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Compras do mês</CardTitle>
                <CardDescription>
                  Despesas lançadas nesta conta de crédito
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {invoice.expensesList.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma compra neste mês
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {invoice.expensesList.map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-start justify-between gap-2 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {tx.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDate(tx.date)}
                            {tx.category?.name ? ` · ${tx.category.name}` : ""}
                          </p>
                        </div>
                        <TransactionAmount
                          type="EXPENSE"
                          amount={tx.amount}
                          className="w-auto shrink-0 text-sm"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Pagamentos</CardTitle>
                <CardDescription>
                  Transferências recebidas neste cartão
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {invoice.paymentsList.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum pagamento neste mês
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {invoice.paymentsList.map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-start justify-between gap-2 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {tx.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDate(tx.date)}
                            {tx.account?.name
                              ? ` · de ${tx.account.name}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tx.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <MobileFab
        label="Pagar fatura"
        onClick={() => setPayOpen(true)}
        className={invoice && invoice.total <= 0 ? "opacity-50" : undefined}
      />

      <ResponsiveOverlay
        open={openingOpen}
        onOpenChange={setOpeningOpen}
        title="Valor inicial da fatura"
        description="Dívida já existente neste mês (antes das compras lançadas)."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor inicial</Label>
            <MoneyInput value={openingAmount} onValueChange={setOpeningAmount} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpeningOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={updateOpening.isPending}
              onClick={async () => {
                if (!accountId) return;
                await updateOpening.mutateAsync({
                  accountId,
                  openingAmount,
                  month: period.month,
                  year: period.year,
                });
                setOpeningOpen(false);
              }}
            >
              {updateOpening.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={payOpen}
        onOpenChange={setPayOpen}
        title="Pagar fatura"
        description={`Pagamento via transferência para ${invoice?.accountName ?? "o cartão"}`}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Conta de origem</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {sourceAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <MoneyInput value={payAmount} onValueChange={setPayAmount} />
          </div>
          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input
              value={payTitle}
              onChange={(e) => setPayTitle(e.target.value)}
              placeholder={`Pagamento fatura ${period.month}/${period.year}`}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                payInvoice.isPending ||
                !fromAccountId ||
                payAmount <= 0 ||
                sourceAccounts.length === 0
              }
              onClick={async () => {
                if (!accountId || !fromAccountId) return;
                await payInvoice.mutateAsync({
                  accountId,
                  fromAccountId,
                  amount: payAmount,
                  title: payTitle || undefined,
                  month: period.month,
                  year: period.year,
                });
                setPayOpen(false);
                setPayTitle("");
              }}
            >
              {payInvoice.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar pagamento
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}

export default function FaturasPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton variant="list" rows={5} />}>
      <FaturasPageContent />
    </React.Suspense>
  );
}
