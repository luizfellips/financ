"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as LucideIcons from "lucide-react";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MoneyInput } from "@/components/shared/money-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ACCOUNT_ICONS,
  ACCOUNT_TYPE_LABELS,
  CATEGORY_COLORS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Account, AccountType } from "@/types/models";

const schema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(80),
  type: z.enum([
    "CHECKING",
    "SAVINGS",
    "CREDIT",
    "CASH",
    "INVESTMENT",
    "OTHER",
  ]),
  initialBalance: z.number().finite("Saldo inválido"),
  invoiceOpeningAmount: z.number().finite().min(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(40),
  isDefault: z.boolean(),
});

export type AccountFormValues = z.infer<typeof schema>;

type AccountFormProps = {
  account?: Account | null;
  onSubmit: (values: AccountFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

function IconPreview({ name, color }: { name: string; color: string }) {
  const Icon =
    (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name] ??
    LucideIcons.Wallet;
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function AccountForm({
  account,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const [pending, setPending] = React.useState(false);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "CHECKING",
      initialBalance: account?.initialBalance ?? 0,
      invoiceOpeningAmount: 0,
      color: account?.color ?? CATEGORY_COLORS[0],
      icon: account?.icon ?? "Wallet",
      isDefault: account?.isDefault ?? false,
    },
  });

  const color = form.watch("color");
  const icon = form.watch("icon");
  const accountType = form.watch("type");

  async function handleSubmit(values: AccountFormValues) {
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
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <IconPreview name={icon} color={color} />
          <div>
            <p className="text-sm font-medium">Pré-visualização</p>
            <p className="text-xs text-muted-foreground">
              Ícone e cor da conta
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: Nubank, Carteira" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {ACCOUNT_TYPE_LABELS[key]}
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

        <FormField
          control={form.control}
          name="initialBalance"
          render={({ field }) => (
            <FormItem className="sm:max-w-xs">
              <FormLabel>
                {accountType === "CREDIT"
                  ? "Saldo base da conta"
                  : account
                    ? "Saldo inicial"
                    : "Saldo atual"}
              </FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  allowNegative
                />
              </FormControl>
              <FormDescription>
                {accountType === "CREDIT"
                  ? "Em geral deixe 0. O saldo exibido = base − fatura do mês."
                  : account
                    ? "Base do saldo. O saldo do mês = inicial + receitas − despesas até o fim do período."
                    : "Informe o saldo que a conta tem hoje."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {accountType === "CREDIT" && !account ? (
          <FormField
            control={form.control}
            name="invoiceOpeningAmount"
            render={({ field }) => (
              <FormItem className="sm:max-w-xs">
                <FormLabel>Valor inicial da fatura (mês atual)</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value ?? 0}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Dívida já existente neste cartão ao começar o acompanhamento.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
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
                      aria-label={`Cor ${swatch}`}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition",
                        field.value === swatch
                          ? "border-foreground scale-110"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: swatch }}
                      onClick={() => field.onChange(swatch)}
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
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {ACCOUNT_ICONS.map((iconName) => {
                    const Icon =
                      (LucideIcons as unknown as Record<
                        string,
                        LucideIcons.LucideIcon
                      >)[iconName] ?? LucideIcons.Wallet;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md border transition",
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

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border border-border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Conta padrão</FormLabel>
                <FormDescription>
                  Usada como padrão ao criar novas transações.
                </FormDescription>
              </div>
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
