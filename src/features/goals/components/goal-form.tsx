"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as LucideIcons from "lucide-react";
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
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types/models";

const schema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(100),
  targetAmount: z.number().positive("Meta deve ser positiva"),
  savedAmount: z.number().min(0),
  deadline: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(40),
});

export type GoalFormValues = z.infer<typeof schema>;

type GoalFormProps = {
  goal?: Goal | null;
  onSubmit: (values: GoalFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [pending, setPending] = React.useState(false);
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: goal?.name ?? "",
      targetAmount: goal?.targetAmount ?? 0,
      savedAmount: goal?.savedAmount ?? 0,
      deadline: goal?.deadline?.slice(0, 10) ?? "",
      color: goal?.color ?? "#22c55e",
      icon: goal?.icon ?? "Target",
    },
  });

  async function handleSubmit(values: GoalFormValues) {
    setPending(true);
    try {
      await onSubmit({
        ...values,
        deadline: values.deadline ? values.deadline : null,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Reserva de emergência" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor alvo</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="savedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Já poupado</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem className="sm:max-w-xs">
              <FormLabel>Prazo (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        field.value === swatch
                          ? "border-foreground scale-110"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: swatch }}
                      onClick={() => field.onChange(swatch)}
                      aria-label={swatch}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ícone</FormLabel>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {CATEGORY_ICONS.map((iconName) => {
                    const Icon =
                      (LucideIcons as unknown as Record<
                        string,
                        LucideIcons.LucideIcon
                      >)[iconName] ?? LucideIcons.Target;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md border",
                          field.value === iconName
                            ? "border-foreground bg-muted"
                            : "border-border hover:bg-muted/60",
                        )}
                        onClick={() => field.onChange(iconName)}
                        aria-label={iconName}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
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
