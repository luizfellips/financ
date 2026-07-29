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
import { Textarea } from "@/components/ui/textarea";
import { toIsoDateOnly } from "@/utils/date";

const schema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  note: z.string().max(500).optional().nullable(),
  date: z.string().optional(),
});

export type ContributionFormValues = z.infer<typeof schema>;

type ContributionFormProps = {
  onSubmit: (values: ContributionFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export function ContributionForm({
  onSubmit,
  onCancel,
}: ContributionFormProps) {
  const [pending, setPending] = React.useState(false);
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      note: "",
      date: toIsoDateOnly(new Date()),
    },
  });

  async function handleSubmit(values: ContributionFormValues) {
    setPending(true);
    try {
      await onSubmit({
        ...values,
        note: values.note || null,
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor da contribuição</FormLabel>
              <FormControl>
                <MoneyInput value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  value={field.value ?? ""}
                  onChange={field.onChange}
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
              "Contribuir"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
