"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/utils/currency";

type IncomeExpensePoint = {
  label: string;
  income: number;
  expense: number;
};

export function IncomeExpenseChart({ data }: { data: IncomeExpensePoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) =>
              formatCurrency(value).replace(/\s/g, "")
            }
            width={72}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
            }}
            formatter={(value) => formatCurrency(Number(value ?? 0))}
          />
          <Legend />
          <Bar
            dataKey="income"
            name="Receitas"
            fill="var(--chart-2)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Despesas"
            fill="var(--chart-5)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
