"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-categories";
import { MONTH_LABELS } from "@/lib/labels";
import type { Budget } from "@/types/models";
import { formatCurrency } from "@/utils/currency";
import { getCurrentMonthYear } from "@/utils/date";

const schema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  limitAmount: z.number().positive("Limite deve ser positivo"),
  unitCost: z.number().positive().nullable().optional(),
  quantityLimit: z.number().int().positive().nullable().optional(),
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
      title: budget?.title ?? "",
      description: budget?.description ?? "",
      categoryId: budget?.categoryId ?? "",
      month: budget?.month ?? month,
      year: budget?.year ?? year,
      limitAmount: budget?.limitAmount ?? 0,
      unitCost: budget?.unitCost ?? null,
      quantityLimit: budget?.quantityLimit ?? null,
      alertAt: budget?.alertAt ?? 80,
    },
  });

  const unitCost = useWatch({ control: form.control, name: "unitCost" });
  const quantityLimit = useWatch({
    control: form.control,
    name: "quantityLimit",
  });

  React.useEffect(() => {
    if (
      unitCost != null &&
      unitCost > 0 &&
      quantityLimit != null &&
      quantityLimit > 0
    ) {
      const nextLimit = Math.round(unitCost * quantityLimit * 100) / 100;
      form.setValue("limitAmount", nextLimit, { shouldValidate: true });
    }
  }, [unitCost, quantityLimit, form]);

  async function handleSubmit(values: BudgetFormValues) {
    setPending(true);
    try {
      await onSubmit({
        ...values,
        title: values.title?.trim() || undefined,
        description: values.description?.trim() || undefined,
        unitCost: values.unitCost ?? null,
        quantityLimit: values.quantityLimit ?? null,
      });
    } finally {
      setPending(false);
    }
  }

  const suggestedLimit =
    unitCost != null &&
    unitCost > 0 &&
    quantityLimit != null &&
    quantityLimit > 0
      ? unitCost * quantityLimit
      : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: Limite de energéticos"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Opcional. Se vazio, usa o nome da categoria.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex.: No máximo 10 latas por mês para cortar gasto impulsivo"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="space-y-3 rounded-lg border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">Controle por unidade</p>
            <p className="text-xs text-muted-foreground">
              Opcional. Ex.: custo da lata × quantidade máxima no mês.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="unitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo unitário</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value ?? 0}
                      onValueChange={(value) =>
                        field.onChange(value > 0 ? value : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantityLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qtd. máxima</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Ex.: 10"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          field.onChange(null);
                          return;
                        }
                        const next = Number(raw);
                        field.onChange(
                          Number.isFinite(next) && next > 0
                            ? Math.trunc(next)
                            : null,
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {suggestedLimit != null ? (
            <p className="text-xs text-muted-foreground">
              Limite sugerido:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(suggestedLimit)}
              </span>{" "}
              ({formatCurrency(unitCost!)} × {quantityLimit})
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="limitAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Preenchido automaticamente se informar custo e quantidade.
                </FormDescription>
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
        </div>

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
