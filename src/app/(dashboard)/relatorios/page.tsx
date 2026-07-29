"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { BudgetUtilizationChart } from "@/components/charts/budget-utilization-chart";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { GoalProgressChart } from "@/components/charts/goal-progress-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { SavingsTrendChart } from "@/components/charts/savings-trend-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReports } from "@/hooks/use-reports";
import { formatCurrency } from "@/utils/currency";
import { MONTH_LABELS } from "@/lib/labels";

export default function ReportsPage() {
  const { data, isLoading, isError, refetch } = useReports();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Relatórios"
          description="Análises e tendências financeiras"
        />
        <LoadingSkeleton variant="kpi" rows={3} />
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
        title="Não foi possível carregar os relatórios"
        description="Tente novamente em instantes."
        action={
          <Button onClick={() => void refetch()}>Tentar novamente</Button>
        }
      />
    );
  }

  const {
    period,
    monthlyCashFlow,
    incomeVsExpenses,
    expensesByCategory,
    savingsTrend,
    budgetUtilization,
    goalProgress,
    summary,
  } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description={`${MONTH_LABELS[period.month - 1]} de ${period.year} · visão dos últimos 12 meses`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receitas do mês</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(incomeVsExpenses.income)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Despesas do mês</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(incomeVsExpenses.expense)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo do mês</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(incomeVsExpenses.difference)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Economia no ano</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(incomeVsExpenses.yearSavings)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {summary.transactionCount} transações · {summary.accountCount} contas
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fluxo de caixa mensal</CardTitle>
            <CardDescription>Receitas e despesas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={monthlyCashFlow} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas vs despesas</CardTitle>
            <CardDescription>Comparativo mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={monthlyCashFlow} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
            <CardDescription>Distribuição do mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart
              data={expensesByCategory.map((item) => ({
                name: item.name,
                amount: item.amount,
                color: item.color,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendência de economia</CardTitle>
            <CardDescription>Saldo mensal (receitas − despesas)</CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsTrendChart data={savingsTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilização de orçamentos</CardTitle>
            <CardDescription>Percentual consumido neste mês</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetUtilizationChart data={budgetUtilization} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progresso das metas</CardTitle>
            <CardDescription>Percentual atingido por meta</CardDescription>
          </CardHeader>
          <CardContent>
            <GoalProgressChart
              data={goalProgress.map((goal) => ({
                name: goal.name,
                percent: goal.percent,
                color: goal.color,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
