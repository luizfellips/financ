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
import { Textarea } from "@/components/ui/textarea";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import {
  PAYMENT_METHOD_LABELS,
  RECURRENCE_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/labels";
import { toIsoDateOnly } from "@/utils/date";
import type {
  PaymentMethod,
  RecurrenceInterval,
  Transaction,
} from "@/types/models";

const schema = z.object({
  accountId: z.string().min(1, "Selecione uma conta"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  type: z.enum(["INCOME", "EXPENSE"]),
  title: z.string().trim().min(2, "Título obrigatório").max(120),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.string().min(1, "Data obrigatória"),
  notes: z.string().max(2000).optional().nullable(),
  paymentMethod: z.enum([
    "CASH",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "PIX",
    "BANK_TRANSFER",
    "BOLETO",
    "OTHER",
  ]),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  isRecurring: z.boolean(),
  installmentTotal: z.number().int().min(1).max(48).nullable().optional(),
});

export type TransactionFormValues = z.infer<typeof schema>;

type TransactionFormProps = {
  defaultValues?: Partial<TransactionFormValues>;
  lockedType?: "INCOME" | "EXPENSE";
  showInstallments?: boolean;
  transaction?: Transaction | null;
  onSubmit: (values: TransactionFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function TransactionForm({
  defaultValues,
  lockedType,
  showInstallments = false,
  transaction,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: TransactionFormProps) {
  const [pending, setPending] = React.useState(false);
  const { data: accounts = [] } = useAccounts();

  const initialType: "INCOME" | "EXPENSE" =
    lockedType ??
    (transaction?.type === "INCOME" || transaction?.type === "EXPENSE"
      ? transaction.type
      : defaultValues?.type ?? "EXPENSE");

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: transaction?.accountId ?? defaultValues?.accountId ?? "",
      categoryId: transaction?.categoryId ?? defaultValues?.categoryId ?? "",
      type: initialType,
      title: transaction?.title ?? defaultValues?.title ?? "",
      amount: transaction?.amount ?? defaultValues?.amount ?? 0,
      date:
        transaction?.date?.slice(0, 10) ??
        defaultValues?.date ??
        toIsoDateOnly(new Date()),
      notes: transaction?.notes ?? defaultValues?.notes ?? "",
      paymentMethod:
        (transaction?.paymentMethod as PaymentMethod) ??
        defaultValues?.paymentMethod ??
        "PIX",
      recurrence:
        (transaction?.recurrence as RecurrenceInterval) ??
        defaultValues?.recurrence ??
        "NONE",
      isRecurring:
        transaction?.isRecurring ?? defaultValues?.isRecurring ?? false,
      installmentTotal:
        transaction?.installmentTotal ??
        defaultValues?.installmentTotal ??
        null,
    },
  });

  const type = form.watch("type");
  const recurrence = form.watch("recurrence");
  const { data: categories = [] } = useCategories(lockedType ?? type);

  React.useEffect(() => {
    if (lockedType) form.setValue("type", lockedType);
  }, [lockedType, form]);

  React.useEffect(() => {
    form.setValue("isRecurring", recurrence !== "NONE");
  }, [recurrence, form]);

  React.useEffect(() => {
    if (accounts.length && !form.getValues("accountId")) {
      const preferred =
        accounts.find((a) => a.isDefault) ?? accounts[0];
      if (preferred) form.setValue("accountId", preferred.id);
    }
  }, [accounts, form]);

  async function handleSubmit(values: TransactionFormValues) {
    setPending(true);
    try {
      await onSubmit({
        ...values,
        notes: values.notes || null,
        installmentTotal:
          showInstallments && values.type === "EXPENSE"
            ? values.installmentTotal
            : null,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {!lockedType ? (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_1fr]">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("categoryId", "");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(["INCOME", "EXPENSE"] as const).map((key) => (
                        <SelectItem key={key} value={key}>
                          {TRANSACTION_TYPE_LABELS[key]}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Mercado, Salário..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: Mercado, Salário..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
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
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {PAYMENT_METHOD_LABELS[key]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recorrência</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      Object.keys(RECURRENCE_LABELS) as RecurrenceInterval[]
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {RECURRENCE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showInstallments && type === "EXPENSE" ? (
            <FormField
              control={form.control}
              name="installmentTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelas (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={48}
                      placeholder="Ex.: 12"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(
                          value === "" ? null : Number.parseInt(value, 10),
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Opcional"
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
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
