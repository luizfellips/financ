"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { MobileFab } from "@/components/shared/mobile-fab";
import {
  MonthYearPicker,
  type MonthYearValue,
} from "@/components/shared/month-year-picker";
import { PageHeader } from "@/components/shared/page-header";
import { StatProgress } from "@/components/shared/stat-progress";
import { TransactionAmount } from "@/components/shared/transaction-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/hooks/use-dashboard";
import { ACCOUNT_TYPE_LABELS, MONTH_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatDate, getCurrentMonthYear } from "@/utils/date";

export default function DashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = React.useState<MonthYearValue>(getCurrentMonthYear);
  const { data, isLoading, isError, refetch, isFetching } = useDashboard(
    period.month,
    period.year,
  );

  const monthLabel = MONTH_LABELS[period.month - 1] ?? "";

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Visão geral das suas finanças"
          actions={<MonthYearPicker value={period} onChange={setPeriod} />}
        />
        <LoadingSkeleton variant="kpi" rows={4} />
        <div className="grid gap-4 lg:grid-cols-2">
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={Wallet}
        title="Não foi possível carregar o dashboard"
        description="Verifique sua conexão e tente novamente."
        action={
          <Button onClick={() => void refetch()}>Tentar novamente</Button>
        }
      />
    );
  }

  const {
    kpis,
    accountBalances = [],
    upcomingBills,
    budgetProgress,
    goalProgress,
    recentTransactions,
  } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Saldos e fluxo até o fim de ${monthLabel}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthYearPicker value={period} onChange={setPeriod} />
            <div className="hidden flex-wrap items-center gap-2 md:flex">
              <Button asChild variant="outline" size="sm">
                <Link href="/receitas?nova=1">
                  <ArrowUpRight className="mr-1.5 h-4 w-4" />
                  Receita
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/transacoes?transferir=1">
                  <ArrowLeftRight className="mr-1.5 h-4 w-4" />
                  Transferir
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/despesas?nova=1">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Despesa
                </Link>
              </Button>
            </div>
          </div>
        }
      />

      <MobileFab
        label="Ações rápidas"
        actions={[
          {
            id: "income",
            label: "Nova receita",
            icon: <ArrowUpRight className="h-4 w-4" />,
            onSelect: () => router.push("/receitas?nova=1"),
          },
          {
            id: "transfer",
            label: "Transferir",
            icon: <ArrowLeftRight className="h-4 w-4" />,
            onSelect: () => router.push("/transacoes?transferir=1"),
          },
          {
            id: "expense",
            label: "Nova despesa",
            icon: <Plus className="h-4 w-4" />,
            onSelect: () => router.push("/despesas?nova=1"),
          },
        ]}
      />

      <motion.div
        className={cn(
          "grid gap-4 sm:grid-cols-2 xl:grid-cols-5",
          isFetching && "opacity-70 transition-opacity",
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <KpiCard
          title="Saldo total"
          value={kpis.balance}
          icon={Wallet}
          description={`Até ${monthLabel}`}
        />
        <KpiCard
          title="Entrou"
          value={kpis.monthlyIncome}
          icon={ArrowUpRight}
          description="Renda real do mês"
        />
        <KpiCard
          title="Gastou"
          value={kpis.monthlyExpense}
          icon={ArrowDownLeft}
          description="Despesas reais do mês"
        />
        <KpiCard
          title="Movimentou"
          value={kpis.monthlyTransfers}
          icon={ArrowLeftRight}
          description="Entre contas"
        />
        <KpiCard
          title="Economia"
          value={kpis.monthlySavings}
          icon={TrendingUp}
          description="Entrou − Gastou"
        />
      </motion.div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">Saldos das contas</CardTitle>
            <CardDescription className="truncate">
              Saldo até o fim de {monthLabel} e variação no mês
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/contas">Gerenciar</Link>
          </Button>
        </CardHeader>
        <CardContent className="min-w-0 px-4 sm:px-6">
          {accountBalances.length === 0 ? (
            <EmptyState
              className="border-0 py-8"
              title="Nenhuma conta"
              description="Cadastre suas contas para acompanhar os saldos."
              action={
                <Button asChild size="sm">
                  <Link href="/contas?nova=1">Nova conta</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {accountBalances.map((account) => {
                const Icon =
                  (LucideIcons as unknown as Record<
                    string,
                    LucideIcons.LucideIcon
                  >)[account.icon] ?? LucideIcons.Wallet;
                const variationPositive = account.monthVariation > 0;
                const variationNegative = account.monthVariation < 0;
                return (
                  <li
                    key={account.id}
                    className="flex items-start justify-between gap-2 py-2.5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${account.color}22`,
                          color: account.color,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {account.name}
                          </p>
                          {account.isDefault ? (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px]"
                            >
                              Padrão
                            </Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {ACCOUNT_TYPE_LABELS[account.type]}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          account.balance < 0 && "text-destructive",
                        )}
                      >
                        {formatCurrency(account.balance)}
                      </p>
                      <p
                        className={cn(
                          "flex items-center justify-end gap-0.5 text-xs tabular-nums",
                          variationPositive &&
                            "text-emerald-600 dark:text-emerald-400",
                          variationNegative && "text-destructive",
                          !variationPositive &&
                            !variationNegative &&
                            "text-muted-foreground",
                        )}
                      >
                        {variationPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : null}
                        {variationNegative ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        {variationPositive ? "+" : ""}
                        {formatCurrency(account.monthVariation)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Orçamentos</CardTitle>
              <CardDescription>Progresso do mês atual</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/orcamentos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            {budgetProgress.length === 0 ? (
              <EmptyState
                className="border-0 py-8"
                title="Nenhum orçamento"
                description="Defina limites por categoria."
                action={
                  <Button asChild size="sm">
                    <Link href="/orcamentos?nova=1">Criar orçamento</Link>
                  </Button>
                }
              />
            ) : (
              budgetProgress.slice(0, 5).map((budget) => (
                <div key={budget.id} className="min-w-0 space-y-1">
                  <StatProgress
                    label={budget.title?.trim() || budget.categoryName}
                    current={budget.spent}
                    target={budget.limitAmount}
                  />
                  {budget.percent >= budget.alertAt ? (
                    <p
                      className={cn(
                        "text-xs",
                        budget.percent >= 100
                          ? "text-destructive"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {budget.percent >= 100
                        ? "Orçamento excedido"
                        : `Alerta: ${budget.percent.toFixed(0)}% utilizado`}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Metas</CardTitle>
              <CardDescription>Progresso das suas metas</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/metas">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            {goalProgress.length === 0 ? (
              <EmptyState
                className="border-0 py-8"
                icon={Target}
                title="Nenhuma meta ativa"
                description="Crie uma meta para acompanhar sua poupança."
                action={
                  <Button asChild size="sm">
                    <Link href="/metas?nova=1">Criar meta</Link>
                  </Button>
                }
              />
            ) : (
              goalProgress.map((goal) => (
                <StatProgress
                  key={goal.id}
                  label={goal.name}
                  current={goal.savedAmount}
                  target={goal.targetAmount}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Próximas contas</CardTitle>
              <CardDescription className="truncate">
                Recorrências nos próximos 30 dias
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 self-start">
              <Link href="/recorrencias">Ver</Link>
            </Button>
          </CardHeader>
          <CardContent className="min-w-0 px-4 sm:px-6">
            {upcomingBills.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma conta recorrente prevista
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingBills.map((bill, index) => (
                  <li
                    key={`${bill.title}-${bill.dueDate}-${index}`}
                    className="flex items-start justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {bill.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {formatDate(bill.dueDate)}
                        {bill.category?.name ? ` · ${bill.category.name}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 pt-0.5 text-sm font-medium tabular-nums text-destructive">
                      {formatCurrency(bill.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Transações recentes</CardTitle>
              <CardDescription>Últimos lançamentos</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 self-start">
              <Link href="/transacoes">Ver</Link>
            </Button>
          </CardHeader>
          <CardContent className="min-w-0 px-4 sm:px-6">
            {recentTransactions.length === 0 ? (
              <EmptyState
                className="border-0 py-8"
                title="Sem transações"
                description="Registre sua primeira movimentação."
                action={
                  <Button asChild size="sm">
                    <Link href="/transacoes?nova=1">Nova transação</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentTransactions.map((tx) => {
                  const meta =
                    tx.type === "TRANSFER" &&
                    tx.account &&
                    tx.transferToAccount
                      ? `${tx.account.name} → ${tx.transferToAccount.name}`
                      : (tx.category?.name ?? null);

                  return (
                    <li
                      key={tx.id}
                      className="flex items-start justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight">
                          {tx.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                          {meta ? ` · ${meta}` : ""}
                        </p>
                      </div>
                      <TransactionAmount
                        type={tx.type}
                        amount={tx.amount}
                        className="w-auto shrink-0 pt-0.5 text-sm"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
