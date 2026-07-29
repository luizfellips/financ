"use client";

import { ArrowLeftRight, Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { toIsoDateOnly } from "@/utils/date";
import type { PaymentMethod, Transaction } from "@/types/models";

const schema = z
  .object({
    accountId: z.string().min(1, "Selecione a conta de origem"),
    transferToAccountId: z.string().min(1, "Selecione a conta de destino"),
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
  })
  .refine((data) => data.accountId !== data.transferToAccountId, {
    message: "Conta de destino deve ser diferente da origem",
    path: ["transferToAccountId"],
  });

export type TransferFormValues = z.infer<typeof schema> & {
  type: "TRANSFER";
  categoryId?: undefined;
  recurrence: "NONE";
  isRecurring: false;
  installmentTotal: null;
};

type TransferFormProps = {
  transaction?: Transaction | null;
  onSubmit: (values: TransferFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function TransferForm({
  transaction,
  onSubmit,
  onCancel,
  submitLabel = "Transferir",
}: TransferFormProps) {
  const [pending, setPending] = React.useState(false);
  const { data: accounts = [] } = useAccounts();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: transaction?.accountId ?? "",
      transferToAccountId: transaction?.transferToAccountId ?? "",
      title: transaction?.title ?? "Transferência entre contas",
      amount: transaction?.amount ?? 0,
      date:
        transaction?.date?.slice(0, 10) ?? toIsoDateOnly(new Date()),
      notes: transaction?.notes ?? "",
      paymentMethod:
        (transaction?.paymentMethod as PaymentMethod) ?? "PIX",
    },
  });

  React.useEffect(() => {
    if (accounts.length && !form.getValues("accountId")) {
      const preferred = accounts.find((a) => a.isDefault) ?? accounts[0];
      if (preferred) form.setValue("accountId", preferred.id);
    }
  }, [accounts, form]);

  const fromId = form.watch("accountId");
  const destinationAccounts = accounts.filter((a) => a.id !== fromId);

  async function handleSubmit(values: z.infer<typeof schema>) {
    setPending(true);
    try {
      await onSubmit({
        ...values,
        notes: values.notes || null,
        type: "TRANSFER",
        recurrence: "NONE",
        isRecurring: false,
        installmentTotal: null,
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Transferência Nubank → Itaú" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta origem</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (form.getValues("transferToAccountId") === value) {
                      form.setValue("transferToAccountId", "");
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="De" />
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
          <div className="hidden justify-center pb-2 text-muted-foreground sm:flex">
            <ArrowLeftRight className="h-4 w-4" aria-hidden />
          </div>
          <FormField
            control={form.control}
            name="transferToAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta destino</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Para" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {destinationAccounts.map((account) => (
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
        </div>

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma</FormLabel>
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
