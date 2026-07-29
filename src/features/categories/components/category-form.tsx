"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as LucideIcons from "lucide-react";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/models";

const schema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(60),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(40),
});

export type CategoryFormValues = z.infer<typeof schema>;

type CategoryFormProps = {
  category?: Category | null;
  defaultType?: "INCOME" | "EXPENSE";
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

function IconPreview({ name, color }: { name: string; color: string }) {
  const Icon =
    (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name] ??
    LucideIcons.Tag;
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function CategoryForm({
  category,
  defaultType = "EXPENSE",
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [pending, setPending] = React.useState(false);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      type:
        category?.type === "TRANSFER"
          ? "TRANSFER"
          : category?.type === "INCOME"
            ? "INCOME"
            : defaultType === "INCOME"
              ? "INCOME"
              : "EXPENSE",
      color: category?.color ?? CATEGORY_COLORS[0],
      icon: category?.icon ?? "Tag",
    },
  });

  const color = form.watch("color");
  const icon = form.watch("icon");

  async function handleSubmit(values: CategoryFormValues) {
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
              Ícone e cor da categoria
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
                  <Input placeholder="Ex.: Alimentação" {...field} />
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={Boolean(category?.isSystem)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {category?.type === "TRANSFER" ? (
                      <SelectItem value="TRANSFER">
                        {TRANSACTION_TYPE_LABELS.TRANSFER}
                      </SelectItem>
                    ) : (
                      (["INCOME", "EXPENSE"] as const).map((key) => (
                        <SelectItem key={key} value={key}>
                          {TRANSACTION_TYPE_LABELS[key]}
                        </SelectItem>
                      ))
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
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {CATEGORY_ICONS.map((iconName) => {
                    const Icon =
                      (LucideIcons as unknown as Record<
                        string,
                        LucideIcons.LucideIcon
                      >)[iconName] ?? LucideIcons.Tag;
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
