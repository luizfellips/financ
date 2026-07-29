"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BudgetBar = {
  categoryName: string;
  percent: number;
  alertAt: number;
  categoryColor: string;
};

export function BudgetUtilizationChart({ data }: { data: BudgetBar[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Nenhum orçamento neste mês
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(value: number) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="categoryName"
            width={100}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
            }}
            formatter={(value) => `${Number(value ?? 0).toFixed(0)}%`}
          />
          <Bar dataKey="percent" name="Utilização" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.categoryName}
                fill={
                  entry.percent >= 100
                    ? "var(--destructive)"
                    : entry.percent >= entry.alertAt
                      ? "var(--chart-4)"
                      : entry.categoryColor
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
