"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { MONTH_LABELS } from "@/lib/labels";
import type { Budget } from "@/types/models";
import { getCurrentMonthYear } from "@/utils/date";

const schema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  limitAmount: z.number().positive("Limite deve ser positivo"),
  alertAt: z.number().int().min(1).max(100),
});

export type BudgetFormValues = z.infer<typeof schema>;

type BudgetFormProps = {
  budget?: Budget | null;
  onSubmit: (values: BudgetFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export function BudgetForm({ budget, onSubmit, onCancel }: BudgetFormProps) {
  const [pending, setPending] = React.useState(false);
  const { year, month } = getCurrentMonthYear();
  const { data: categories = [] } = useCategories("EXPENSE");
  const years = Array.from({ length: 5 }, (_, i) => year - 1 + i);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: budget?.categoryId ?? "",
      month: budget?.month ?? month,
      year: budget?.year ?? year,
      limitAmount: budget?.limitAmount ?? 0,
      alertAt: budget?.alertAt ?? 80,
    },
  });

  async function handleSubmit(values: BudgetFormValues) {
    setPending(true);
    try {
      await onSubmit(values);
    } finally {
      setPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MONTH_LABELS.map((label, index) => (
                      <SelectItem key={label} value={String(index + 1)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="limitAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite</FormLabel>
              <FormControl>
                <MoneyInput value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alertAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alerta em (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
