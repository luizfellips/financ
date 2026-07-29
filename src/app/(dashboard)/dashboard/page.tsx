"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
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
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Visão geral das suas finanças"
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

  const { kpis, upcomingBills, budgetProgress, goalProgress, recentTransactions } =
    data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral das suas finanças este mês"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/receitas?nova=1">
                <ArrowUpRight className="mr-1.5 h-4 w-4" />
                Receita
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/despesas?nova=1">
                <Plus className="mr-1.5 h-4 w-4" />
                Despesa
              </Link>
            </Button>
          </div>
        }
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <KpiCard
          title="Saldo total"
          value={kpis.balance}
          icon={Wallet}
          description="Todas as contas"
        />
        <KpiCard
          title="Receitas do mês"
          value={kpis.monthlyIncome}
          icon={ArrowUpRight}
        />
        <KpiCard
          title="Despesas do mês"
          value={kpis.monthlyExpense}
          icon={ArrowDownLeft}
        />
        <KpiCard
          title="Economia do mês"
          value={kpis.monthlySavings}
          icon={TrendingUp}
        />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Orçamentos</CardTitle>
              <CardDescription>Progresso do mês atual</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/orcamentos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <div key={budget.id} className="space-y-1">
                  <StatProgress
                    label={budget.categoryName}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Metas</CardTitle>
              <CardDescription>Progresso das suas metas</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/metas">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximas contas</CardTitle>
            <CardDescription>Recorrências nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBills.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma conta recorrente prevista
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingBills.map((bill, index) => (
                  <li
                    key={`${bill.title}-${bill.dueDate}-${index}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{bill.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(bill.dueDate)} · {bill.category.name}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums text-destructive">
                      {formatCurrency(bill.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Transações recentes</CardTitle>
              <CardDescription>Últimos lançamentos</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transacoes">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
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
                {recentTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{tx.title}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {tx.type === "INCOME" ? "Receita" : "Despesa"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                        {tx.category ? ` · ${tx.category.name}` : ""}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-medium tabular-nums",
                        tx.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground",
                      )}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
